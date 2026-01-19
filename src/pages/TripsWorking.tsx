import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlightList } from '@/components/ui/flight-list'
import { getUserSpecificInfo, FlightData, UserSpecificInfoResponse, ApiError } from '@/api'
import { findFirstDateWithFlights } from '@/data/flights'
import FloatingActionButton from '@/components/FloatingActionButton'
import AddFlightManuallyDialog from '@/components/AddFlightManuallyDialog'
import UploadTicketDialog from '@/components/UploadTicketDialog'

// Helper function to extract time from ISO string without timezone conversion
const extractTimeFromISO = (isoString: string): string => {
  // Extract time part from ISO string (e.g., "2025-05-16T10:00:00.000Z" -> "10:00")
  const timePart = isoString.split('T')[1]?.split('.')[0] || isoString.split('T')[1]?.split('Z')[0]
  if (timePart) {
    const [hours, minutes] = timePart.split(':')
    return `${hours}:${minutes}`
  }
  return isoString // fallback to original if parsing fails
}

// Helper function to parse a YYYY-MM-DD string into a local Date (no TZ shift)
const parseDateStringToLocal = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

// Helper function to get date string from Date object (YYYY-MM-DD format)
const getDateString = (date: Date): string => {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0')
}

// Helper function to generate carousel data from sortedData
const getDateCarouselDataFromSortedData = (
  sortedData: { [key: string]: FlightData[] } | undefined,
  options?: { days?: number; startDate?: Date }
) => {
  const days = options?.days ?? 30
  const startDate = options?.startDate ?? new Date()

  if (sortedData && Object.keys(sortedData).length > 0) {
    const sortedKeys = Object.keys(sortedData).sort()
    const startKey = sortedKeys[0]
    const endKey = sortedKeys[sortedKeys.length - 1]
    const rangeStart = parseDateStringToLocal(startKey)
    const rangeEnd = parseDateStringToLocal(endKey)

    const dates: Date[] = []
    const current = new Date(rangeStart)
    while (current <= rangeEnd) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates.map((date) => {
      const dateKey = getDateString(date)
      const flightsForDate = sortedData[dateKey] || []
      return {
        date,
        hasFlights: flightsForDate.length > 0,
        flightCount: flightsForDate.length,
      }
    })
  }

  // Generate date range fallback when API data is missing
  const dates: Date[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }

  return dates.map((date) => ({
    date,
    hasFlights: false,
    flightCount: 0
  }))
}


// Simple date carousel component
const SimpleDateCarousel = ({ dates, selectedDate, onDateSelect, onLoadNext }: any) => {
  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short' })
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  // Group dates by month for month labels
  const groupedDates: { month: string; dates: any[] }[] = []
  let currentMonth = ''

  dates.forEach((dateItem: any) => {
    const month = formatMonth(dateItem.date)
    if (month !== currentMonth) {
      currentMonth = month
      groupedDates.push({ month, dates: [dateItem] })
    } else {
      groupedDates[groupedDates.length - 1].dates.push(dateItem)
    }
  })

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 p-4 min-w-max">
        {groupedDates.map((group, groupIndex) => (
          <div key={groupIndex} className="flex gap-2">
            {/* Month Label */}
            {groupIndex === 0 || group.month !== groupedDates[groupIndex - 1]?.month ? (
              <div className="flex-shrink-0 flex items-center justify-center min-w-[60px] px-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {group.month}
                </div>
              </div>
            ) : null}

            {/* Date Cards */}
            {group.dates.map((dateItem: any, index: number) => {
              const selected = isSelected(dateItem.date)
              const isPast = dateItem.date < new Date(new Date().setHours(0, 0, 0, 0))

              return (
                <button
                  key={`${groupIndex}-${index}`}
                  onClick={() => dateItem.hasFlights && onDateSelect(dateItem.date)}
                  disabled={!dateItem.hasFlights && !selected}
                  className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] h-20 sm:h-24 rounded-lg border-2 transition-all ${selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                    : dateItem.hasFlights
                      ? isPast
                        ? 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                        : 'border-gray-200 bg-white text-gray-900 hover:border-blue-200 hover:bg-blue-50'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                >
                  <div className="text-xs font-medium mb-0.5 sm:mb-1">
                    {formatDate(dateItem.date)}
                  </div>
                  <div className="text-lg sm:text-xl font-bold mb-0.5 sm:mb-1">
                    {dateItem.date.getDate()}
                  </div>
                  {dateItem.hasFlights ? (
                    <div className={`text-xs ${selected ? 'text-blue-600' : 'text-gray-500'}`}>
                      {dateItem.flightCount} {dateItem.flightCount === 1 ? 'flight' : 'flights'}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      —
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {/* Next button card */}
        {onLoadNext && (
          <button
            onClick={onLoadNext}
            className="flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] h-20 sm:h-24 rounded-lg border-2 transition-all border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100 shadow-sm"
          >
            <div className="text-xs font-medium mb-1">
              Load
            </div>
            <div className="text-xl font-bold">
              →
            </div>
            <div className="text-xs">
              More
            </div>
          </button>
        )}
      </div>
    </div>
  )
}



const TripsWorking = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [carouselStartDate] = useState(new Date()) // Track the start date for carousel
  const [carouselDays, setCarouselDays] = useState(30) // Track how many days to show
  // Initialize with today + next 30 days immediately
  const [dateCarouselData, setDateCarouselData] = useState<any[]>(() =>
    getDateCarouselDataFromSortedData(undefined, { days: 30, startDate: new Date() })
  )
  const [flights, setFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortedData, setSortedData] = useState<{ [key: string]: FlightData[] } | undefined>(undefined)

  // Dialog states
  const [isAddManuallyDialogOpen, setIsAddManuallyDialogOpen] = useState(false)
  const [isUploadTicketDialogOpen, setIsUploadTicketDialogOpen] = useState(false)

  // Fetch flights from API
  useEffect(() => {
    let isCancelled = false
    const abortController = new AbortController()

    const fetchFlights = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getUserSpecificInfo(abortController.signal)

        // Check if component was unmounted or effect was cancelled
        if (isCancelled) {
          return
        }

        if ('success' in response && response.success) {
          const userResponse = response as UserSpecificInfoResponse

          // Use sortedData if available, otherwise fallback to flightsData
          const dataToUse = userResponse.data.sortedData || {}
          setSortedData(dataToUse)

          // Create carousel data from sortedData
          const carouselData = getDateCarouselDataFromSortedData(dataToUse, { days: carouselDays, startDate: carouselStartDate })
          setDateCarouselData(carouselData)

          // Set initial date to first date with flights or today if no flights
          const firstDateWithFlights = findFirstDateWithFlights(carouselData)
          setSelectedDate(firstDateWithFlights)
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message)
          setSortedData(undefined)
          // Still show date carousel even if API fails - show today + current days range
          const carouselData = getDateCarouselDataFromSortedData(undefined, { days: carouselDays, startDate: carouselStartDate })
          setDateCarouselData(carouselData)
          // Set selected date to today when no flights
          setSelectedDate(new Date())
        }
      } catch (err) {
        if (isCancelled || (err as Error).name === 'AbortError') {
          return
        }
        setError('Failed to load flights')
        setSortedData(undefined)
        // Still show date carousel even on error - show today + current days range
        const carouselData = getDateCarouselDataFromSortedData(undefined, { days: carouselDays, startDate: carouselStartDate })
        setDateCarouselData(carouselData)
        // Set selected date to today when no flights
        setSelectedDate(new Date())
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchFlights()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [])

  // Update carousel data when carouselDays changes
  useEffect(() => {
    const carouselData = getDateCarouselDataFromSortedData(sortedData, { days: carouselDays, startDate: carouselStartDate })
    setDateCarouselData(carouselData)

    // Only update selected date if current selection has no flights and we can find a better option
    if (carouselData.length > 0) {
      const currentSelectedData = carouselData.find(item => item.date.toDateString() === selectedDate.toDateString())
      if (currentSelectedData && !currentSelectedData.hasFlights) {
        // Current selection has no flights, try to find a better date
        const firstDateWithFlights = findFirstDateWithFlights(carouselData)
        // Only update if the new date is different to avoid infinite loops
        if (firstDateWithFlights.toDateString() !== selectedDate.toDateString()) {
          setSelectedDate(firstDateWithFlights)
        }
      }
    }
  }, [carouselDays, sortedData, carouselStartDate])

  useEffect(() => {
    // Clear old flights first to prevent duplication
    setFlights([])

    if (sortedData) {
      // Get date string in YYYY-MM-DD format
      const dateString = getDateString(selectedDate)
      const flightsForDate = sortedData[dateString] || []

      // Transform flights to the format expected by FlightList
      const transformedFlights = flightsForDate.map(flight => ({
        id: flight.flightId,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        route: {
          from: flight.departureAirport,
          to: flight.arrivalAirport,
          fromCode: flight.departureAirport,
          toCode: flight.arrivalAirport
        },
        departure: extractTimeFromISO(flight.departureTime),
        arrival: extractTimeFromISO(flight.arrivalTime),
        checkInStatus: flight.checkInStatus,
        checkInSubStatus: flight.checkInSubStatus,
        statusMessage: flight.statusMessage,
        passengers: parseInt(flight.numberOfPassengers),
        aircraft: flight.airline,
        webCheckinStatus: flight.checkInStatus === 'NONE' ? 'Scheduled' :
          flight.checkInStatus === 'FAILED' ? 'Failed' : 'Completed' as any,
        flightType: flight.isInternational ? 'International' : 'Domestic' as any,
        ticketId: flight.ticketId,
        status: flight.checkInStatus === 'FAILED' ? 'Delayed' : 'On Time' as any
      }))

      setFlights(transformedFlights)
    } else {
      // No sortedData available
      setFlights([])
    }
  }, [selectedDate, sortedData])

  const handleDateSelect = (date: Date) => {
    // Clear old flights first to prevent duplication
    setFlights([])
    setSelectedDate(date)
  }

  const handleLoadNext30Days = () => {
    setCarouselDays(prevDays => prevDays + 30)
  }

  // Handle add flight manually - now just refreshes the list
  const handleAddFlightManually = async () => {
    try {
      // Refresh flights list
      const refreshResponse = await getUserSpecificInfo()
      if ('success' in refreshResponse && refreshResponse.success) {
        const userResponse = refreshResponse as UserSpecificInfoResponse

        // Use sortedData if available, otherwise fallback to empty object
        const dataToUse = userResponse.data.sortedData || {}
        setSortedData(dataToUse)

        // Update carousel data
        const carouselData = getDateCarouselDataFromSortedData(dataToUse, { days: carouselDays, startDate: carouselStartDate })
        setDateCarouselData(carouselData)
      }
    } catch (err) {
      console.error('Failed to refresh flights:', err)
    }
  }

  // Handle upload ticket - now just refreshes the list
  const handleUploadTicket = async () => {
    try {
      // Refresh flights list
      const refreshResponse = await getUserSpecificInfo()
      if ('success' in refreshResponse && refreshResponse.success) {
        const userResponse = refreshResponse as UserSpecificInfoResponse

        // Use sortedData if available, otherwise fallback to empty object
        const dataToUse = userResponse.data.sortedData || {}
        setSortedData(dataToUse)

        // Update carousel data
        const carouselData = getDateCarouselDataFromSortedData(dataToUse, { days: carouselDays, startDate: carouselStartDate })
        setDateCarouselData(carouselData)
      }
    } catch (err) {
      console.error('Failed to refresh flights:', err)
    }
  }

  // Show loading screen for initial load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flights...</p>
        </div>
      </div>
    )
  }

  return (
    <>
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

        {/* Sticky Date Carousel */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <SimpleDateCarousel
            dates={dateCarouselData}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onLoadNext={sortedData && Object.keys(sortedData).length > 0 ? undefined : handleLoadNext30Days}
          />
        </div>

        {/* Flight List */}
        <div className="flex-1 p-4">
          {!loading && !error && dateCarouselData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No flight data available</p>
              <p className="text-gray-500 text-sm">Please check your connection and try again</p>
              <p className="text-gray-500 mt-4">You can still navigate to other sections using the menu.</p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => navigate('/passengers')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Navigate to Passengers
                </button>
                <button
                  onClick={() => navigate('/account')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Test Navigate to Account
                </button>
              </div>
            </div>
          ) : (
            <FlightList
              flights={flights}
              selectedDate={selectedDate}
            />
          )}
        </div>
      </div>

      {/* Floating Action Button - positioned to avoid mobile bottom nav */}
      <FloatingActionButton
        onAddManually={() => setIsAddManuallyDialogOpen(true)}
        onUploadTicket={() => setIsUploadTicketDialogOpen(true)}
        className="bottom-24 right-6 lg:bottom-8 lg:right-8"
      />

      {/* Add Flight Manually Dialog */}
      <AddFlightManuallyDialog
        isOpen={isAddManuallyDialogOpen}
        onClose={() => setIsAddManuallyDialogOpen(false)}
        onSuccess={handleAddFlightManually}
      />

      {/* Upload Ticket Dialog */}
      <UploadTicketDialog
        isOpen={isUploadTicketDialogOpen}
        onClose={() => setIsUploadTicketDialogOpen(false)}
        onSuccess={handleUploadTicket}
      />
    </>
  )
}

export default TripsWorking
