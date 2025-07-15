import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Plane, Users } from 'lucide-react'

const SimpleSeatWidget: React.FC = () => {
  const navigate = useNavigate()

  const passengerCounts = [1, 2, 3, 4, 5] // Support for 1-5 passengers

  const handleSelectSeats = (count: number) => {
    navigate(`/simplified-seat-selection?passengers=${count}&strategy=any_seat`)
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Seat Preferences</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose your preferred seating arrangement for different group sizes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {passengerCounts.map(count => (
          <div key={count} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">
                    {count} Passenger{count > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getPassengerDescription(count)}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleSelectSeats(count)}
                className="flex items-center space-x-2"
              >
                <Plane className="h-4 w-4" />
                <span>Select Seats</span>
              </Button>
            </div>
          </div>
        ))}
        
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
