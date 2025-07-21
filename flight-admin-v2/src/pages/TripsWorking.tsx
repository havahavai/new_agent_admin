import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlightList } from '@/components/ui/flight-list'
import { getUserSpecificInfo, FlightData, UserSpecificInfoResponse, ApiError } from '@/api'
import { getDateCarouselDataForApi, findFirstDateWithFlights } from '@/data/flights'

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

// Helper function to group flights by departure date
const groupFlightsByDate = (flights: FlightData[]) => {
  const grouped: { [key: string]: FlightData[] } = {}

  flights.forEach(flight => {
    const departureDate = new Date(flight.departureTime).toDateString()
    if (!grouped[departureDate]) {
      grouped[departureDate] = []
    }
    grouped[departureDate].push(flight)
  })

  // Convert to carousel format
  const carouselData = Object.keys(grouped).map(dateString => {
    const date = new Date(dateString)
    const flightsForDate = grouped[dateString]
    return {
      date,
      hasFlights: flightsForDate.length > 0,
      flightCount: flightsForDate.length
    }
  }).sort((a, b) => a.date.getTime() - b.date.getTime())

  return carouselData
}

// Helper function to get flights for selected date
const getFlightsForSelectedDate = (flights: FlightData[], selectedDate: Date) => {
  const selectedDateString = selectedDate.toDateString()
  return flights.filter(flight => {
    const flightDate = new Date(flight.departureTime).toDateString()
    return flightDate === selectedDateString
  }).map(flight => ({
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
    passengers: parseInt(flight.numberOfPassengers),
    aircraft: flight.airline, // Use airline as aircraft for now
    webCheckinStatus: flight.checkInStatus === 'NONE' ? 'Scheduled' :
                     flight.checkInStatus === 'FAILED' ? 'Failed' : 'Completed' as any,
    flightType: flight.isInternational ? 'International' : 'Domestic' as any,
    ticketId: flight.ticketId,
    status: flight.checkInStatus === 'FAILED' ? 'Delayed' : 'On Time' as any
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
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      return `${weekday}, ${month}`
    }
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  return (
    <div className="flex gap-2 overflow-x-auto p-4">
      {dates.map((dateItem: any, index: number) => {
        const selected = isSelected(dateItem.date)
        return (
          <button
            key={index}
            onClick={() => dateItem.hasFlights && onDateSelect(dateItem.date)}
            disabled={!dateItem.hasFlights && !selected}
            className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] h-24 rounded-lg border-2 transition-all ${
              selected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : dateItem.hasFlights
                ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="text-xs font-medium mb-1">
              {formatDate(dateItem.date)}
            </div>
            <div className="text-lg font-bold mb-1">
              {dateItem.date.getDate()}
            </div>
            {dateItem.hasFlights ? (
              <div className="text-xs text-gray-500">
                {dateItem.flightCount} flight{dateItem.flightCount !== 1 ? 's' : ''}
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                No flights
              </div>
            )}
          </button>
        )
      })}

      {/* Next button card */}
      {onLoadNext && (
        <button
          onClick={onLoadNext}
          className="flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] h-24 rounded-lg border-2 transition-all border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100"
        >
          <div className="text-xs font-medium mb-1">
            Next
          </div>
          <div className="text-lg font-bold">
            →
          </div>
        </button>
      )}
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
    getDateCarouselDataForApi([], { days: 30, startDate: new Date() })
  )
  const [flights, setFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiFlights, setApiFlights] = useState<FlightData[]>([])

  // Fetch flights from API
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getUserSpecificInfo()

        if ('success' in response && response.success) {
          const userResponse = response as UserSpecificInfoResponse
          setApiFlights(userResponse.data.flightsData)

          // Create carousel data for today + current days range regardless of flight availability
          const carouselData = getDateCarouselDataForApi(userResponse.data.flightsData, { days: carouselDays, startDate: carouselStartDate })
          setDateCarouselData(carouselData)

          // Set initial date to first date with flights or today if no flights
          const firstDateWithFlights = findFirstDateWithFlights(carouselData)
          setSelectedDate(firstDateWithFlights)
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message)
          setApiFlights([])
          // Still show date carousel even if API fails - show today + current days range
          const carouselData = getDateCarouselDataForApi([], { days: carouselDays, startDate: carouselStartDate })
          setDateCarouselData(carouselData)
          // Set selected date to today when no flights
          setSelectedDate(new Date())
        }
      } catch (err) {
        console.error('Error fetching flights:', err)
        setError('Failed to load flights')
        setApiFlights([])
        // Still show date carousel even on error - show today + current days range
        const carouselData = getDateCarouselDataForApi([], { days: carouselDays, startDate: carouselStartDate })
        setDateCarouselData(carouselData)
        // Set selected date to today when no flights
        setSelectedDate(new Date())
      } finally {
        // Add a small delay to ensure state updates are processed
        setTimeout(() => {
          setLoading(false)
          console.log('Loading state set to false')
        }, 100)
      }
    }

    fetchFlights()

    // Log component mount/unmount for debugging
    console.log('TripsWorking component mounted')
    return () => {
      console.log('TripsWorking component unmounted')
    }
  }, [])

  // Update carousel data when carouselDays changes
  useEffect(() => {
    const carouselData = getDateCarouselDataForApi(apiFlights, { days: carouselDays, startDate: carouselStartDate })
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
  }, [carouselDays, apiFlights, carouselStartDate])

  useEffect(() => {
    if (apiFlights.length > 0) {
      // Filter API flights for selected date
      const flightsForDate = getFlightsForSelectedDate(apiFlights, selectedDate)
      setFlights(flightsForDate)
    } else {
      // No flights available
      setFlights([])
    }
  }, [selectedDate, apiFlights])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleLoadNext30Days = () => {
    setCarouselDays(prevDays => prevDays + 30)
  }

  // Only show loading screen for initial load, not for subsequent data fetches
  // This ensures navigation still works even during loading
  if (loading && dateCarouselData.length === 0) {
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
          onLoadNext={handleLoadNext30Days}
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
  )
}

export default TripsWorking
