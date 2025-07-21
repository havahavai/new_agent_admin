import React from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Plane, Users, Check } from 'lucide-react'
import { CheckInPreference } from '@/api/types'

interface SimpleSeatWidgetProps {
  checkInPreference?: CheckInPreference;
}

const SimpleSeatWidget: React.FC<SimpleSeatWidgetProps> = ({ checkInPreference }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: passengerId } = useParams<{ id: string }>()

  const passengerCounts = [1, 2, 3, 4, 5] // Support for 1-5 passengers

  // Determine context: Account page (user-level) or PassengerDetails page (passenger-level)
  const isPassengerContext = location.pathname.includes('/passengers/')
  const contextType = isPassengerContext ? 'passenger' : 'user'

  const handleSelectSeats = (count: number) => {
    // Pass context information to the seat selection page
    // Remove 'P' prefix from passenger ID for API calls
    const cleanPassengerId = passengerId?.replace('P', '')
    const contextParam = isPassengerContext ? `&context=passenger&passengerId=${cleanPassengerId}` : '&context=user'
    navigate(`/simplified-seat-selection?passengers=${count}&strategy=any_seat${contextParam}`)
  }

  const getPassengerDescription = (count: number) => {
    switch (count) {
      case 1:
        return 'Individual seat preference'
      case 2:
        return 'Couple or pair seating'
      case 3:
        return 'Small group seating'
      case 4:
        return 'Family or group seating'
      case 5:
        return 'Large group seating'
      default:
        return 'Group seating'
    }
  }

  // Helper function to get current preference for a passenger count
  const getCurrentPreference = (count: number) => {
    if (!checkInPreference) return null

    const suffix = count === 1 ? '' : count.toString()
    const seatPosition = checkInPreference[`seatPosition${suffix}` as keyof CheckInPreference]
    const rowPosition = checkInPreference[`rowPosition${suffix}` as keyof CheckInPreference]

    if (seatPosition || rowPosition) {
      return {
        seatPosition: seatPosition || 'ANY',
        rowPosition: rowPosition || 'ANY'
      }
    }
    return null
  }

  // Helper function to format preference display
  const formatPreference = (seatPosition: string, rowPosition: string) => {
    const seat = seatPosition === 'ANY' ? 'Any seat' : seatPosition
    const row = rowPosition === 'ANY' ? 'Any row' : rowPosition
    return `${seat} • ${row}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Seat Preferences</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose your preferred seating arrangement for different group sizes
          {isPassengerContext && (
            <span className="block text-xs text-blue-600 mt-1">
              Setting preferences for passenger {passengerId}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {passengerCounts.map(count => {
          const currentPref = getCurrentPreference(count)
          return (
            <div key={count} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">
                        {count} Passenger{count > 1 ? 's' : ''}
                      </div>
                      {currentPref && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Set
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getPassengerDescription(count)}
                    </div>
                    {currentPref && (
                      <div className="text-xs text-blue-600 mt-1">
                        Current: {formatPreference(currentPref.seatPosition, currentPref.rowPosition)}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleSelectSeats(count)}
                  className="flex items-center space-x-2"
                  variant={currentPref ? "outline" : "default"}
                >
                  <Plane className="h-4 w-4" />
                  <span>{currentPref ? 'Update' : 'Select'} Seats</span>
                </Button>
              </div>
            </div>
          )
        })}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Select passenger count and click "Select Seats"</li>
            <li>• Choose aircraft sections (front, middle, rear)</li>
            <li>• Pick seating arrangement preferences</li>
            <li>• Save your preferences for future bookings</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default SimpleSeatWidget
