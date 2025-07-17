import React, { useRef, useEffect } from 'react'
import { Button } from './button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateCarouselProps {
  dates: Array<{
    date: Date
    hasFlights: boolean
  }>
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onLoadNext?: () => void
  className?: string
}

export const DateCarousel: React.FC<DateCarouselProps> = ({
  dates,
  selectedDate,
  onDateSelect,
  onLoadNext,
  className
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

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

  const formatDayNumber = (date: Date) => {
    return date.getDate().toString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  // Auto-scroll to selected date on mount and when selectedDate changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const selectedIndex = dates.findIndex(d => isSelected(d.date))
      if (selectedIndex !== -1) {
        const selectedElement = scrollContainerRef.current.children[selectedIndex] as HTMLElement
        if (selectedElement) {
          selectedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
          })
        }
      }
    }
  }, [selectedDate, dates])

  return (
    <div className={cn('relative', className)}>
      {/* Desktop scroll buttons */}
      <div className="hidden md:block">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md"
          onClick={scrollRight}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable date container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-8 md:px-12 py-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((dateItem, index) => {
          return (
            <button
              key={index}
              onClick={() => dateItem.hasFlights && onDateSelect(dateItem.date)}
              disabled={!dateItem.hasFlights && !isSelected(dateItem.date)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center',
                'min-w-[80px] h-20 rounded-lg border-2 transition-all duration-200',
                isSelected(dateItem.date)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : dateItem.hasFlights
                  ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50 hover:scale-105 active:scale-95'
                  : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              <div className="text-xs font-medium mb-1">
                {formatDate(dateItem.date)}
              </div>
              <div className="text-lg font-bold">
                {formatDayNumber(dateItem.date)}
              </div>
            </button>
          )
        })}

        {/* Next button card */}
        {onLoadNext && (
          <button
            onClick={onLoadNext}
            className={cn(
              'flex-shrink-0 flex flex-col items-center justify-center',
              'min-w-[80px] h-20 rounded-lg border-2 transition-all duration-200',
              'hover:scale-105 active:scale-95',
              'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100'
            )}
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
    </div>
  )
}
