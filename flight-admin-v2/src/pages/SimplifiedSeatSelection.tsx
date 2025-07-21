import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Plane,
  Users,
  Check
} from 'lucide-react'
import {
  updateUserCheckinPreference,
  updatePassengerCheckinPreference,
  GetUserId,
  getJwtToken
} from '@/api'

// Import SVG assets for aircraft sections
import selectedFront from '@/assets/selected_front.svg'
import unselectedFront from '@/assets/unselected_front.svg'
import selectedMiddleState from '@/assets/selected_middle_state.svg'
import unselectedMiddleState from '@/assets/unselected_middle_state.svg'
import selectedBackState from '@/assets/selected_back_state.svg'
import unselectedBackState from '@/assets/unselected_back_state.svg'

// Import SVG assets for seat positions
import windowSelected from '@/assets/window_selected.svg'
import windowUnselected from '@/assets/window_unselected.svg'
import middleSeatSelected from '@/assets/middle_selected.svg'
import middleSeatUnselected from '@/assets/middle_unselected.svg'
import aisleSelected from '@/assets/aisle_selected.svg'
import aisleUnselected from '@/assets/aisle_unselected.svg'

interface SeatPreference {
  sections: ('front' | 'middle' | 'back')[]
  position: 'window' | 'middle' | 'aisle' | null
  arrangement: string | null
}

const SimplifiedSeatSelection: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const passengerCount = parseInt(searchParams.get('passengers') || '1')
  const context = searchParams.get('context') || 'user' // 'user' or 'passenger'
  const passengerId = searchParams.get('passengerId')

  const [preference, setPreference] = useState<SeatPreference>({
    sections: [],
    position: null,
    arrangement: null
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSectionSelect = (section: 'front' | 'middle' | 'back') => {
    setPreference(prev => {
      const sections = prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
      return { ...prev, sections }
    })
  }

  const handlePositionSelect = (position: 'window' | 'middle' | 'aisle') => {
    setPreference(prev => ({ ...prev, position }))
  }

  const handleArrangementSelect = (arrangement: string) => {
    setPreference(prev => ({ ...prev, arrangement }))
  }

  const getArrangementOptions = (passengerCount: number) => {
    switch (passengerCount) {
      case 2:
        return [
          { value: 'any_seat', label: 'Any seat' },
          { value: 'across_aisle', label: 'Across the aisle' },
          { value: 'together_middle_aisle', label: 'Together in the middle block near the aisle' },
          { value: 'any_seats_together', label: 'Any seats together' },
          { value: 'together_empty_between', label: 'Together with one empty space in between' },
          { value: 'together_aisle', label: 'Together near the aisle' },
          { value: 'together_window', label: 'Together near the window' }
        ]
      case 3:
        return [
          { value: 'any_seat', label: 'Any seat' },
          { value: '2_aisle_1_behind', label: '2 near the aisle and one behind' },
          { value: 'together_middle_aisle', label: 'Together in the middle block near the aisle' },
          { value: 'together_middle_block', label: 'Together in the middle block' },
          { value: 'any_seats_together', label: 'Any seats together' },
          { value: '2_window_1_behind', label: '2 together next to the window and 1 behind near the window' },
          { value: 'together_window', label: 'Together near the window' }
        ]
      case 4:
        return [
          { value: 'any_seat', label: 'Any seat' },
          { value: 'split_groups', label: 'Split in groups of 1 to 3 passengers and apply corresponding strategy' },
          { value: 'blocks_of_two', label: 'Seat together in blocks of two' },
          { value: 'row_window', label: 'Seats together in a row near the window' },
          { value: 'together_middle_block', label: 'Together in the middle block' },
          { value: '3_together_1_behind', label: '3 seats together in a 3 seat block, one behind near the window' },
          { value: 'together_row', label: 'Seats together in a row' }
        ]
      case 5:
        return [
          { value: 'split_groups', label: 'Split in groups of 1 to 3 passengers and apply corresponding strategy' },
          { value: 'any_seat', label: 'Any seat' }
        ]
      default:
        return []
    }
  }

  const getArrangementDescription = (arrangement: string, passengerCount: number) => {
    const descriptions: { [key: string]: string } = {
      'any_seat': 'Passengers can be seated anywhere on the aircraft with no specific arrangement preference.',
      'across_aisle': 'Two passengers seated across the aisle from each other for easy communication.',
      'together_middle_aisle': 'Passengers seated together in the middle section near the aisle for easy access.',
      'any_seats_together': 'Passengers seated next to each other in any available configuration.',
      'together_empty_between': 'Two passengers with one empty seat between them for extra space.',
      'together_aisle': 'Passengers seated together with preference for aisle access.',
      'together_window': 'Passengers seated together with preference for window seats.',
      '2_aisle_1_behind': 'Two passengers near the aisle with one passenger in the row behind.',
      'together_middle_block': 'All passengers seated together in the middle section of the aircraft.',
      '2_window_1_behind': 'Two passengers together near the window with one passenger behind near the window.',
      'split_groups': 'Large group split into smaller groups of 1-3 passengers with individual strategies applied.',
      'blocks_of_two': 'Four passengers arranged in two separate blocks of two seats each.',
      'row_window': 'All passengers seated together in a single row near the window.',
      '3_together_1_behind': 'Three passengers in a 3-seat block with one passenger behind near the window.',
      'together_row': 'All passengers seated together in a single row.'
    }
    return descriptions[arrangement] || ''
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Convert preference to API format
      const seatPosition = preference.position || preference.arrangement || 'ANY'
      const rowPosition = preference.sections.length > 0 ? preference.sections.join(',') : 'ANY'

      // Build preferences object with correct field mapping based on passenger count
      const preferences: any = {}

      // Map to the correct numbered fields based on passenger count
      if (passengerCount === 1) {
        // For 1 passenger, use base fields (no suffix)
        preferences.seatPosition = seatPosition
        preferences.rowPosition = rowPosition
      } else {
        // For 2-5 passengers, use numbered fields (seatPosition2, rowPosition2, etc.)
        const suffix = passengerCount.toString()
        preferences[`seatPosition${suffix}`] = seatPosition
        preferences[`rowPosition${suffix}`] = rowPosition
      }

      if (context === 'passenger' && passengerId) {
        // Save passenger-level preferences
        const result = await updatePassengerCheckinPreference(passengerId, preferences)

        if ('success' in result && result.success) {
          setSuccess('Passenger seat preferences saved successfully!')
          setTimeout(() => {
            navigate(`/passengers/${passengerId}`)
          }, 1500)
        } else {
          setError(result.message || 'Failed to save passenger preferences')
        }
      } else {
        // Save user-level preferences
        const jwtToken = getJwtToken()
        const userId = GetUserId(jwtToken)

        if (!userId) {
          setError('Unable to get user ID. Please login again.')
          return
        }

        const result = await updateUserCheckinPreference(userId.toString(), preferences)

        if ('success' in result && result.success) {
          setSuccess('User seat preferences saved successfully!')
          setTimeout(() => {
            navigate('/account')
          }, 1500)
        } else {
          setError(result.message || 'Failed to save user preferences')
        }
      }
    } catch (err) {
      console.error('Error saving preferences:', err)
      setError('An unexpected error occurred while saving preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (context === 'passenger' && passengerId) {
      navigate(`/passengers/${passengerId}`)
    } else {
      navigate('/account')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center space-x-1 p-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Choose Your Seat Preference
            </h1>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{passengerCount} passenger{passengerCount > 1 ? 's' : ''}</span>
              {context === 'passenger' && passengerId && (
                <span className="text-blue-600">• Passenger {passengerId}</span>
              )}
            </div>
          </div>
        </div>

        {/* Selection View */}
        <div className="space-y-6">
          {/* Aircraft Section Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Plane className="h-4 w-4" />
                <span>Choose Aircraft Section</span>
              </CardTitle>
              <p className="text-xs md:text-sm text-gray-600">
                Select which part{passengerCount > 1 ? 's' : ''} of the airplane you prefer to sit in {passengerCount > 1 ? '(you can choose multiple)' : ''}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex justify-center items-center space-x-4 md:space-x-8 py-4">
                {/* Front Section */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleSectionSelect('front')}
                    className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                  >
                    <img
                      src={preference.sections.includes('front') ? selectedFront : unselectedFront}
                      alt="Front section"
                      className="w-12 h-15 md:w-16 md:h-20"
                    />
                  </button>
                  <div className="text-center">
                    <h3 className={`text-sm font-semibold ${preference.sections.includes('front') ? 'text-blue-600' : 'text-gray-900'}`}>
                      Front
                    </h3>
                    <p className="text-xs text-gray-600 hidden md:block">Quick boarding</p>
                  </div>
                </div>

                {/* Middle Section */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleSectionSelect('middle')}
                    className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                  >
                    <img
                      src={preference.sections.includes('middle') ? selectedMiddleState : unselectedMiddleState}
                      alt="Middle section"
                      className="w-12 h-15 md:w-16 md:h-20"
                    />
                  </button>
                  <div className="text-center">
                    <h3 className={`text-sm font-semibold ${preference.sections.includes('middle') ? 'text-blue-600' : 'text-gray-900'}`}>
                      Middle
                    </h3>
                    <p className="text-xs text-gray-600 hidden md:block">Balanced location</p>
                  </div>
                </div>

                {/* Back Section */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleSectionSelect('back')}
                    className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                  >
                    <img
                      src={preference.sections.includes('back') ? selectedBackState : unselectedBackState}
                      alt="Back section"
                      className="w-12 h-15 md:w-16 md:h-20"
                    />
                  </button>
                  <div className="text-center">
                    <h3 className={`text-sm font-semibold ${preference.sections.includes('back') ? 'text-blue-600' : 'text-gray-900'}`}>
                      Rear
                    </h3>
                    <p className="text-xs text-gray-600 hidden md:block">Often quieter</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seat Position Selection - Only for single passenger */}
          {passengerCount === 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Plane className="h-4 w-4" />
                  <span>Choose Seat Position</span>
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600">
                  Select your preferred seat position
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center items-center space-x-4 md:space-x-8 py-4">
                  {/* Aisle Seat */}
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => handlePositionSelect('aisle')}
                      className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    >
                      <img
                        src={preference.position === 'aisle' ? aisleSelected : aisleUnselected}
                        alt="Aisle seat"
                        className="w-12 h-10 md:w-16 md:h-14"
                      />
                    </button>
                    <div className="text-center">
                      <h3 className={`text-sm font-semibold ${preference.position === 'aisle' ? 'text-blue-600' : 'text-gray-900'}`}>
                        Aisle
                      </h3>
                      <p className="text-xs text-gray-600 hidden md:block">Easy access</p>
                    </div>
                  </div>

                  {/* Middle Seat */}
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => handlePositionSelect('middle')}
                      className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    >
                      <img
                        src={preference.position === 'middle' ? middleSeatSelected : middleSeatUnselected}
                        alt="Middle seat"
                        className="w-12 h-10 md:w-16 md:h-14"
                      />
                    </button>
                    <div className="text-center">
                      <h3 className={`text-sm font-semibold ${preference.position === 'middle' ? 'text-blue-600' : 'text-gray-900'}`}>
                        Middle
                      </h3>
                      <p className="text-xs text-gray-600 hidden md:block">Usually cheaper</p>
                    </div>
                  </div>

                  {/* Window Seat */}
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => handlePositionSelect('window')}
                      className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    >
                      <img
                        src={preference.position === 'window' ? windowSelected : windowUnselected}
                        alt="Window seat"
                        className="w-12 h-10 md:w-16 md:h-14"
                      />
                    </button>
                    <div className="text-center">
                      <h3 className={`text-sm font-semibold ${preference.position === 'window' ? 'text-blue-600' : 'text-gray-900'}`}>
                        Window
                      </h3>
                      <p className="text-xs text-gray-600 hidden md:block">Great views</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seating Arrangement Selection - Only for multiple passengers */}
          {passengerCount > 1 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Users className="h-4 w-4" />
                  <span>Choose Seating Arrangement</span>
                </CardTitle>
                <p className="text-xs md:text-sm text-gray-600">
                  Select how you'd like your group of {passengerCount} to be seated
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Select value={preference.arrangement || ''} onValueChange={handleArrangementSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select seating arrangement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getArrangementOptions(passengerCount).map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {preference.arrangement && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      {getArrangementDescription(preference.arrangement, passengerCount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {((passengerCount === 1 && preference.sections.length > 0 && preference.position) ||
            (passengerCount > 1 && preference.sections.length > 0 && preference.arrangement)) && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto px-8 py-3"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Seat Preference'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimplifiedSeatSelection
