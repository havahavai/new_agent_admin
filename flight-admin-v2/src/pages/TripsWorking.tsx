import { useState, useEffect } from 'react'
import { FlightList } from '@/components/ui/flight-list'
import { getUserSpecificInfo, FlightData, UserSpecificInfoResponse, ApiError } from '@/api'

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
    departure: new Date(flight.departureTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    arrival: new Date(flight.arrivalTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    checkInStatus: flight.checkInStatus,
    passengers: parseInt(flight.numberOfPassengers),
    aircraft: flight.airline, // Use airline as aircraft for now
    webCheckinStatus: flight.checkInStatus === 'NONE' ? 'Scheduled' :
                     flight.checkInStatus === 'FAILED' ? 'Failed' : 'Completed' as any,
    flightType: 'International' as any, // Default to International, could be enhanced
    ticketId: flight.ticketId,
    status: flight.checkInStatus === 'FAILED' ? 'Delayed' : 'On Time' as any
  }))
}

// Simple date carousel component
const SimpleDateCarousel = ({ dates, selectedDate, onDateSelect }: any) => {
  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
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
            onClick={() => onDateSelect(dateItem.date)}
            className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] h-24 rounded-lg border-2 transition-all ${
              selected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : dateItem.hasFlights
                ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                : 'border-gray-100 bg-gray-50 text-gray-400'
            }`}
            disabled={!dateItem.hasFlights && !selected}
          >
            <div className="text-xs font-medium mb-1">
              {formatDate(dateItem.date)}
            </div>
            <div className="text-lg font-bold mb-1">
              {dateItem.date.getDate()}
            </div>
            {dateItem.hasFlights && (
              <div className="text-xs text-gray-500">
                {dateItem.flightCount} flight{dateItem.flightCount !== 1 ? 's' : ''}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}



const TripsWorking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateCarouselData, setDateCarouselData] = useState<any[]>([])
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

          // Group flights by date and create carousel data
          const flightsByDate = groupFlightsByDate(userResponse.data.flightsData)
          setDateCarouselData(flightsByDate)

          // Set initial date to first date with flights
          const firstDateWithFlights = flightsByDate.find(d => d.hasFlights)
          if (firstDateWithFlights) {
            setSelectedDate(firstDateWithFlights.date)
          }
        } else {
          const errorResponse = response as ApiError
          setError(errorResponse.message)
          setApiFlights([])
          setDateCarouselData([])
        }
      } catch (err) {
        console.error('Error fetching flights:', err)
        setError('Failed to load flights')
        setApiFlights([])
        setDateCarouselData([])
      } finally {
        setLoading(false)
      }
    }

    fetchFlights()
  }, [])

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
