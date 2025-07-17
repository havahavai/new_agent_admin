
import { useState, useEffect } from 'react'
import { FlightList } from '@/components/ui/flight-list'
import { getDateCarouselData, getFlightsForDate, findFirstDateWithFlights } from '@/data/flights'

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

const Trips = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [carouselStartDate, setCarouselStartDate] = useState(new Date())
  const [dateCarouselData, setDateCarouselData] = useState<any[]>([])
  const [flights, setFlights] = useState<any[]>([])

  // Helper to get 30-day range starting from carouselStartDate
  const loadCarouselData = (startDate: Date) => {
    const data = getDateCarouselData({ days: 30, startDate })
    setDateCarouselData(data)
  }

  useEffect(() => {
    loadCarouselData(carouselStartDate)
  }, [carouselStartDate])

  // Set initial selected date to first date with flights
  useEffect(() => {
    if (dateCarouselData.length > 0) {
      const firstDateWithFlights = findFirstDateWithFlights(dateCarouselData)
      setSelectedDate(firstDateWithFlights)
    }
  }, [dateCarouselData])

  useEffect(() => {
    const flightsForDate = getFlightsForDate(selectedDate)
    setFlights(flightsForDate)
  }, [selectedDate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  // Navigation handlers
  const handleNext30Days = () => {
    const nextStart = new Date(carouselStartDate)
    nextStart.setDate(carouselStartDate.getDate() + 30)
    setCarouselStartDate(nextStart)
  }
  const handlePrev30Days = () => {
    const prevStart = new Date(carouselStartDate)
    prevStart.setDate(carouselStartDate.getDate() - 30)
    setCarouselStartDate(prevStart)
  }

  // Custom date carousel with year and all dates enabled
  const CustomDateCarousel = ({ dates, selectedDate, onDateSelect, onLoadNext }: any) => {
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
                  ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="text-xs font-medium mb-1">
                {formatDate(dateItem.date)}
              </div>
              <div className="text-lg font-bold mb-1">
                {dateItem.date.getDate()}
              </div>
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

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Date Carousel */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
            onClick={handlePrev30Days}
          >
            Previous 30 days
          </button>
          <span className="font-semibold text-gray-700">Date Carousel</span>
          <button
            className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
            onClick={handleNext30Days}
          >
            Next 30 days
          </button>
        </div>
        <CustomDateCarousel
          dates={dateCarouselData}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onLoadNext={handleNext30Days}
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
