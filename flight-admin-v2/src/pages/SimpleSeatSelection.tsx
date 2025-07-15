import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plane, Users, Check, X } from 'lucide-react'

interface SeatInfo {
  id: string
  row: number
  letter: string
  type: 'window' | 'middle' | 'aisle'
  status: 'available' | 'occupied' | 'selected' | 'premium'
  price?: number
}

const SimpleSeatSelection: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const passengerCount = parseInt(searchParams.get('passengers') || '1')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])

  // Generate a simple seat map
  const generateSeatMap = (): SeatInfo[] => {
    const seats: SeatInfo[] = []
    const rows = 15
    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F']
    
    for (let row = 1; row <= rows; row++) {
      seatLetters.forEach((letter) => {
        let type: 'window' | 'middle' | 'aisle'
        if (letter === 'A' || letter === 'F') {
          type = 'window'
        } else if (letter === 'C' || letter === 'D') {
          type = 'aisle'
        } else {
          type = 'middle'
        }

        let status: SeatInfo['status'] = 'available'
        let price = 0

        // Premium seats (first 3 rows)
        if (row <= 3) {
          status = 'premium'
          price = 50
        }
        // Random occupied seats
        else if (Math.random() < 0.25) {
          status = 'occupied'
        }

        const seatId = `${row}${letter}`
        seats.push({
          id: seatId,
          row,
          letter,
          type,
          status: selectedSeats.includes(seatId) ? 'selected' : status,
          price,
        })
      })
    }
    
    return seats
  }

  const seatMap = generateSeatMap()

  const handleSeatClick = (seatId: string) => {
    const seat = seatMap.find(s => s.id === seatId)
    if (!seat || seat.status === 'occupied') return

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(id => id !== seatId))
    } else {
      if (selectedSeats.length < passengerCount) {
        setSelectedSeats(prev => [...prev, seatId])
      }
    }
  }

  const getSeatColor = (seat: SeatInfo) => {
    if (selectedSeats.includes(seat.id)) {
      return 'bg-blue-500 text-white border-blue-600'
    }
    
    switch (seat.status) {
      case 'occupied':
        return 'bg-gray-400 text-gray-600 cursor-not-allowed'
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
      default:
        switch (seat.type) {
          case 'window':
            return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
          case 'aisle':
            return 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'
          case 'middle':
            return 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
        }
    }
  }

  const getSeatIcon = (seat: SeatInfo) => {
    if (seat.status === 'occupied') return <X className="h-3 w-3" />
    if (selectedSeats.includes(seat.id)) return <Check className="h-3 w-3" />
    return seat.letter
  }

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seatMap.find(s => s.id === seatId)
      return total + (seat?.price || 0)
    }, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/account')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Account</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Select Your Seats</h1>
              <p className="text-gray-600">
                Choose {passengerCount} seat{passengerCount > 1 ? 's' : ''} for your journey
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">{passengerCount} passenger{passengerCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5" />
                  <span>Aircraft Seat Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-blue-500 rounded border"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                    <span>Window</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                    <span>Aisle</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                    <span>Middle</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                    <span>Premium (+$50)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span>Occupied</span>
                  </div>
                </div>

                {/* Aircraft nose */}
                <div className="text-center text-sm text-gray-500 mb-4">
                  <div className="inline-flex items-center space-x-2">
                    <Plane className="h-4 w-4" />
                    <span>Front of Aircraft</span>
                  </div>
                </div>

                {/* Seat grid */}
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-1">
                    {Array.from({ length: 15 }, (_, rowIndex) => {
                      const row = rowIndex + 1
                      const rowSeats = seatMap.filter(seat => seat.row === row)
                      
                      return (
                        <div key={row} className="flex items-center justify-center space-x-1">
                          <div className="w-8 text-xs text-gray-500 text-center font-medium">
                            {row}
                          </div>
                          
                          {/* Left side seats (A, B, C) */}
                          <div className="flex space-x-1">
                            {rowSeats.slice(0, 3).map(seat => (
                              <button
                                key={seat.id}
                                className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium border transition-all ${getSeatColor(seat)}`}
                                onClick={() => handleSeatClick(seat.id)}
                                disabled={seat.status === 'occupied'}
                                title={`${seat.id} - ${seat.type} seat ${seat.price ? `(+$${seat.price})` : ''}`}
                              >
                                {getSeatIcon(seat)}
                              </button>
                            ))}
                          </div>
                          
                          {/* Aisle */}
                          <div className="w-6 text-center text-xs text-gray-400">|</div>
                          
                          {/* Right side seats (D, E, F) */}
                          <div className="flex space-x-1">
                            {rowSeats.slice(3, 6).map(seat => (
                              <button
                                key={seat.id}
                                className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium border transition-all ${getSeatColor(seat)}`}
                                onClick={() => handleSeatClick(seat.id)}
                                disabled={seat.status === 'occupied'}
                                title={`${seat.id} - ${seat.type} seat ${seat.price ? `(+$${seat.price})` : ''}`}
                              >
                                {getSeatIcon(seat)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selection Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Selection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span>Selected Seats:</span>
                    <span className="font-medium">{selectedSeats.length}/{passengerCount}</span>
                  </div>
                  
                  {selectedSeats.length > 0 && (
                    <div className="space-y-2">
                      {selectedSeats.map((seatId) => {
                        const seat = seatMap.find(s => s.id === seatId)
                        return (
                          <div key={seatId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{seatId}</div>
                              <div className="text-xs text-gray-500 capitalize">{seat?.type}</div>
                            </div>
                            {seat?.price && seat.price > 0 && (
                              <div className="text-sm font-medium text-green-600">
                                +${seat.price}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {getTotalPrice() > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Extra Cost:</span>
                      <span className="font-bold text-green-600">${getTotalPrice()}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => navigate('/account')}
                  disabled={selectedSeats.length !== passengerCount}
                  className="w-full"
                >
                  {selectedSeats.length === passengerCount ? 'Save Selection' : `Select ${passengerCount - selectedSeats.length} more seat${passengerCount - selectedSeats.length > 1 ? 's' : ''}`}
                </Button>

                {selectedSeats.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSeats([])}
                    className="w-full"
                  >
                    Clear Selection
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleSeatSelection
