import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, User, Mail, Phone, Users, Pencil, ChevronUp, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { getClients, addClient, updateClient, mergeClients, Client, AddClientPayload, UpdateClientPayload, MergeClientsPayload } from '@/api/clients.service'
import { ApiError } from '@/api/types'

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Selection state
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set())
  const [isMerging, setIsMerging] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Dialog states
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // Add client state
  const [addData, setAddData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'individual' as 'individual' | 'corporate',
    countryCode: ''
  })

  // Edit client state
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    countryCode: '',
    type: 'individual' as 'individual' | 'corporate'
  })

  // Merge state
  const [mergeData, setMergeData] = useState({
    mainClientEmail: '',
    clientName: ''
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch clients
  useEffect(() => {
    let isCancelled = false
    const abortController = new AbortController()

    const fetchClients = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await getClients(abortController.signal)

        if (isCancelled) {
          return
        }

        if ('success' in response && response.success) {
          setClients(response.data || [])
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message || 'Failed to load clients')
          setClients([])
        }
      } catch (err) {
        if (isCancelled || (err as Error).name === 'AbortError') {
          return
        }
        console.error('Error fetching clients:', err)
        setError('Failed to load clients')
        setClients([])
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchClients()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [])

  // Filter clients based on search query (case-insensitive)
  const filteredClients = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return clients
    }

    const query = debouncedSearchQuery.toLowerCase().trim()
    return clients.filter(client => {
      const nameMatch = client.name?.toLowerCase().includes(query) || false
      const emailMatch = client.email?.toLowerCase().includes(query) || false
      return nameMatch || emailMatch
    })
  }, [clients, debouncedSearchQuery])

  // Selection handlers
  const handleSelectClient = useCallback((clientId: number, checked: boolean) => {
    // Validate clientId - allow 0 as valid ID
    if (clientId === null || clientId === undefined || isNaN(Number(clientId))) {
      console.error('Invalid clientId in handleSelectClient:', clientId)
      return
    }

    const numericId = Number(clientId)

    // Use functional update to ensure we have the latest state
    setSelectedClients(prev => {
      const newSelected = new Set(prev)
      
      if (checked === true) {
        newSelected.add(numericId)
      } else if (checked === false) {
        newSelected.delete(numericId)
      }
      
      return newSelected
    })
  }, [])

  // Create memoized handlers for each client to prevent unnecessary re-renders and ensure correct binding
  const createClientHandler = useCallback((clientId: number) => {
    return (checked: boolean) => {
      if (clientId && !isNaN(Number(clientId))) {
        handleSelectClient(Number(clientId), checked)
      }
    }
  }, [handleSelectClient])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = new Set(
        filteredClients
          .filter(c => c.clientId !== null && c.clientId !== undefined && !isNaN(Number(c.clientId)))
          .map(c => Number(c.clientId))
      )
      setSelectedClients(allIds)
    } else {
      setSelectedClients(new Set())
    }
  }, [filteredClients])

  const selectionState = useMemo(() => {
    const isAllSelected = filteredClients.length > 0 && selectedClients.size === filteredClients.length
    const isIndeterminate = selectedClients.size > 0 && selectedClients.size < filteredClients.length
    return { isAllSelected, isIndeterminate }
  }, [filteredClients.length, selectedClients.size])

  // Merge handlers
  const handleMergeSelected = () => {
    const selectedClientData = clients.filter(c => selectedClients.has(c.clientId))
    if (selectedClientData.length > 0) {
      const firstClient = selectedClientData[0]
      setMergeData({
        mainClientEmail: firstClient.email || '',
        clientName: firstClient.name || ''
      })
    }
    setShowMergeDialog(true)
  }

  const confirmMerge = async () => {
    try {
      setIsMerging(true)
      const clientIds = Array.from(selectedClients)

      const payload: MergeClientsPayload = {
        clientIds,
        mainClientEmail: mergeData.mainClientEmail,
        clientName: mergeData.clientName
      }

      const result = await mergeClients(payload)

      if ('success' in result && result.success) {
        // Refresh the client list
        const response = await getClients()
        if ('success' in response && response.success) {
          setClients(response.data || [])
        }
        setSelectedClients(new Set())
        setShowMergeDialog(false)
        setMergeData({
          mainClientEmail: '',
          clientName: ''
        })
      } else {
        setError(result.message || 'Failed to merge clients')
      }
    } catch (err) {
      console.error('Error merging clients:', err)
      setError('Failed to merge clients')
    } finally {
      setIsMerging(false)
    }
  }

  // Add client handlers
  const handleAddClient = () => {
    setAddData({
      name: '',
      email: '',
      phone: '',
      type: 'individual',
      countryCode: ''
    })
    setShowAddDialog(true)
  }

  const confirmAddClient = async () => {
    try {
      setIsAdding(true)
      setError(null)

      if (!addData.name || !addData.email) {
        setError('Name and email are required')
        setIsAdding(false)
        return
      }

      // Extract country code from phone if phone is provided
      let countryCode = addData.countryCode
      let phone = addData.phone
      
      if (phone && !countryCode) {
        // Try to extract country code from phone number
        const phoneMatch = phone.match(/^\+(\d+)/)
        if (phoneMatch) {
          countryCode = phoneMatch[1]
          phone = phone.replace(/^\+\d+/, '')
        }
      }

      const payload: AddClientPayload = {
        name: addData.name,
        email: addData.email,
        phone: phone || undefined,
        type: addData.type,
        countryCode: countryCode || undefined
      }

      const result = await addClient(payload)

      if ('success' in result && result.success) {
        // Refresh the client list
        const response = await getClients()
        if ('success' in response && response.success) {
          setClients(response.data || [])
        }
        setShowAddDialog(false)
        setAddData({
          name: '',
          email: '',
          phone: '',
          type: 'individual',
          countryCode: ''
        })
      } else {
        setError(result.message || 'Failed to add client')
      }
    } catch (err) {
      console.error('Error adding client:', err)
      setError('Failed to add client')
    } finally {
      setIsAdding(false)
    }
  }

  // Edit client handlers
  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setEditData({
      name: client.name || '',
      phone: client.phone || '',
      countryCode: client.countryCode || '',
      type: client.type || 'individual'
    })
    setShowEditDialog(true)
  }

  const confirmEditClient = async () => {
    if (!editingClient) return

    try {
      setIsUpdating(true)
      setError(null)

      // Validate editingClient has a valid ID - allow 0 as valid ID
      if (editingClient.clientId === null || editingClient.clientId === undefined || isNaN(Number(editingClient.clientId))) {
        setError('Invalid client ID. Cannot update client without a valid ID.')
        setIsUpdating(false)
        return
      }

      if (!editData.name) {
        setError('Name is required')
        setIsUpdating(false)
        return
      }

      // Extract country code from phone if phone is provided
      let countryCode = editData.countryCode
      let phone = editData.phone
      
      if (phone && !countryCode) {
        const phoneMatch = phone.match(/^\+(\d+)/)
        if (phoneMatch) {
          countryCode = phoneMatch[1]
          phone = phone.replace(/^\+\d+/, '')
        }
      }

      const payload: UpdateClientPayload = {
        clientId: editingClient.clientId,
        updates: {
          name: editData.name,
          phone: phone || undefined,
          countryCode: countryCode || undefined,
          type: editData.type
        }
      }

      const result = await updateClient(payload)

      if ('success' in result && result.success) {
        // Refresh the client list
        const response = await getClients()
        if ('success' in response && response.success) {
          setClients(response.data || [])
        }
        setShowEditDialog(false)
        setEditingClient(null)
        setEditData({
          name: '',
          phone: '',
          countryCode: '',
          type: 'individual'
        })
      } else {
        setError(result.message || 'Failed to update client')
      }
    } catch (err) {
      console.error('Error updating client:', err)
      setError('Failed to update client')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{filteredClients.length}</p>
            </div>
          </div>
          <Button
            onClick={handleAddClient}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <User className="h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Buttons */}
      {selectedClients.size > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-sm text-blue-700 font-medium">
            {selectedClients.size} client{selectedClients.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2 sm:ml-auto">
            {selectedClients.size >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMergeSelected}
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

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No clients found' : 'No clients available'}
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'No clients have been added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClients.size > 0 && selectedClients.size === filteredClients.filter(c => c.clientId !== null && c.clientId !== undefined).length}
                    onCheckedChange={(checked) => {
                      const validClients = filteredClients.filter(c => c.clientId !== null && c.clientId !== undefined)
                      if (checked) {
                        setSelectedClients(new Set(validClients.map(c => Number(c.clientId))))
                      } else {
                        setSelectedClients(new Set())
                      }
                    }}
                  />
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Name
                    <div className="flex flex-col">
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                      <ChevronDown className="h-3 w-3 text-gray-400 -mt-1" />
                    </div>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Email
                    <div className="flex flex-col">
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                      <ChevronDown className="h-3 w-3 text-gray-400 -mt-1" />
                    </div>
                  </div>
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client, index) => {
                const clientId = client.clientId !== null && client.clientId !== undefined ? Number(client.clientId) : null
                const isSelected = clientId !== null ? selectedClients.has(clientId) : false
                
                return (
                  <TableRow 
                    key={client.clientId !== null && client.clientId !== undefined ? `client-${client.clientId}` : `client-undefined-${index}`}
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (clientId !== null && clientId !== undefined) {
                            handleSelectClient(clientId, checked === true)
                          }
                        }}
                        aria-label={`Select ${client.name || 'client'}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{client.name || 'Unknown Client'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{client.email || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{client.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.type && (
                        <Badge variant="secondary" className="text-xs">
                          {client.type === 'corporate' ? 'Corporate' : 'Individual'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 font-medium">{client.bookingCount || 0}</span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditClient(client)
                        }}
                        aria-label={`Edit ${client.name}`}
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Merge Clients Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Merge {selectedClients.size} Clients
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Combine selected clients into one record. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6">
            <div>
              <Label htmlFor="mergeClientName" className="text-sm font-medium">Client Name *</Label>
              <Input
                id="mergeClientName"
                value={mergeData.clientName}
                onChange={(e) => setMergeData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Enter client name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mergeClientEmail" className="text-sm font-medium">Main Client Email *</Label>
              <Input
                id="mergeClientEmail"
                type="email"
                value={mergeData.mainClientEmail}
                onChange={(e) => setMergeData(prev => ({ ...prev, mainClientEmail: e.target.value }))}
                placeholder="Enter main client email"
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
              disabled={isMerging || !mergeData.clientName || !mergeData.mainClientEmail}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isMerging ? 'Merging...' : 'Merge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Add New Client
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Enter the client details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6">
            <div>
              <Label htmlFor="addName" className="text-sm font-medium">Name *</Label>
              <Input
                id="addName"
                value={addData.name}
                onChange={(e) => setAddData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter client name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="addEmail" className="text-sm font-medium">Email *</Label>
              <Input
                id="addEmail"
                type="email"
                value={addData.email}
                onChange={(e) => setAddData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter client email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="addPhone" className="text-sm font-medium">Phone</Label>
              <div className="mt-1">
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={addData.phone}
                  onChange={(value) => {
                    setAddData(prev => ({ ...prev, phone: value || '' }))
                    // Extract country code
                    if (value) {
                      const match = value.match(/^\+(\d+)/)
                      if (match) {
                        setAddData(prev => ({ ...prev, countryCode: match[1] }))
                      }
                    }
                  }}
                  className="phone-input-wrapper"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="addType" className="text-sm font-medium">Type</Label>
              <Select
                value={addData.type}
                onValueChange={(value) => setAddData(prev => ({ ...prev, type: value as 'individual' | 'corporate' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={confirmAddClient}
              disabled={isAdding || !addData.name || !addData.email}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isAdding ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Pencil className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Edit Client
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Update the client details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-6">
            <div>
              <Label htmlFor="editName" className="text-sm font-medium">Name *</Label>
              <Input
                id="editName"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter client name"
                className="mt-1"
              />
            </div>
            {editingClient?.email && (
              <div>
                <Label htmlFor="editEmail" className="text-sm font-medium">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingClient.email}
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            )}
            <div>
              <Label htmlFor="editPhone" className="text-sm font-medium">Phone</Label>
              <div className="mt-1">
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={editData.phone}
                  onChange={(value) => {
                    setEditData(prev => ({ ...prev, phone: value || '' }))
                    // Extract country code
                    if (value) {
                      const match = value.match(/^\+(\d+)/)
                      if (match) {
                        setEditData(prev => ({ ...prev, countryCode: match[1] }))
                      }
                    }
                  }}
                  className="phone-input-wrapper"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editType" className="text-sm font-medium">Type</Label>
              <Select
                value={editData.type}
                onValueChange={(value) => setEditData(prev => ({ ...prev, type: value as 'individual' | 'corporate' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false)
                setEditingClient(null)
              }}
              disabled={isUpdating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEditClient}
              disabled={isUpdating || !editData.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? 'Updating...' : 'Update Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Clients
