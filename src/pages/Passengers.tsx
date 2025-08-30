import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MemoizedCheckbox } from '@/components/ui/MemoizedCheckbox'
import { PassengerTableRow } from '@/components/PassengerTableRow'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, FileCheck, FileX, Search, ChevronUp, ChevronDown, Trash2, Users, AlertTriangle, Upload, FileText } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

import { countries } from '@/data/countries'
import { getUsersPassengerDetails, PassengerDetailsResponse, PassengerDetail, ApiError, GetUserId, getJwtToken, uploadUserDocument, UploadDocumentResponse } from '@/api'
import { bulkDeletePassengers } from '@/api/deletePassenger'
import { newMergePassengers } from '@/api/mergePassengers'
import { addPassenger } from '@/api/addPassenger'
import { addPassport } from '@/api/addPassport'
import { updatePassenger } from '@/api/updatePassenger'

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
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    countryOfResidence: ''
  })

  // Passport upload state for add passenger dialog
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [isUploadingPassport, setIsUploadingPassport] = useState(false)
  const [passportUploadSuccess, setPassportUploadSuccess] = useState<string | null>(null)
  const [passportUploadError, setPassportUploadError] = useState<string | null>(null)
  const [extractedPassportData, setExtractedPassportData] = useState({
    passportNumber: '',
    dateOfIssue: '',
    dateOfExpiry: '',
    placeOfIssue: '',
    nationality: ''
  })
  const [hasPassportData, setHasPassportData] = useState(false)

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

  // Passport upload handlers for add passenger dialog
  const handlePassportFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset previous state
    setPassportUploadError(null)
    setPassportUploadSuccess(null)
    setHasPassportData(false)

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      setPassportUploadError('Please upload a PDF, JPEG, JPG, or PNG file.')
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setPassportUploadError('File size must be less than 10MB.')
      return
    }

    // Validate file name (basic check)
    if (file.name.length > 255) {
      setPassportUploadError('File name is too long.')
      return
    }

    setPassportFile(file)

    // Upload and extract passport data using the new API
    try {
      setIsUploadingPassport(true)

      // Get user ID from JWT token
      const jwtToken = getJwtToken()
      if (!jwtToken) {
        setPassportUploadError('Authentication token not found. Please login again.')
        return
      }

      const userId = GetUserId(jwtToken)
      if (!userId) {
        setPassportUploadError('Unable to get user ID from authentication token.')
        return
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('files', file)

      console.log('Uploading passport with userId:', userId)

      // Use the new passport upload API
      const response = await fetch(
        `https://prod-api.flyo.ai/core/v1/b2bUser/uploadPassport?userId=${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Passport upload API error:', response.status, errorText)
        setPassportUploadError(`Upload failed: ${response.status} ${response.statusText}`)
        return
      }

      const result = await response.json()
      console.log('Passport upload API response:', result)

      if (result.success && result.data) {
        // Check if we have LLM results (extracted passport data)
        if (result.data.llmResult && result.data.llmResult.length > 0) {
          const extractedData = result.data.llmResult[0]

          if (extractedData.is_passport) {
            // Format dates from YYYY-MM-DD to DD/MM/YYYY
            const formatDate = (dateStr: string) => {
              if (!dateStr) return ''
              try {
                const date = new Date(dateStr)
                if (!isNaN(date.getTime())) {
                  return date.toLocaleDateString('en-GB') // DD/MM/YYYY format
                }
                return dateStr
              } catch {
                return dateStr || ''
              }
            }

            const extractedPassportData = {
              passportNumber: extractedData.passport_number || '',
              dateOfIssue: formatDate(extractedData.issue_date),
              dateOfExpiry: formatDate(extractedData.date_of_expiry),
              placeOfIssue: extractedData.issue_place || '',
              nationality: extractedData.nationality || ''
            }

            // Auto-fill name fields if they're empty
            if (!addData.firstName && extractedData.first_name) {
              setAddData(prev => ({ ...prev, firstName: extractedData.first_name }))
            }
            if (!addData.lastName && extractedData.last_name) {
              setAddData(prev => ({ ...prev, lastName: extractedData.last_name }))
            }

            // Set extracted passport data
            setExtractedPassportData(extractedPassportData)
            setHasPassportData(true)
            setPassportUploadSuccess('Passport uploaded and data extracted successfully!')

            // Show success message with details
            const extractedFields = []
            if (extractedData.first_name) extractedFields.push('First Name')
            if (extractedData.last_name) extractedFields.push('Last Name')
            if (extractedData.passport_number) extractedFields.push('Passport Number')
            if (extractedData.date_of_expiry) extractedFields.push('Expiry Date')
            if (extractedData.nationality) extractedFields.push('Nationality')
            if (extractedData.issue_place) extractedFields.push('Place of Issue')

            if (extractedFields.length > 0) {
              setPassportUploadSuccess(`Passport processed successfully! Extracted: ${extractedFields.join(', ')}`)
            }
          } else {
            setPassportUploadError('The uploaded document does not appear to be a valid passport.')
          }
        } else {
          setPassportUploadError('No passport data could be extracted from the document. Please try with a clearer image.')
        }

        setTimeout(() => setPassportUploadSuccess(null), 7000)
      } else {
        const errorMessage = result.message || 'Failed to process passport document.'
        setPassportUploadError(errorMessage)
      }
    } catch (err) {
      console.error('Passport upload error:', err)
      if (err instanceof Error) {
        setPassportUploadError(`Upload failed: ${err.message}`)
      } else {
        setPassportUploadError('An unexpected error occurred while uploading the passport. Please try again.')
      }
    } finally {
      setIsUploadingPassport(false)
    }
  }

  // Add passenger handlers
  const handleAddPassenger = () => {
    setAddData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      nationality: '',
      countryOfResidence: ''
    })
    // Reset passport state
    setPassportFile(null)
    setIsUploadingPassport(false)
    setPassportUploadSuccess(null)
    setPassportUploadError(null)
    setExtractedPassportData({
      passportNumber: '',
      dateOfIssue: '',
      dateOfExpiry: '',
      placeOfIssue: '',
      nationality: ''
    })
    setHasPassportData(false)
    setShowAddDialog(true)
  }

  const confirmAddPassenger = async () => {
    try {
      setIsAdding(true)
      setError(null)

      // Get userId from JWT token
      const jwtToken = getJwtToken()
      const userId = GetUserId(jwtToken)

      // Step 1: Add the passenger
      const result = await addPassenger(
        addData.firstName,
        addData.lastName,
        addData.email,
        userId.toString()
      )

      if ('success' in result && result.success) {
        // Get the updated passenger list to find the new passenger ID
        const response = await getUsersPassengerDetails()
        if ('data' in response) {
          setApiPassengers(response.data)

          // Find the newly created passenger
          const newPassenger = response.data.find(p =>
            p.firstName === addData.firstName &&
            p.lastName === addData.lastName &&
            p.email === addData.email
          )

          if (newPassenger) {
            const passengerIdNumber = newPassenger.passengerId.toString()

            // Step 2: Update passenger with additional details if provided
            const hasAdditionalData = addData.phone || addData.dateOfBirth || addData.gender || addData.nationality || addData.countryOfResidence

            if (hasAdditionalData) {
              try {
                // Convert nationality code back to nationality name for API if needed
                const nationalityForApi = addData.nationality ?
                  countries.find(country => country.code === addData.nationality)?.nationality || addData.nationality
                  : ''

                const updateResult = await updatePassenger(
                  passengerIdNumber,
                  addData.firstName,
                  addData.lastName,
                  addData.phone || '',
                  addData.email || '',
                  addData.dateOfBirth,
                  addData.gender,
                  nationalityForApi,
                  addData.countryOfResidence
                )

                if (!('success' in updateResult && updateResult.success)) {
                  console.warn('Failed to update passenger details:', updateResult.message)
                }
              } catch (updateErr) {
                console.error('Error updating passenger details:', updateErr)
              }
            }

            // Step 3: If we have passport data, add it to the newly created passenger
            if (hasPassportData && extractedPassportData.passportNumber) {
              try {
                // Convert dates from DD/MM/YYYY to YYYY-MM-DD format for API
                const convertDateFormat = (dateStr: string) => {
                  if (!dateStr) return ''
                  try {
                    const parts = dateStr.split('/')
                    if (parts.length === 3) {
                      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                    }
                    return dateStr
                  } catch {
                    return dateStr
                  }
                }

                const passportResult = await addPassport(
                  parseInt(passengerIdNumber),
                  extractedPassportData.passportNumber,
                  convertDateFormat(extractedPassportData.dateOfIssue),
                  convertDateFormat(extractedPassportData.dateOfExpiry),
                  extractedPassportData.placeOfIssue
                )

                if (!('success' in passportResult && passportResult.success)) {
                  console.warn('Failed to add passport data:', passportResult.message)
                }
              } catch (passportErr) {
                console.error('Error adding passport data:', passportErr)
              }
            }
          }
        }

        // Step 3: Refresh the passenger list one more time to get the complete data
        const finalResponse = await getUsersPassengerDetails()
        if ('data' in finalResponse) {
          setApiPassengers(finalResponse.data)
        }

        // Step 4: Close dialog and reset state
        setShowAddDialog(false)
        setAddData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          gender: '',
          nationality: '',
          countryOfResidence: ''
        })
        // Reset passport state
        setPassportFile(null)
        setIsUploadingPassport(false)
        setPassportUploadSuccess(null)
        setPassportUploadError(null)
        setExtractedPassportData({
          passportNumber: '',
          dateOfIssue: '',
          dateOfExpiry: '',
          placeOfIssue: '',
          nationality: ''
        })
        setHasPassportData(false)
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
                      <div className="font-medium text-gray-900">{passenger.name.toUpperCase()}</div>
                      {!passenger.hasDocuments && (
                        <FileX className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <MemoizedCheckbox
                      checked={selectedPassengers.has(passenger.id)}
                      onCheckedChange={createPassengerHandler(passenger.id)}
                      ariaLabel={`Select ${passenger.name.toUpperCase()}`}
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
        <DialogContent className="dialog-narrow w-full max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Add New Passenger
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Enter the passenger details below and optionally upload a passport to auto-fill passport information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            {/* Passport Upload Section - Moved to Top */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Passport Upload (Optional)</h4>
                {hasPassportData && (
                  <Badge variant="secondary" className="text-green-600 bg-green-50">
                    <FileCheck className="h-3 w-3 mr-1" />
                    Extracted
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Upload a passport document to automatically extract and fill the form fields below.
              </p>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {!passportFile ? (
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload passport document</p>
                    <input
                      type="file"
                      id="passport-upload-add"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handlePassportFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('passport-upload-add')?.click()}
                      disabled={isUploadingPassport}
                      className="text-sm"
                    >
                      {isUploadingPassport ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">{passportFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPassportFile(null)
                        setHasPassportData(false)
                        setExtractedPassportData({
                          passportNumber: '',
                          dateOfIssue: '',
                          dateOfExpiry: '',
                          placeOfIssue: '',
                          nationality: ''
                        })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {passportUploadSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  {passportUploadSuccess}
                </div>
              )}
              {passportUploadError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {passportUploadError}
                </div>
              )}
            </div>

            {/* Basic Information Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Basic Information</h4>

              {/* First Line: Gender, First Name, Last Name */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="addGender" className="text-sm font-medium">Gender</Label>
                  <Select
                    value={addData.gender}
                    onValueChange={(value) => setAddData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="addFirstName" className="text-sm font-medium">First Name *</Label>
                  <Input
                    id="addFirstName"
                    value={addData.firstName}
                    onChange={(e) => setAddData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="addLastName" className="text-sm font-medium">Last Name *</Label>
                  <Input
                    id="addLastName"
                    value={addData.lastName}
                    onChange={(e) => setAddData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Second Line: Mobile Number, Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="addPhone" className="text-sm font-medium">Mobile Number</Label>
                  <Input
                    id="addPhone"
                    type="tel"
                    value={addData.phone}
                    onChange={(e) => setAddData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter mobile number"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="addEmail" className="text-sm font-medium">Email</Label>
                  <Input
                    id="addEmail"
                    type="email"
                    value={addData.email}
                    onChange={(e) => setAddData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="mt-1 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <Label htmlFor="addDateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                <Input
                  id="addDateOfBirth"
                  type="date"
                  value={addData.dateOfBirth}
                  onChange={(e) => setAddData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="mt-1 h-9 text-sm"
                />
              </div>

              {/* Document Number */}
              <div>
                <Label htmlFor="addDocumentNumber" className="text-sm font-medium">Document Number *</Label>
                <Input
                  id="addDocumentNumber"
                  value={extractedPassportData.passportNumber}
                  onChange={(e) => setExtractedPassportData(prev => ({ ...prev, passportNumber: e.target.value }))}
                  placeholder="Enter document/passport number"
                  className="mt-1 h-9 text-sm"
                />
              </div>

              {/* Date of Issue and Date of Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="addDateOfIssue" className="text-sm font-medium">Date of Issue</Label>
                  <Input
                    id="addDateOfIssue"
                    type="date"
                    value={extractedPassportData.dateOfIssue ? extractedPassportData.dateOfIssue.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value
                      const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('en-GB') : ''
                      setExtractedPassportData(prev => ({ ...prev, dateOfIssue: formattedDate }))
                    }}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="addDateOfExpiry" className="text-sm font-medium">Date of Expiry *</Label>
                  <Input
                    id="addDateOfExpiry"
                    type="date"
                    value={extractedPassportData.dateOfExpiry ? extractedPassportData.dateOfExpiry.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const dateValue = e.target.value
                      const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('en-GB') : ''
                      setExtractedPassportData(prev => ({ ...prev, dateOfExpiry: formattedDate }))
                    }}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Country of Nationality and Country of Residence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="addNationality" className="text-sm font-medium">Country of Nationality</Label>
                  <Select
                    value={addData.nationality}
                    onValueChange={(value) => setAddData(prev => ({ ...prev, nationality: value }))}
                  >
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="addCountryOfResidence" className="text-sm font-medium">Country of Residence</Label>
                  <Select
                    value={addData.countryOfResidence}
                    onValueChange={(value) => setAddData(prev => ({ ...prev, countryOfResidence: value }))}
                  >
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Place of Issue */}
              <div>
                <Label htmlFor="addPlaceOfIssue" className="text-sm font-medium">Place of Issue *</Label>
                <Input
                  id="addPlaceOfIssue"
                  value={extractedPassportData.placeOfIssue}
                  onChange={(e) => setExtractedPassportData(prev => ({ ...prev, placeOfIssue: e.target.value }))}
                  placeholder="Enter place of issue"
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                // Reset all state when canceling
                setAddData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  dateOfBirth: '',
                  gender: '',
                  nationality: '',
                  countryOfResidence: ''
                })
                setPassportFile(null)
                setIsUploadingPassport(false)
                setPassportUploadSuccess(null)
                setPassportUploadError(null)
                setExtractedPassportData({
                  passportNumber: '',
                  dateOfIssue: '',
                  dateOfExpiry: '',
                  placeOfIssue: '',
                  nationality: ''
                })
                setHasPassportData(false)
              }}
              disabled={isAdding || isUploadingPassport}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAddPassenger}
              disabled={isAdding || isUploadingPassport || !addData.firstName || !addData.lastName}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {hasPassportData ? 'Adding Passenger & Passport...' : 'Adding Passenger...'}
                </>
              ) : (
                <>
                  Add Passenger
                  {hasPassportData && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                      +Passport
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Passengers
