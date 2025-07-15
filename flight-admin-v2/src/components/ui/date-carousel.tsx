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
  className?: string
}

export const DateCarousel: React.FC<DateCarouselProps> = ({
  dates,
  selectedDate,
  onDateSelect,
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
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
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
          const selected = isSelected(dateItem.date)
          return (
            <button
              key={index}
              onClick={() => onDateSelect(dateItem.date)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center',
                'min-w-[80px] h-20 rounded-lg border-2 transition-all duration-200',
                'hover:scale-105 active:scale-95',
                selected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : dateItem.hasFlights
                  ? 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed',
                !dateItem.hasFlights && !selected && 'opacity-60'
              )}
              disabled={!dateItem.hasFlights && !selected}
            >
              <div className="text-xs font-medium mb-1">
                {formatDate(dateItem.date)}
              </div>
              <div className={cn(
                'text-lg font-bold',
                selected ? 'text-blue-700' : dateItem.hasFlights ? 'text-gray-900' : 'text-gray-400'
              )}>
                {formatDayNumber(dateItem.date)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
