import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Plane, ArrowRight, Clock, MapPin } from 'lucide-react'
import { searchManualFlight, confirmManualFlight, FlightOption, getB2BUserInfo, B2BUserResponse, ApiError } from '@/api'

interface AddFlightManuallyDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export interface FlightFormData {
  airline: string
  flightNumber: string
  departureDate: Date | undefined
}

type DialogStep = 'input' | 'selection' | 'confirming'

// Common airlines list
const AIRLINES = [
  { code: 'AA', name: 'American Airlines' },
  { code: 'UA', name: 'United Airlines' },
  { code: 'DL', name: 'Delta Air Lines' },
  { code: 'WN', name: 'Southwest Airlines' },
  { code: 'AS', name: 'Alaska Airlines' },
  { code: 'B6', name: 'JetBlue Airways' },
  { code: 'NK', name: 'Spirit Airlines' },
  { code: 'F9', name: 'Frontier Airlines' },
  { code: 'AI', name: 'Air India' },
  { code: 'BA', name: 'British Airways' },
  { code: 'EK', name: 'Emirates' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM' },
  { code: 'QR', name: 'Qatar Airways' },
  { code: 'EY', name: 'Etihad Airways' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: '6E', name: 'IndiGo' },
  { code: 'SG', name: 'SpiceJet' },
].sort((a, b) => a.name.localeCompare(b.name))

export const AddFlightManuallyDialog: React.FC<AddFlightManuallyDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<DialogStep>('input')
  const [airline, setAirline] = useState<string>('')
  const [flightNumber, setFlightNumber] = useState<string>('')
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined)
  const [flightOptions, setFlightOptions] = useState<FlightOption[]>([])
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userFirstName, setUserFirstName] = useState('')
  const [userLastName, setUserLastName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation states
  const [touched, setTouched] = useState({
    airline: false,
    flightNumber: false,
    departureDate: false,
  })

  // Fetch user info when dialog opens
  useEffect(() => {
    if (isOpen && !userEmail) {
      fetchUserInfo()
    }
  }, [isOpen])

  const fetchUserInfo = async () => {
    try {
      const response = await getB2BUserInfo()
      if ('success' in response && response.success) {
        const userResponse = response as B2BUserResponse
        setUserEmail(userResponse.data.emails[0] || '')
        setUserFirstName(userResponse.data.firstName || '')
        setUserLastName(userResponse.data.lastName || '')
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
      setStep('input')
      setAirline('')
      setFlightNumber('')
      setDepartureDate(undefined)
      setFlightOptions([])
      setSelectedFlight(null)
      setError(null)
      setTouched({
        airline: false,
        flightNumber: false,
        departureDate: false,
      })
      onClose()
    }
  }

  const validateForm = (): boolean => {
    if (!airline) {
      setError('Please select an airline')
      return false
    }
    if (!flightNumber.trim()) {
      setError('Please enter a flight number')
      return false
    }
    if (!departureDate) {
      setError('Please select a departure date')
      return false
    }
    return true
  }

  // Step 1: Search for flights
  const handleSearchFlights = async () => {
    // Mark all fields as touched
    setTouched({
      airline: true,
      flightNumber: true,
      departureDate: true,
    })

    setError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Construct full flight number
      const fullFlightNumber = `${airline}${flightNumber}`

      const response = await searchManualFlight(fullFlightNumber, departureDate!)

      if ('success' in response && response.success && response.data) {
        if (response.data.length === 0) {
          setError('No flights found for this flight number and date')
          setIsSubmitting(false)
          return
        }

        setFlightOptions(response.data)
        setStep('selection')
      } else {
        const errorResponse = response as ApiError
        setError(errorResponse.message || 'Failed to search flights')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search flights')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Confirm selected flight
  const handleConfirmFlight = async () => {
    if (!selectedFlight) {
      setError('Please select a flight')
      return
    }

    setIsSubmitting(true)
    setStep('confirming')

    try {
      const response = await confirmManualFlight(
        selectedFlight,
        userEmail,
        userFirstName,
        userLastName
      )

      if ('success' in response && response.success) {
        await onSuccess()
        handleClose()
      } else {
        const errorResponse = response as ApiError
        setError(errorResponse.message || 'Failed to confirm flight')
        setStep('selection')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm flight')
      setStep('selection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToInput = () => {
    setStep('input')
    setFlightOptions([])
    setSelectedFlight(null)
    setError(null)
  }

  const isFieldEmpty = (field: keyof typeof touched, value: any) => {
    return touched[field] && !value
  }

  // Get selected airline details
  const selectedAirline = AIRLINES.find(a => a.code === airline)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Plane className="h-5 w-5 text-blue-600" />
            {step === 'input' && 'Add Flight'}
            {step === 'selection' && 'Select Flight'}
            {step === 'confirming' && 'Confirming Flight'}
          </DialogTitle>
        </DialogHeader>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 -mt-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Input Form */}
        {step === 'input' && (
          <>
            <div className="space-y-5 py-2">
              {/* Airline Selection */}
              <div className="space-y-2">
                <Label htmlFor="airline">
                  Airline <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={airline}
                  onValueChange={(value) => {
                    setAirline(value)
                    setTouched({ ...touched, airline: true })
                  }}
                >
                  <SelectTrigger
                    id="airline"
                    className={
                      isFieldEmpty('airline', airline)
                        ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }
                  >
                    <SelectValue placeholder="Select airline" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {AIRLINES.map((airlineOption) => (
                      <SelectItem
                        key={airlineOption.code}
                        value={airlineOption.code}
                      >
                        {airlineOption.name} ({airlineOption.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flight Number */}
              <div className="space-y-2">
                <Label htmlFor="flightNumber">
                  Flight Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  {airline && (
                    <div className="flex-shrink-0 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 font-medium text-sm">
                      {airline}
                    </div>
                  )}
                  <Input
                    id="flightNumber"
                    placeholder={airline ? "e.g., 235" : "Select airline first"}
                    value={flightNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setFlightNumber(value)
                      setTouched({ ...touched, flightNumber: true })
                    }}
                    disabled={!airline}
                    maxLength={4}
                    className={`flex-1 ${
                      isFieldEmpty('flightNumber', flightNumber)
                        ? 'border-red-500 border-2 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                  />
                </div>
                {airline && (
                  <p className="text-xs text-gray-500">
                    Full flight number: {airline}{flightNumber || 'XXXX'}
                  </p>
                )}
              </div>

              {/* Departure Date */}
              <div className="space-y-2">
                <Label htmlFor="departureDate">
                  Departure Date <span className="text-red-500">*</span>
                </Label>
                <DatePicker
                  date={departureDate}
                  onChange={(date) => {
                    setDepartureDate(date)
                    setTouched({ ...touched, departureDate: true })
                  }}
                  placeholder="DD-MM-YYYY"
                  className={
                    isFieldEmpty('departureDate', departureDate)
                      ? '[&_input]:border-red-500 [&_input]:border-2'
                      : ''
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSearchFlights}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  'Search Flights'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Flight Selection */}
        {step === 'selection' && (
          <>
            <div className="space-y-3 py-2 max-h-[50vh] overflow-y-auto">
              {flightOptions.map((flight, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFlight(flight)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedFlight === flight
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600">{flight.flight_number}</span>
                      <span className="text-xs text-gray-500">{flight.departure_date}</span>
                    </div>
                    <span className="text-xs text-gray-500">{flight.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">{flight.dep_airport}</span>
                      <span className="text-gray-500">{flight.departure_time}</span>
                    </div>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="font-medium">{flight.arr_airport}</span>
                      <span className="text-gray-500">{flight.arrival_time}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {flight.departure_city} → {flight.arrival_city}
                  </div>
                </button>
              ))}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToInput}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleConfirmFlight}
                disabled={!selectedFlight || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirming...
                  </>
                ) : (
                  'Confirm Flight'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Confirming (Loading State) */}
        {step === 'confirming' && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Confirming your flight...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AddFlightManuallyDialog

