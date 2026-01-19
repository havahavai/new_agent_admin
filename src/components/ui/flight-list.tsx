import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { Plane, Users, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Flight {
  id: string
  flightNumber: string
  airline?: string // Add airline field
  route: {
    from: string
    to: string
    fromCode: string
    toCode: string
  }
  departure: string
  arrival: string
  checkInStatus: string
  checkInSubStatus?: string
  statusMessage?: string
  passengers: number
  aircraft: string
  gate?: string
  delay?: number // in minutes
  webCheckinStatus: 'Completed' | 'Scheduled' | 'Failed' | 'In Progress' | 'Document Pending'
  flightType: 'International' | 'Domestic'
  ticketId?: string // Add ticketId for API navigation
  status?: 'On Time' | 'Delayed' | 'Boarding' | 'Departed' // Add status property
}

interface FlightListProps {
  flights: Flight[]
  selectedDate: Date
  className?: string
}

export const FlightList: React.FC<FlightListProps> = ({
  flights,
  selectedDate,
  className
}) => {
  const navigate = useNavigate()

  const handleFlightClick = (flight: Flight) => {
    if (flight.ticketId) {
      // Navigate with both flightId and ticketId for API data
      navigate(`/trips/${flight.id}/${flight.ticketId}`)
    } else {
      // Fallback to old route for mock data
      navigate(`/trips/${flight.id}`)
    }
  }


  const getFlightTypeColor = (type: Flight['flightType']) => {
    switch (type) {
      case 'International':
        return 'bg-purple-100 text-purple-800'
      case 'Domestic':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderCheckinMeta = (flight: Flight) => {
    const rawStatus = flight.checkInStatus || ''
    let displayStatus = rawStatus

    switch (rawStatus) {
      case 'CheckInCompletedByUser':
      case 'CheckInCompletedByAgent':
      case 'CheckInCompletedByAdmin':
        displayStatus = 'COMPLETED'
        break
      case 'FailedByAgent':
        displayStatus = 'IN_PROGRESS'
        break
      case 'FailedByAdmin':
        displayStatus = 'CHECKIN FAILED'
        break
      default:
        displayStatus = rawStatus
        break
    }

    const statusColorClass =
      displayStatus === 'COMPLETED'
        ? 'bg-green-100 text-green-800 border-green-100'
        : displayStatus === 'CHECKIN FAILED'
          ? 'bg-red-100 text-red-800 border-red-100'
          : displayStatus === 'IN_PROGRESS'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-100'
            : 'bg-gray-100 text-gray-800 border-gray-100'

    return (
      <div className="flex flex-col items-center gap-1 text-[11px] text-gray-600 text-center">
        {flight.checkInStatus && (
          <span
            className={cn(
              'inline-flex w-[180px] items-center justify-center rounded-full border px-4 py-1 text-[12px] font-semibold uppercase tracking-wide truncate',
              statusColorClass
            )}
          >
            {displayStatus}
          </span>
        )}
        {(flight.checkInSubStatus === 'MISSING_INFO' || flight.statusMessage) && (
          <div className="flex flex-col items-center gap-1 text-center">
            {flight.checkInSubStatus === 'MISSING_INFO' && (
              <span className="inline-flex w-fit items-center rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Attention needed
              </span>
            )}
            {flight.statusMessage && (
              <span className="text-[11px] text-gray-500">{flight.statusMessage}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  if (flights.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No flights scheduled</h3>
        <p className="text-gray-500">
          There are no flights scheduled for {formatDate(selectedDate)}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="hidden md:flex md:items-center md:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Flights for {formatDate(selectedDate)}
        </h2>
        <Badge variant="outline" className="text-sm">
          {flights.length} flight{flights.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {flights.map((flight) => (
          <Card
            key={flight.id}
            className="hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
            onClick={() => handleFlightClick(flight)}
          >
            <CardContent className="p-3 sm:p-4">
              {/* Mobile Layout */}
              <div className="block md:hidden space-y-2">
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900 text-base">{flight.flightNumber}</div>
                      <Badge
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] font-medium',
                          getFlightTypeColor(flight.flightType)
                        )}
                        variant="secondary"
                      >
                        {flight.flightType}
                      </Badge>
                    </div>
                    {flight.airline && (
                      <div className="text-xs text-gray-500">{flight.airline}</div>
                    )}
                  </div>
                </div>

                {/* Route and Time Row */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-0.5">From</div>
                    <div className="font-semibold text-gray-900">{flight.route.fromCode}</div>
                    <div className="text-sm text-blue-600 font-medium mt-0.5">{flight.departure}</div>
                  </div>
                  <div className="px-3">
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-xs text-gray-500 mb-0.5">To</div>
                    <div className="font-semibold text-gray-900">{flight.route.toCode}</div>
                    <div className="text-sm text-blue-600 font-medium mt-0.5">{flight.arrival}</div>
                  </div>
                </div>

                {/* Info Row */}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{flight.passengers} pax</span>
                  </div>
                  {renderCheckinMeta(flight)}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex md:items-center md:gap-[120px]">
                {/* Flight Info */}
                <div className="min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900 text-base">{flight.flightNumber}</div>
                    <Badge
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium',
                        getFlightTypeColor(flight.flightType)
                      )}
                      variant="secondary"
                    >
                      {flight.flightType}
                    </Badge>
                  </div>
                  {flight.airline && (
                    <div className="text-xs text-gray-500">{flight.airline}</div>
                  )}
                </div>

                {/* Route with Times */}
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">From</div>
                    <div className="font-semibold text-gray-900">{flight.route.fromCode}</div>
                    <div className="text-sm text-blue-600 font-medium mt-1">{flight.departure}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">To</div>
                    <div className="font-semibold text-gray-900">{flight.route.toCode}</div>
                    <div className="text-sm text-blue-600 font-medium mt-1">{flight.arrival}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{flight.passengers} pax</span>
                </div>
                <div className="flex-shrink-0 ml-auto pl-6">
                  {renderCheckinMeta(flight)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
