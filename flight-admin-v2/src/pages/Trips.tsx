
import { useState, useEffect } from 'react'
import { FlightList } from '@/components/ui/flight-list'
import { getDateCarouselData, getFlightsForDate } from '@/data/flights'

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

const Trips = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateCarouselData, setDateCarouselData] = useState<any[]>([])
  const [flights, setFlights] = useState<any[]>([])

  useEffect(() => {
    const carouselData = getDateCarouselData()
    setDateCarouselData(carouselData)

    // Set initial date to first date with flights
    const firstDateWithFlights = carouselData.find(d => d.hasFlights)
    if (firstDateWithFlights) {
      setSelectedDate(firstDateWithFlights.date)
    }
  }, [])

  useEffect(() => {
    const flightsForDate = getFlightsForDate(selectedDate)
    setFlights(flightsForDate)
  }, [selectedDate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="flex flex-col h-full">
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
        <FlightList
          flights={flights}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  )
}

export default Trips
