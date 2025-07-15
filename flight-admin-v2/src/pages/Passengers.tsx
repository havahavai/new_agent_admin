import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { User, Mail, FileCheck, FileX, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const Passengers = () => {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [documentFilter, setDocumentFilter] = useState('all')

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const passengers = [
    {
      id: 'P001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      flightNumber: 'AA1234',
      seatNumber: '12A',
      ticketClass: 'Business',
      status: 'Checked In',
      hasDocuments: true,
      phone: '+1-555-0123',
      nationality: 'US',
      passportNumber: 'US123456789',
    },
    {
      id: 'P002',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      flightNumber: 'UA5678',
      seatNumber: '8C',
      ticketClass: 'Economy',
      status: 'Boarded',
      hasDocuments: true,
      phone: '+1-555-0234',
      nationality: 'US',
      passportNumber: 'US987654321',
    },
    {
      id: 'P003',
      name: 'Michael Brown',
      email: 'mbrown@email.com',
      flightNumber: 'DL9012',
      seatNumber: '15F',
      ticketClass: 'First Class',
      status: 'Pending',
      hasDocuments: false,
      phone: '+1-555-0345',
      nationality: 'US',
      passportNumber: '',
    },
    {
      id: 'P004',
      name: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      flightNumber: 'BA2468',
      seatNumber: '3B',
      ticketClass: 'First Class',
      status: 'Checked In',
      hasDocuments: true,
      phone: '+44-20-7946-0958',
      nationality: 'UK',
      passportNumber: 'GB123456789',
    },
    {
      id: 'P005',
      name: 'David Chen',
      email: 'david.chen@email.com',
      flightNumber: 'SQ1357',
      seatNumber: '22E',
      ticketClass: 'Economy',
      status: 'Pending',
      hasDocuments: false,
      phone: '+65-6123-4567',
      nationality: 'SG',
      passportNumber: '',
    },
    {
      id: 'P006',
      name: 'Maria Garcia',
      email: 'maria.garcia@email.com',
      flightNumber: 'IB9876',
      seatNumber: '18D',
      ticketClass: 'Business',
      status: 'Boarded',
      hasDocuments: true,
      phone: '+34-91-123-4567',
      nationality: 'ES',
      passportNumber: 'ES987654321',
    },
    {
      id: 'P007',
      name: 'James Anderson',
      email: 'james.anderson@email.com',
      flightNumber: 'LH4321',
      seatNumber: '9A',
      ticketClass: 'Economy',
      status: 'Checked In',
      hasDocuments: false,
      phone: '+49-30-12345678',
      nationality: 'DE',
      passportNumber: '',
    },
    {
      id: 'P008',
      name: 'Lisa Thompson',
      email: 'lisa.thompson@email.com',
      flightNumber: 'AF7890',
      seatNumber: '14C',
      ticketClass: 'Business',
      status: 'Pending',
      hasDocuments: true,
      phone: '+33-1-23-45-67-89',
      nationality: 'FR',
      passportNumber: 'FR456789123',
    },
  ]



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

  return (
    <div className="space-y-8">
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
          {/* Search and Filter Controls */}
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
                  onClick={() => navigate(`/passengers/${passenger.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{passenger.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {passenger.email}
                      </div>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPassengers.map((passenger) => (
                    <TableRow
                      key={passenger.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/passengers/${passenger.id}`)}
                    >
                      <TableCell className="font-medium">{passenger.name}</TableCell>
                      <TableCell>{passenger.email}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}

export default Passengers
