import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { Plane, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Flight {
  id: string
  flightNumber: string
  route: {
    from: string
    to: string
    fromCode: string
    toCode: string
  }
  departure: string
  arrival: string
  checkInStatus: string
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
    console.log('FlightList: Navigating to flight:', flight.id, 'ticketId:', flight.ticketId)
    if (flight.ticketId) {
      // Navigate with both flightId and ticketId for API data
      navigate(`/trips/${flight.id}/${flight.ticketId}`)
    } else {
      // Fallback to old route for mock data
      navigate(`/trips/${flight.id}`)
    }
  }


  const getWebCheckinStatusColor = (status: Flight['webCheckinStatus']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'Failed':
        return 'bg-red-100 text-red-800'
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'Document Pending':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Flights for {formatDate(selectedDate)}
        </h2>
        <Badge variant="outline" className="text-sm">
          {flights.length} flight{flights.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {flights.map((flight, index) => (
          <Card
            key={flight.id}
            className="hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
            onClick={() => handleFlightClick(flight)}
          >
            <CardContent className="p-6">
              {/* Mobile Layout */}
              <div className="block md:hidden space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{index === 0 ? 'AI 675' : flight.flightNumber}</div>
                    <div className="text-sm text-gray-600">{flight.route.fromCode} → {flight.route.toCode}</div>
                  </div>
                  <Badge className={getFlightTypeColor(flight.flightType)}>
                    {flight.flightType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{flight.passengers} passengers</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-500">Web Check-in: </span>
                    <Badge className={getWebCheckinStatusColor(flight.webCheckinStatus)} variant="outline">
                      {flight.checkInStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex md:items-center md:justify-between">
                <div className="flex items-center space-x-6 flex-1">
                  <div>
                    <div className="font-semibold text-gray-900">{index === 0 ? 'AI 675' : flight.flightNumber}</div>
                    <div className="text-sm text-gray-600">{flight.route.fromCode} → {flight.route.toCode}</div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <div className="text-gray-500 flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{flight.passengers} passengers</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-500">Web Check-in</div>
                      <Badge className={getWebCheckinStatusColor(flight.webCheckinStatus)} variant="outline">
                        {flight.checkInStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={getFlightTypeColor(flight.flightType)}>
                    {flight.flightType}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
