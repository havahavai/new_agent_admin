import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MemoizedCheckbox } from '@/components/ui/MemoizedCheckbox'
import { PassengerTableRow } from '@/components/PassengerTableRow'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, FileCheck, FileX, Search, ChevronUp, ChevronDown, Trash2, Users, AlertTriangle } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getUsersPassengerDetails, PassengerDetailsResponse, PassengerDetail, ApiError, GetUserId, getJwtToken } from '@/api'
import { bulkDeletePassengers } from '@/api/deletePassenger'
import { newMergePassengers } from '@/api/mergePassengers'
import { addPassenger } from '@/api/addPassenger'

const Passengers = () => {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [documentFilter, setDocumentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiPassengers, setApiPassengers] = useState<PassengerDetail[]>([])
  const [sortField, setSortField] = useState<'name' | 'firstName' | 'lastName' | 'numberOfFlights' | null>('numberOfFlights')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Selection state
  const [selectedPassengers, setSelectedPassengers] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Merge state
  const [mergeData, setMergeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    countryOfResidence: ''
  })

  // Add passenger state
  const [addData, setAddData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Debounce search query to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch passengers from API
  useEffect(() => {
    let isCancelled = false
    const abortController = new AbortController()

    const fetchPassengers = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Passengers: Starting API call to getUsersPassengerDetails')
        const response = await getUsersPassengerDetails(abortController.signal)

        // Check if component was unmounted or effect was cancelled
        if (isCancelled) {
          console.log('Passengers: API call cancelled')
          return
        }

        if ('data' in response) {
          const passengerResponse = response as PassengerDetailsResponse
          setApiPassengers(passengerResponse.data)
          console.log('Passengers: API call completed successfully')
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message)
          setApiPassengers([]) // Clear any existing data
          console.log('Passengers: API call returned error:', errorResponse.message)
        }
      } catch (err) {
        if (isCancelled || (err as Error).name === 'AbortError') {
          console.log('Passengers: API call was aborted')
          return
        }
        console.error('Error fetching passengers:', err)
        setError('Failed to load passenger information')
        setApiPassengers([]) // Clear any existing data
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchPassengers()

    return () => {
      console.log('Passengers: Cleanup - aborting API call')
      isCancelled = true
      abortController.abort()
    }
  }, [])

  // Convert API data to component format
  const passengers = useMemo(() => {
    return apiPassengers.map((passenger) => {
      // Process names to ensure proper separation
      let processedFirstName = passenger.firstName || ''
      let processedLastName = passenger.lastName || ''

      // Check if lastName contains both first and last names (common API issue)
      if (processedLastName.includes(' ') && processedFirstName && processedLastName.startsWith(processedFirstName)) {
        // Extract only the last name part
        processedLastName = processedLastName.replace(processedFirstName, '').trim()
      }

      // Check if firstName contains both names and lastName is empty or same as firstName
      if (processedFirstName.includes(' ') && (!processedLastName || processedLastName === processedFirstName)) {
        const nameParts = processedFirstName.split(' ')
        processedFirstName = nameParts[0]
        processedLastName = nameParts.slice(1).join(' ')
      }

      return {
        id: `P${passenger.passengerId}`,
        name: `${processedFirstName} ${processedLastName}`.trim(),
        firstName: processedFirstName,
        lastName: processedLastName,
        email: 'N/A', // API doesn't provide email
        flightNumber: `FL${passenger.passengerFlightId}`, // Use passengerFlightId
        seatNumber: 'N/A', // API doesn't provide seat number
        ticketClass: '', // Default
        numberOfFlights: passenger.numberOfFlights, // Add number of flights from API
        hasDocuments: passenger.passengerDocuments.length > 0,
        phone: 'N/A', // API doesn't provide phone
        nationality: passenger.nationality || passenger.passengerDocuments[0]?.nationality || 'N/A',
        passportNumber: passenger.passengerDocuments[0]?.documentNumber || 'N/A',
      }
    })
  }, [apiPassengers])



  // Handle sorting
  const handleSort = (field: 'name' | 'firstName' | 'lastName' | 'numberOfFlights') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Optimized selection handlers with useCallback and immediate state update
  const handleSelectPassenger = useCallback((passengerId: string, checked: boolean) => {
    // Use functional update to ensure we have the latest state
    setSelectedPassengers(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(passengerId)
      } else {
        newSelected.delete(passengerId)
      }
      return newSelected
    })
  }, [])

  // Create memoized handlers for each passenger to prevent unnecessary re-renders
  const createPassengerHandler = useCallback((passengerId: string) => {
    return (checked: boolean) => handleSelectPassenger(passengerId, checked)
  }, [handleSelectPassenger])



  // Delete handlers
  const handleDeleteSelected = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      const passengerIds = Array.from(selectedPassengers).map(id => parseInt(id.replace('P', '')))

      const result = await bulkDeletePassengers(passengerIds)

      if ('success' in result && result.success) {
        // Refresh the passenger list
        const response = await getUsersPassengerDetails()
        if ('data' in response) {
          setApiPassengers(response.data)
        }
        setSelectedPassengers(new Set())
        setShowDeleteDialog(false)
      } else {
        setError(result.message || 'Failed to delete passengers')
      }
    } catch (err) {
      console.error('Error deleting passengers:', err)
      setError('Failed to delete passengers')
    } finally {
      setIsDeleting(false)
    }
  }

  // Merge handlers
  const handleMergeSelected = () => {
    // Pre-populate merge data with data from selected passengers
    const selectedPassengerData = passengers.filter(p => selectedPassengers.has(p.id))
    if (selectedPassengerData.length > 0) {
      const firstPassenger = selectedPassengerData[0]
      setMergeData({
        firstName: firstPassenger.name.split(' ')[0] || '',
        lastName: firstPassenger.name.split(' ').slice(1).join(' ') || '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        nationality: firstPassenger.nationality || '',
        countryOfResidence: ''
      })
    }
    setShowMergeDialog(true)
  }

  const confirmMerge = async () => {
    try {
      setIsMerging(true)
      const selectedIds = Array.from(selectedPassengers)
      const passengerIds = selectedIds.map(id => parseInt(id.replace('P', '')))

      // Get userId from JWT token
      const jwtToken = getJwtToken()
      const userId = GetUserId(jwtToken)

      const result = await newMergePassengers(
        passengerIds,
        {
          firstName: mergeData.firstName,
          lastName: mergeData.lastName,
          email: mergeData.email,
        },
        userId.toString()
      )

      if ('success' in result && result.success) {
        // Refresh the passenger list
        const response = await getUsersPassengerDetails()
        if ('data' in response) {
          setApiPassengers(response.data)
        }
        setSelectedPassengers(new Set())
        setShowMergeDialog(false)
        setMergeData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          nationality: '',
          countryOfResidence: ''
        })
      } else {
        setError(result.message || 'Failed to merge passengers')
      }
    } catch (err) {
      console.error('Error merging passengers:', err)
      setError('Failed to merge passengers')
    } finally {
      setIsMerging(false)
    }
  }

  // Add passenger handlers
  const handleAddPassenger = () => {
    setAddData({
      firstName: '',
      lastName: '',
      email: ''
    })
    setShowAddDialog(true)
  }

  const confirmAddPassenger = async () => {
    try {
      setIsAdding(true)

      // Get userId from JWT token
      const jwtToken = getJwtToken()
      const userId = GetUserId(jwtToken)

      const result = await addPassenger(
        addData.firstName,
        addData.lastName,
        addData.email,
        userId.toString()
      )

      if ('success' in result && result.success) {
        // Refresh the passenger list
        const response = await getUsersPassengerDetails()
        if ('data' in response) {
          setApiPassengers(response.data)
        }
        setShowAddDialog(false)
        setAddData({
          firstName: '',
          lastName: '',
          email: ''
        })
      } else {
        setError(result.message || 'Failed to add passenger')
      }
    } catch (err) {
      console.error('Error adding passenger:', err)
      setError('Failed to add passenger')
    } finally {
      setIsAdding(false)
    }
  }

  // Filter and sort passengers
  const filteredPassengers = useMemo(() => {
    let filtered = passengers.filter(passenger => {
      // Exclude passengers with null or empty names
      const hasValidName = passenger.name && passenger.name.trim() !== ''

      // Search filter - optimized with early return
      if (debouncedSearchQuery !== '') {
        const query = debouncedSearchQuery.toLowerCase()
        const matchesSearch = passenger.name.toLowerCase().includes(query) ||
          passenger.email.toLowerCase().includes(query) ||
          passenger.flightNumber.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Document filter
      const matchesDocument = documentFilter === 'all' ||
        (documentFilter === 'with-documents' && passenger.hasDocuments) ||
        (documentFilter === 'without-documents' && !passenger.hasDocuments)

      return hasValidName && matchesDocument
    })

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: string | number
        let bValue: string | number

        if (sortField === 'name') {
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
        } else if (sortField === 'firstName') {
          aValue = a.firstName.toLowerCase()
          bValue = b.firstName.toLowerCase()
        } else if (sortField === 'lastName') {
          aValue = a.lastName.toLowerCase()
          bValue = b.lastName.toLowerCase()
        } else if (sortField === 'numberOfFlights') {
          aValue = a.numberOfFlights || 0
          bValue = b.numberOfFlights || 0
        } else {
          return 0
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [passengers, debouncedSearchQuery, documentFilter, sortField, sortDirection])

  // Handle select all functionality
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredPassengers.map(p => p.id))
      setSelectedPassengers(allIds)
    } else {
      setSelectedPassengers(new Set())
    }
  }, [filteredPassengers])

  // Memoized selection state calculations
  const selectionState = useMemo(() => {
    const isAllSelected = filteredPassengers.length > 0 && selectedPassengers.size === filteredPassengers.length
    const isIndeterminate = selectedPassengers.size > 0 && selectedPassengers.size < filteredPassengers.length
    return { isAllSelected, isIndeterminate }
  }, [filteredPassengers.length, selectedPassengers.size])

  // Memoized statistics calculations
  const statistics = useMemo(() => {
    const totalPassengers = passengers.length
    const passengersWithDocuments = passengers.filter(p => p.hasDocuments).length
    const passengersWithoutDocuments = passengers.filter(p => !p.hasDocuments).length
    const totalFlights = passengers.reduce((sum, passenger) => sum + (passenger.numberOfFlights || 0), 0)
    return { totalPassengers, passengersWithDocuments, passengersWithoutDocuments, totalFlights }
  }, [passengers])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading passengers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}



      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          {/* No Data Message */}
          {!loading && !error && passengers.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No passenger data available</p>
              <p className="text-gray-500 text-sm">Please check your connection and try again</p>
            </div>
          )}

          {/* Search and Filter Controls */}
          {passengers.length > 0 && (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search passengers by name, email, or flight..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={documentFilter}
                    onChange={(e) => setDocumentFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">All Documents</option>
                    <option value="with-documents">With Documents</option>
                    <option value="without-documents">Without Documents</option>
                  </select>
                  <Button
                    onClick={handleAddPassenger}
                    className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                  >
                    <User className="h-4 w-4" />
                    <span>Add Passenger</span>
                  </Button>
                </div>
              </div>

              {/* Bulk Action Buttons */}
              {selectedPassengers.size > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-sm text-blue-700 font-medium">
                    {selectedPassengers.size} passenger{selectedPassengers.size !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSelected()}
                      disabled={isDeleting}
                      className="flex items-center space-x-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{isDeleting ? 'Deleting...' : 'Delete Selected'}</span>
                    </Button>
                    {selectedPassengers.size >= 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMergeSelected()}
                        disabled={isMerging}
                        className="flex items-center space-x-1"
                      >
                        <Users className="h-4 w-4" />
                        <span>{isMerging ? 'Merging...' : 'Merge Selected'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isMobile ? (
            // Mobile Card Layout
            <div className="space-y-4">
              {filteredPassengers.map((passenger) => (
                <div
                  key={passenger.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-2 cursor-pointer flex-1"
                      onClick={() => navigate(`/passengers/${passenger.id}`)}
                    >
                      <div className="font-medium text-gray-900">{passenger.name}</div>
                      {!passenger.hasDocuments && (
                        <FileX className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <MemoizedCheckbox
                      checked={selectedPassengers.has(passenger.id)}
                      onCheckedChange={createPassengerHandler(passenger.id)}
                      ariaLabel={`Select ${passenger.name}`}
                    />
                  </div>
                  {!passenger.hasDocuments && (
                    <div className="text-sm">
                      <Badge variant="destructive" className="text-xs">Document Missing</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table Layout with Stats Cards
            <div className="flex gap-6">
              {/* Table Container */}
              <div className="flex-1">
                <div className="border rounded-lg overflow-hidden">
                  <div className="relative max-h-96 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10 border-b">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectionState.isAllSelected}
                              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                              aria-label="Select all passengers"
                            />
                          </TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort('firstName')}
                              className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                            >
                              <span>First Name</span>
                              {sortField === 'firstName' ? (
                                sortDirection === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )
                              ) : (
                                <ChevronUp className="h-4 w-4 opacity-30" />
                              )}
                            </button>
                          </TableHead>
                          <TableHead>
                            <button
                              onClick={() => handleSort('lastName')}
                              className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
                            >
                              <span>Last Name</span>
                              {sortField === 'lastName' ? (
                                sortDirection === 'asc' ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )
                              ) : (
                                <ChevronUp className="h-4 w-4 opacity-30" />
                              )}
                            </button>
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPassengers.map((passenger) => (
                          <PassengerTableRow
                            key={passenger.id}
                            passenger={passenger}
                            isSelected={selectedPassengers.has(passenger.id)}
                            onSelectionChange={createPassengerHandler(passenger.id)}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Stats Cards - Vertical Layout on Right */}
              <div className="w-64 space-y-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-xs font-medium text-gray-600">Total Passengers</CardTitle>
                    <User className="h-3 w-3 text-gray-400" />
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="text-xl font-bold">{statistics.totalPassengers}</div>
                    <p className="text-xs text-gray-600">Current passengers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-xs font-medium text-gray-600">With Documents</CardTitle>
                    <FileCheck className="h-3 w-3 text-green-400" />
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="text-xl font-bold">{statistics.passengersWithDocuments}</div>
                    <p className="text-xs text-green-600">{statistics.totalPassengers > 0 ? Math.round((statistics.passengersWithDocuments / statistics.totalPassengers) * 100) : 0}% of total</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                    <CardTitle className="text-xs font-medium text-gray-600">Missing Documents</CardTitle>
                    <FileX className="h-3 w-3 text-red-400" />
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="text-xl font-bold">{statistics.passengersWithoutDocuments}</div>
                    <p className="text-xs text-red-600">{statistics.totalPassengers > 0 ? Math.round((statistics.passengersWithoutDocuments / statistics.totalPassengers) * 100) : 0}% of total</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Delete {selectedPassengers.size} Passenger{selectedPassengers.size !== 1 ? 's' : ''}?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              This action cannot be undone. The selected passenger{selectedPassengers.size !== 1 ? 's' : ''} will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Passengers Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Merge {selectedPassengers.size} Passengers
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Combine selected passengers into one record. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="firstName"
                  value={mergeData.firstName}
                  onChange={(e) => setMergeData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="lastName"
                  value={mergeData.lastName}
                  onChange={(e) => setMergeData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={mergeData.email}
                onChange={(e) => setMergeData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowMergeDialog(false)}
              disabled={isMerging}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmMerge}
              disabled={isMerging || !mergeData.firstName || !mergeData.lastName}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isMerging ? 'Merging...' : 'Merge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Passenger Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Add New Passenger
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Enter the passenger details below to add a new passenger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addFirstName" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="addFirstName"
                  value={addData.firstName}
                  onChange={(e) => setAddData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="addLastName" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="addLastName"
                  value={addData.lastName}
                  onChange={(e) => setAddData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="addEmail" className="text-sm font-medium">Email</Label>
              <Input
                id="addEmail"
                type="email"
                value={addData.email}
                onChange={(e) => setAddData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isAdding}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddPassenger}
              disabled={isAdding || !addData.firstName || !addData.lastName}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isAdding ? 'Adding...' : 'Add Passenger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Passengers
