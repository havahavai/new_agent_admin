import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getTickets, Ticket } from '@/api/tickets.service'
import { ApiError } from '@/api/types'
import { Plane, ChevronLeft, ChevronRight, Calendar, ChevronUp, ChevronDown } from 'lucide-react'

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

// Helper function to get UTC date string from ISO string
const getUTCDateString = (isoString: string): string => {
  const date = new Date(isoString)
  return date.getUTCFullYear() + '-' +
         String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
         String(date.getUTCDate()).padStart(2, '0')
}

// Helper function to get date string from Date object (YYYY-MM-DD format)
// Normalizes to UTC to avoid timezone shifts
const getDateString = (date: Date): string => {
  // Get local date components to avoid timezone shifts
  // Then create UTC date at midnight for consistent date string
  const localYear = date.getFullYear()
  const localMonth = date.getMonth()
  const localDay = date.getDate()
  
  // Create UTC date at midnight using local date components
  const utcDate = new Date(Date.UTC(localYear, localMonth, localDay, 0, 0, 0, 0))
  
  return utcDate.getUTCFullYear() + '-' +
         String(utcDate.getUTCMonth() + 1).padStart(2, '0') + '-' +
         String(utcDate.getUTCDate()).padStart(2, '0')
}

// Helper function to generate carousel data from sortedData
const getDateCarouselDataFromSortedData = (
  sortedData: { [key: string]: Ticket[] } | undefined,
  options?: { days?: number; startDate?: Date }
) => {
  const days = options?.days ?? 30
  const startDate = options?.startDate ?? new Date()
  
  // Generate date range
  const dates: Date[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }

  // Map dates to carousel format using sortedData
  return dates.map((date) => {
    const dateString = getDateString(date)
    const ticketsForDate = sortedData?.[dateString] || []
    return {
      date,
      hasFlights: ticketsForDate.length > 0,
      flightCount: ticketsForDate.length,
    }
  })
}

// Simple date carousel component
const SimpleDateCarousel = ({ dates, selectedDate, onDateSelect, onLoadNext }: any) => {
  const formatDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short' })
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
    // If near the end, load more dates
    if (onLoadNext && carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      if (scrollLeft + clientWidth >= scrollWidth - 100) {
        onLoadNext()
      }
    }
  }

  return (
    <div className="relative">
      {/* Left Arrow */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-md p-2 shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5 text-gray-600" />
      </button>

      {/* Date Carousel */}
      <div 
        ref={carouselRef}
        className="overflow-x-auto"
        style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#d1d5db #f3f4f6',
        }}
      >
        <div className="flex gap-3 px-12 py-4 min-w-max">
          {dates.map((dateItem: any, index: number) => {
            const selected = isSelected(dateItem.date)
            const hasFlights = dateItem.hasFlights

            return (
              <button
                key={index}
                onClick={() => hasFlights && onDateSelect(dateItem.date)}
                disabled={!hasFlights}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-lg transition-all ${
                  selected
                    ? 'bg-gray-900 text-white'
                    : hasFlights
                    ? 'bg-white text-gray-900 border border-gray-200 hover:border-gray-300 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {formatDayOfWeek(dateItem.date)}
                </div>
                <div className="text-xl font-bold mb-1">
                  {dateItem.date.getDate()}
                </div>
                <div className="text-xs font-medium">
                  {formatMonth(dateItem.date)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Arrow */}
      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-md p-2 shadow-sm hover:bg-gray-50 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  )
}

// Helper function to find first date with flights
const findFirstDateWithFlights = (carouselData: any[]): Date => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // First try to find today
  const todayItem = carouselData.find(item => item.date.toDateString() === today.toDateString())
  if (todayItem && todayItem.hasFlights) {
    return today
  }
  
  // Find first date with flights
  const firstWithFlights = carouselData.find(item => item.hasFlights)
  if (firstWithFlights) {
    return firstWithFlights.date
  }
  
  // Fallback to today
  return today
}

const BookingCalendar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [carouselStartDate] = useState(new Date())
  const [carouselDays, setCarouselDays] = useState(30)
  const [dateCarouselData, setDateCarouselData] = useState<any[]>(() =>
    getDateCarouselDataFromSortedData(undefined, { days: 30, startDate: new Date() })
  )
  const [ticketsForSelectedDate, setTicketsForSelectedDate] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortedData, setSortedData] = useState<{ [key: string]: Ticket[] } | undefined>(undefined)

  // Fetch tickets from API - only when Calendar View route is active
  useEffect(() => {
    // Only fetch if we're on the Calendar View route
    const isCalendarViewRoute = location.pathname === '/booking-calendar' || location.pathname === '/'
    if (!isCalendarViewRoute) {
      return
    }

    let isCancelled = false
    const abortController = new AbortController()

    const fetchTickets = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Calendar View: Fetching tickets API...')
        const response = await getTickets({ timeframe: 'upcoming' }, abortController.signal)

        // Check if component was unmounted or effect was cancelled
        if (isCancelled) {
          return
        }

        console.log('Calendar View: API response:', response)

        if ('success' in response && response.success) {
          const ticketsResponse = response
          
          // Use sortedData if available - DO NOT use raw tickets list
          const dataToUse = ticketsResponse.data.sortedData || {}
          console.log('Calendar View: sortedData:', dataToUse)
          setSortedData(dataToUse)

          // Create carousel data from sortedData
          const carouselData = getDateCarouselDataFromSortedData(dataToUse, { days: carouselDays, startDate: carouselStartDate })
          setDateCarouselData(carouselData)

          // Set initial date to first date with flights or today if no flights
          const firstDateWithFlights = findFirstDateWithFlights(carouselData)
          setSelectedDate(firstDateWithFlights)
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message || 'Failed to load bookings')
          setSortedData(undefined)
          // Still show date carousel even if API fails
          const carouselData = getDateCarouselDataFromSortedData(undefined, { days: carouselDays, startDate: carouselStartDate })
          setDateCarouselData(carouselData)
          setSelectedDate(new Date())
        }
      } catch (err) {
        if (isCancelled || (err as Error).name === 'AbortError') {
          return
        }
        console.error('Calendar View: Error fetching tickets:', err)
        setError('Failed to load bookings')
        setSortedData(undefined)
        const carouselData = getDateCarouselDataFromSortedData(undefined, { days: carouselDays, startDate: carouselStartDate })
        setDateCarouselData(carouselData)
        setSelectedDate(new Date())
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
  }, [location.pathname, carouselDays, carouselStartDate])

  // Update carousel data when carouselDays changes
  useEffect(() => {
    const carouselData = getDateCarouselDataFromSortedData(sortedData, { days: carouselDays, startDate: carouselStartDate })
    setDateCarouselData(carouselData)

    // Only update selected date if current selection has no flights and we can find a better option
    if (carouselData.length > 0) {
      const currentSelectedData = carouselData.find(item => item.date.toDateString() === selectedDate.toDateString())
      if (currentSelectedData && !currentSelectedData.hasFlights) {
        const firstDateWithFlights = findFirstDateWithFlights(carouselData)
        if (firstDateWithFlights.toDateString() !== selectedDate.toDateString()) {
          setSelectedDate(firstDateWithFlights)
        }
      }
    }
  }, [carouselDays, sortedData, carouselStartDate])

  // Update tickets for selected date from sortedData
  useEffect(() => {
    if (sortedData) {
      const dateString = getDateString(selectedDate)
      
      console.log('Calendar View: Selected date:', selectedDate)
      console.log('Calendar View: Date string for lookup:', dateString)
      console.log('Calendar View: Available keys in sortedData:', Object.keys(sortedData).sort())
      
      const ticketsForDate = sortedData[dateString] || []
      console.log('Calendar View: Tickets for selected date:', dateString, ticketsForDate)
      console.log('Calendar View: Calendar render list (ticketsForSelectedDate):', ticketsForDate)
      setTicketsForSelectedDate(ticketsForDate)
    } else {
      setTicketsForSelectedDate([])
    }
  }, [selectedDate, sortedData])

  const handleDateSelect = (date: Date) => {
    setTicketsForSelectedDate([])
    setSelectedDate(date)
  }

  const handleLoadNext30Days = () => {
    setCarouselDays(prevDays => prevDays + 30)
  }

  // Show loading screen for initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Bookings Calendar</h1>
        <p className="text-sm text-gray-500">Select a date to view bookings</p>
      </div>

      {/* Date Carousel */}
      <div className="mb-6">
        <SimpleDateCarousel
          dates={dateCarouselData}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onLoadNext={handleLoadNext30Days}
        />
      </div>

      {/* Bookings Table */}
      <div className="flex-1">
        {!loading && !error && ticketsForSelectedDate.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">
                No bookings available for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsForSelectedDate.map((ticket) => {
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingCalendar

