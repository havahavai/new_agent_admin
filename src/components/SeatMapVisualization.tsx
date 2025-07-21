import React from 'react'
import { SeatStrategy } from './SeatPreferenceWidget'

interface SeatMapVisualizationProps {
  strategies: SeatStrategy[]
  passengerCount: number
}

interface SeatInfo {
  id: string
  row: number
  letter: string
  type: 'window' | 'middle' | 'aisle'
  isSelected: boolean
  isAvailable: boolean
  strategyPriority?: number
}

const SeatMapVisualization: React.FC<SeatMapVisualizationProps> = ({
  strategies,
  passengerCount,
}) => {
  // Generate seat map (simplified 3-3 configuration for demo)
  const generateSeatMap = (): SeatInfo[] => {
    const seats: SeatInfo[] = []
    const rows = 10
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

        seats.push({
          id: `${row}${letter}`,
          row,
          letter,
          type,
          isSelected: false,
          isAvailable: Math.random() > 0.3, // 70% availability for demo
        })
      })
    }
    
    return seats
  }

  const seatMap = generateSeatMap()

  // Apply strategy highlighting
  const getHighlightedSeats = () => {
    if (strategies.length === 0) return seatMap

    const highlightedMap = [...seatMap]
    const topStrategy = strategies.find(s => s.priority === 1)
    
    if (!topStrategy) return highlightedMap

    // Simple highlighting logic based on preference type
    highlightedMap.forEach(seat => {
      let shouldHighlight = false
      
      switch (topStrategy.preference) {
        case 'near_window':
          shouldHighlight = seat.type === 'window' && seat.isAvailable
          break
        case 'near_aisle':
          shouldHighlight = seat.type === 'aisle' && seat.isAvailable
          break
        case 'together_window':
          // Highlight window seats and adjacent seats
          shouldHighlight = (seat.type === 'window' || seat.type === 'middle') && seat.isAvailable
          break
        case 'together_aisle':
          // Highlight aisle seats and adjacent seats
          shouldHighlight = (seat.type === 'aisle' || seat.type === 'middle') && seat.isAvailable
          break
        case 'seats_together':
          // Highlight all available seats (simplified)
          shouldHighlight = seat.isAvailable
          break
        default:
          shouldHighlight = seat.isAvailable
      }
      
      if (shouldHighlight) {
        seat.isSelected = true
        seat.strategyPriority = topStrategy.priority
      }
    })

    return highlightedMap
  }

  const highlightedSeats = getHighlightedSeats()

  const getSeatColor = (seat: SeatInfo) => {
    if (!seat.isAvailable) {
      return 'bg-gray-300 text-gray-500'
    }
    
    if (seat.isSelected) {
      return 'bg-blue-500 text-white'
    }
    
    switch (seat.type) {
      case 'window':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'aisle':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'middle':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeatIcon = (seat: SeatInfo) => {
    if (!seat.isAvailable) return '✗'
    if (seat.isSelected) return '✓'
    return seat.letter
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Preferred (Strategy 1)</span>
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

      {/* Seat Map */}
      <div className="bg-white border rounded-lg p-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Aircraft nose indicator */}
          <div className="text-center text-xs text-gray-500 mb-2">
            ✈️ Front of Aircraft
          </div>
          
          {/* Seat grid */}
          <div className="space-y-1">
            {Array.from({ length: 10 }, (_, rowIndex) => {
              const row = rowIndex + 1
              const rowSeats = highlightedSeats.filter(seat => seat.row === row)
              
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

      {/* Strategy Summary */}
      {strategies.length > 0 && (
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Active Strategy:</div>
          <div>
            {strategies[0]?.description} (Priority {strategies[0]?.priority})
          </div>
        </div>
      )}
    </div>
  )
}

export default SeatMapVisualization
