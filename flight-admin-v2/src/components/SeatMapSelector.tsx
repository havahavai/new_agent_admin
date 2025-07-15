import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SeatMapSelectorProps {
  passengerCount: number
  selectedSeats: string[]
  onSeatSelection: (seats: string[]) => void
}

interface SeatInfo {
  id: string
  row: number
  letter: string
  type: 'window' | 'middle' | 'aisle'
  isSelected: boolean
  isAvailable: boolean
}

const SeatMapSelector: React.FC<SeatMapSelectorProps> = ({
  passengerCount,
  selectedSeats,
  onSeatSelection,
}) => {
  const [localSelectedSeats, setLocalSelectedSeats] = useState<string[]>(selectedSeats)

  // Generate seat map (simplified 3-3 configuration)
  const generateSeatMap = (): SeatInfo[] => {
    const seats: SeatInfo[] = []
    const rows = 8 // Smaller map for selection
    const seatLetters = ['A', 'B', 'C', 'D', 'E', 'F']
    
    for (let row = 1; row <= rows; row++) {
      seatLetters.forEach((letter, index) => {
        let type: 'window' | 'middle' | 'aisle'
        if (letter === 'A' || letter === 'F') {
          type = 'window'
        } else if (letter === 'C' || letter === 'D') {
          type = 'aisle'
        } else {
          type = 'middle'
        }

        const seatId = `${row}${letter}`
        seats.push({
          id: seatId,
          row,
          letter,
          type,
          isSelected: localSelectedSeats.includes(seatId),
          isAvailable: Math.random() > 0.2, // 80% availability for demo
        })
      })
    }
    
    return seats
  }

  const seatMap = generateSeatMap()

  const handleSeatClick = (seatId: string) => {
    const seat = seatMap.find(s => s.id === seatId)
    if (!seat || !seat.isAvailable) return

    let newSelectedSeats: string[]
    
    if (localSelectedSeats.includes(seatId)) {
      // Deselect seat
      newSelectedSeats = localSelectedSeats.filter(id => id !== seatId)
    } else {
      // Select seat (limit to passenger count)
      if (localSelectedSeats.length < passengerCount) {
        newSelectedSeats = [...localSelectedSeats, seatId]
      } else {
        // Replace the first selected seat
        newSelectedSeats = [...localSelectedSeats.slice(1), seatId]
      }
    }
    
    setLocalSelectedSeats(newSelectedSeats)
    onSeatSelection(newSelectedSeats)
  }

  const getSeatColor = (seat: SeatInfo) => {
    if (!seat.isAvailable) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed'
    }
    
    if (seat.isSelected) {
      return 'bg-blue-500 text-white cursor-pointer'
    }
    
    switch (seat.type) {
      case 'window':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
      case 'aisle':
        return 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
      case 'middle':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer'
      default:
        return 'bg-gray-100 text-gray-800 cursor-pointer'
    }
  }

  const getSeatIcon = (seat: SeatInfo) => {
    if (!seat.isAvailable) return '✗'
    if (seat.isSelected) {
      const index = localSelectedSeats.indexOf(seat.id)
      return (index + 1).toString()
    }
    return seat.letter
  }

  const clearSelection = () => {
    setLocalSelectedSeats([])
    onSeatSelection([])
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-sm text-gray-600">
        <p>Click on seats to select them for your custom arrangement.</p>
        <p>You can select up to {passengerCount} seat{passengerCount > 1 ? 's' : ''}.</p>
        <p className="text-xs mt-1">
          Selected: {localSelectedSeats.length}/{passengerCount}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-100 border rounded"></div>
            <span>Window</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-100 border rounded"></div>
            <span>Aisle</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-100 border rounded"></div>
            <span>Middle</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>Occupied</span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={clearSelection}
          disabled={localSelectedSeats.length === 0}
        >
          Clear Selection
        </Button>
      </div>

      {/* Seat Map */}
      <div className="bg-white border rounded-lg p-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Aircraft nose indicator */}
          <div className="text-center text-xs text-gray-500 mb-2">
            ✈️ Front of Aircraft
          </div>
          
          {/* Seat grid */}
          <div className="space-y-1">
            {Array.from({ length: 8 }, (_, rowIndex) => {
              const row = rowIndex + 1
              const rowSeats = seatMap.filter(seat => seat.row === row)
              
              return (
                <div key={row} className="flex items-center space-x-1">
                  {/* Row number */}
                  <div className="w-6 text-xs text-gray-500 text-center">
                    {row}
                  </div>
                  
                  {/* Left side seats (A, B, C) */}
                  <div className="flex space-x-1">
                    {rowSeats.slice(0, 3).map(seat => (
                      <div
                        key={seat.id}
                        className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium transition-colors ${getSeatColor(seat)}`}
                        onClick={() => handleSeatClick(seat.id)}
                        title={`${seat.id} - ${seat.type} seat ${seat.isAvailable ? '(Available)' : '(Occupied)'}`}
                      >
                        {getSeatIcon(seat)}
                      </div>
                    ))}
                  </div>
                  
                  {/* Aisle */}
                  <div className="w-4 text-center text-xs text-gray-400">
                    |
                  </div>
                  
                  {/* Right side seats (D, E, F) */}
                  <div className="flex space-x-1">
                    {rowSeats.slice(3, 6).map(seat => (
                      <div
                        key={seat.id}
                        className={`w-8 h-8 rounded text-xs flex items-center justify-center font-medium transition-colors ${getSeatColor(seat)}`}
                        onClick={() => handleSeatClick(seat.id)}
                        title={`${seat.id} - ${seat.type} seat ${seat.isAvailable ? '(Available)' : '(Occupied)'}`}
                      >
                        {getSeatIcon(seat)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Seats Summary */}
      {localSelectedSeats.length > 0 && (
        <div className="text-sm">
          <div className="font-medium">Selected Seats:</div>
          <div className="text-gray-600">
            {localSelectedSeats.join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatMapSelector
