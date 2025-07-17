import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { User, Mail, FileCheck, FileX, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { getUsersPassengerDetails, PassengerDetailsResponse, PassengerDetail, ApiError } from '@/api'

const Passengers = () => {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [documentFilter, setDocumentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiPassengers, setApiPassengers] = useState<PassengerDetail[]>([])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch passengers from API
  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getUsersPassengerDetails()

        if ('data' in response) {
          const passengerResponse = response as PassengerDetailsResponse
          setApiPassengers(passengerResponse.data)
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message)
          setApiPassengers([]) // Clear any existing data
        }
      } catch (err) {
        console.error('Error fetching passengers:', err)
        setError('Failed to load passenger information')
        setApiPassengers([]) // Clear any existing data
      } finally {
        setLoading(false)
      }
    }

    fetchPassengers()
  }, [])

  // Convert API data to component format
  const passengers = useMemo(() => {
    return apiPassengers.map((passenger) => ({
      id: `P${passenger.passengerId}`,
      name: `${passenger.firstName} ${passenger.lastName}`,
      email: 'N/A', // API doesn't provide email
      flightNumber: `FL${passenger.passengerFlightId}`, // Use passengerFlightId
      seatNumber: 'N/A', // API doesn't provide seat number
      ticketClass: 'Economy', // Default
      status: passenger.mainPassenger ? 'Checked In' : 'Pending',
      hasDocuments: passenger.passengerDocuments.length > 0,
      phone: 'N/A', // API doesn't provide phone
      nationality: passenger.nationality || passenger.passengerDocuments[0]?.nationality || 'N/A',
      passportNumber: passenger.passengerDocuments[0]?.documentNumber || 'N/A',
    }))
  }, [apiPassengers])



  // Filter passengers based on search and filters
  const filteredPassengers = useMemo(() => {
    return passengers.filter(passenger => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        passenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        passenger.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        passenger.flightNumber.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || passenger.status === statusFilter

      // Document filter
      const matchesDocument = documentFilter === 'all' ||
        (documentFilter === 'with-documents' && passenger.hasDocuments) ||
        (documentFilter === 'without-documents' && !passenger.hasDocuments)

      return matchesSearch && matchesStatus && matchesDocument
    })
  }, [passengers, searchQuery, statusFilter, documentFilter])

  // Calculate statistics
  const totalPassengers = passengers.length
  const passengersWithDocuments = passengers.filter(p => p.hasDocuments).length
  const passengersWithoutDocuments = passengers.filter(p => !p.hasDocuments).length

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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Passengers</h1>
          <p className="mt-2 text-gray-600">Manage passenger information and bookings</p>
        </div>
      </div>

      {/* Stats Cards - Hidden on mobile */}
      {!isMobile && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Passengers</CardTitle>
              <User className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPassengers}</div>
              <p className="text-xs text-gray-600">Current passengers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Passengers with Documents</CardTitle>
              <FileCheck className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passengersWithDocuments}</div>
              <p className="text-xs text-green-600">{Math.round((passengersWithDocuments / totalPassengers) * 100)}% of total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Passengers without Documents</CardTitle>
              <FileX className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{passengersWithoutDocuments}</div>
              <p className="text-xs text-red-600">{Math.round((passengersWithoutDocuments / totalPassengers) * 100)}% of total</p>
            </CardContent>
          </Card>
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Checked In">Checked In</option>
                    <option value="Boarded">Boarded</option>
                  </select>
                  <select
                    value={documentFilter}
                    onChange={(e) => setDocumentFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="all">All Documents</option>
                    <option value="with-documents">With Documents</option>
                    <option value="without-documents">Without Documents</option>
                  </select>
                </div>
              </div>
              {isMobile ? (
            // Mobile Card Layout
            <div className="space-y-4">
              {filteredPassengers.map((passenger) => (
                <div
                  key={passenger.id}
                  className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/passengers/${passenger.id}`, {
                    state: {
                      passengerData: apiPassengers.find(p => `P${p.passengerId}` === passenger.id)
                    }
                  })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-900">{passenger.name}</div>
                      {!passenger.hasDocuments && (
                        <Badge variant="destructive" className="ml-2">Missing Documents</Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/passengers/${passenger.id}`)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table Layout
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPassengers.map((passenger) => (
                    <TableRow
                      key={passenger.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/passengers/${passenger.id}`, {
                        state: {
                          passengerData: apiPassengers.find(p => `P${p.passengerId}` === passenger.id)
                        }
                      })}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{passenger.name}</span>
                          {!passenger.hasDocuments && (
                            <Badge variant="destructive" className="ml-2">Missing Documents</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/passengers/${passenger.id}`)
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Passengers
