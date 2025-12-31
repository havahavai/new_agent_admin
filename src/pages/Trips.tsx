import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Upload, Plane, Calendar, MapPin, User, ChevronLeft, ChevronRight, ArrowRight, Filter, X, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getTickets, Ticket } from '@/api/tickets.service'
import { ApiError } from '@/api/types'
import UploadTicketModal from '@/components/UploadTicketModal'
import { getCountryFlag } from '@/utils/countryFlags'

// Helper function to format date for table (MM/DD/YYYY)
const formatDateForTable = (dateString: string): string => {
  const clean = dateString.replace(/Z$/, '')
  const dateMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})T/)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`
  }
  const date = new Date(clean)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

// Helper function to format date and time (remove trailing Z, no timezone conversion)
const formatDateTime = (dateString: string): string => {
  // Remove trailing Z before parsing
  const clean = dateString.replace(/Z$/, '')
  
  // Parse date components directly from ISO string without timezone conversion
  // Format: "2025-03-26T00:00:00.000" -> extract components
  const dateMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
  if (!dateMatch) {
    // Fallback if format doesn't match
    const date = new Date(clean)
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
    const yearShort = date.getFullYear().toString().slice(-2)
    return `${weekday}, ${day} ${month} ${yearShort} • ${time}`
  }
  
  const [, year, month, day, hour, minute] = dateMatch
  const monthNum = parseInt(month, 10) - 1 // JavaScript months are 0-indexed
  const dayNum = parseInt(day, 10)
  const hourNum = parseInt(hour, 10)
  const minuteNum = parseInt(minute, 10)
  
  // Create date using UTC to avoid timezone conversion, then format in UTC
  const date = new Date(Date.UTC(parseInt(year, 10), monthNum, dayNum, hourNum, minuteNum))
  
  // Format: "Thu, 25 Dec 25 • 05:30 AM" (with year)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  const monthName = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  const yearShort = year.slice(-2) // Get last 2 digits of year (e.g., "25" from "2025")
  
  // Format time in 12-hour format from UTC values
  let hour12 = hourNum % 12
  if (hour12 === 0) hour12 = 12
  const ampm = hourNum >= 12 ? 'PM' : 'AM'
  const minuteStr = minuteNum.toString().padStart(2, '0')
  const time = `${hour12}:${minuteStr} ${ampm}`
  
  return `${weekday}, ${dayNum} ${monthName} ${yearShort} • ${time}`
}

const Trips = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [timeframe, setTimeframe] = useState<'upcoming' | 'past'>('upcoming')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [pnr, setPnr] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [sector, setSector] = useState('')
  const [sectorError, setSectorError] = useState<string | null>(null)

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  
  // Filter popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Validate sector format
  const validateSector = (value: string): boolean => {
    if (!value) return true // Empty is valid (optional filter)
    const sectorRegex = /^[A-Z]{3}-[A-Z]{3}$/
    return sectorRegex.test(value)
  }

  const handleSectorChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setSector(upperValue)
    if (upperValue && !validateSector(upperValue)) {
      setSectorError('Sector must be in format: XXX-XXX (e.g., DEL-BOM)')
    } else {
      setSectorError(null)
    }
  }

  // Fetch tickets - only when Flight Bookings route is active
  useEffect(() => {
    // Only fetch if we're on the Flight Bookings route
    const isTripsRoute = location.pathname === '/trips'
    if (!isTripsRoute) {
      return
    }

    let isCancelled = false
    const abortController = new AbortController()

    const fetchTickets = async () => {
      try {
        setLoading(true)
        setError(null)

        const params: any = {
          timeframe,
          page,
          limit,
        }

        // Add filters if provided
        if (pnr.trim()) {
          params.pnr = pnr.trim()
        }
        if (clientEmail.trim()) {
          params.clientEmail = clientEmail.trim()
        }
        if (sector.trim() && validateSector(sector)) {
          params.sector = sector.trim()
        }

        console.log('Flight Bookings: Fetching tickets API...')
        const response = await getTickets(params, abortController.signal)
        console.log('Flight Bookings: API response:', response)

        if (isCancelled) {
          return
        }

        if ('success' in response && response.success) {
          setTickets(response.data.tickets || [])
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages)
            setTotal(response.pagination.total)
          }
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message || 'Failed to load trips')
          setTickets([])
        }
      } catch (err) {
        if (isCancelled || (err as Error).name === 'AbortError') {
          return
        }
        console.error('Error fetching tickets:', err)
        setError('Failed to load trips')
        setTickets([])
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchTickets()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [location.pathname, timeframe, page, limit, pnr, clientEmail, sector])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [timeframe, pnr, clientEmail, sector])

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false)
    // Refresh the list
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trips...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle, Filter, and Upload Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={timeframe === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setTimeframe('upcoming')}
            className={`flex items-center gap-2 ${
              timeframe === 'upcoming' 
                ? 'bg-gray-900 text-white hover:bg-gray-800' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Upcoming
          </Button>
          <Button
            variant={timeframe === 'past' ? 'default' : 'outline'}
            onClick={() => setTimeframe('past')}
            className={`flex items-center gap-2 ${
              timeframe === 'past' 
                ? 'bg-gray-900 text-white hover:bg-gray-800' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Past
          </Button>
        </div>
        <div className="flex gap-2">
          {/* Filter Popover */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {(pnr || clientEmail || sector) && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {(pnr ? 1 : 0) + (clientEmail ? 1 : 0) + (sector ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="filter-pnr" className="text-sm font-medium text-gray-900">PNR</Label>
                    <Input
                      id="filter-pnr"
                      value={pnr}
                      onChange={(e) => setPnr(e.target.value)}
                      placeholder="Enter PNR"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter-clientEmail" className="text-sm font-medium text-gray-900">Client Email</Label>
                    <Input
                      id="filter-clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Enter client email"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter-sector" className="text-sm font-medium text-gray-900">Sector (e.g., DEL-BOM)</Label>
                    <Input
                      id="filter-sector"
                      value={sector}
                      onChange={(e) => handleSectorChange(e.target.value)}
                      placeholder="DEL-BOM"
                      className="mt-1"
                      maxLength={7}
                    />
                    {sectorError && (
                      <p className="text-sm text-red-600 mt-1">{sectorError}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPnr('')
                      setClientEmail('')
                      setSector('')
                      setSectorError(null)
                    }}
                    className="flex items-center gap-2"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Upload className="h-4 w-4" />
            Upload Ticket
          </Button>
        </div>
      </div>

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

      {/* Tickets Table */}
      {tickets.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-500">
              {pnr || clientEmail || sector
                ? 'Try adjusting your filters'
                : `No ${timeframe} trips available`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>PNR</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Client
                    <div className="flex flex-col">
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                      <ChevronDown className="h-3 w-3 text-gray-400 -mt-1" />
                    </div>
                  </div>
                </TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Travel Date
                    <div className="flex flex-col">
                      <ChevronUp className="h-3 w-3 text-gray-400" />
                      <ChevronDown className="h-3 w-3 text-gray-400 -mt-1" />
                    </div>
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const clients = ticket.clients && ticket.clients.length > 0
                  ? ticket.clients.map(c => c.name || c.email).join(', ')
                  : 'Unknown Client'
                const sector = `${ticket.departure.iata}-${ticket.arrival.iata}`
                const travelDate = formatDateForTable(ticket.departure.date)
                const status = ticket.status === 'pending' ? 'Pending' : 'Booked'
                
                return (
                  <TableRow 
                    key={ticket.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/trips/${ticket.id}`)}
                  >
                    <TableCell className="font-medium">{ticket.pnr}</TableCell>
                    <TableCell>{clients}</TableCell>
                    <TableCell>{sector}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {travelDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} trips
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Ticket Modal */}
      <UploadTicketModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}

export default Trips
