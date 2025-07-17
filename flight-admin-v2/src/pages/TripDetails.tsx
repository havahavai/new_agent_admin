import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ArrowLeft,
  Plane,
  Users,
  FileText,
  Download,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  CreditCard
} from 'lucide-react'
import { getBookingDetails, type BookingDetails, type BookingPassenger, type BoardingPass } from '@/data/flights'
import { BoardingPass as BoardingPassComponent } from '@/components/ui/boarding-pass'
import { countries } from '@/data/countries'
import { getFlightDataByIds, FlightDataByIdsResponse, ApiError } from '@/api'

// Helper function to convert API response to BookingDetails format
const convertApiToBookingDetails = (apiData: FlightDataByIdsResponse['data']): BookingDetails => {
  const passengers: BookingPassenger[] = apiData.passengers.map((passenger, index) => ({
    id: `passenger-${index}`,
    name: `${passenger.firstName} ${passenger.lastName}`,
    email: passenger.email,
    phone: passenger.mobileNumber,
    seatNumber: passenger.seatNumber || '',
    ticketClass: 'Economy', // Default since not provided in API
    status: apiData.checkInStatus === 'FAILED' ? 'Pending' : 'Checked In' as BookingPassenger['status'],
    isMainPassenger: index === 0,
    dateOfBirth: passenger.dateOfBirth || new Date().toISOString(),
    gender: (passenger.gender === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
    nationality: passenger.country || 'US',
    passportNumber: passenger.documents[0]?.number || '',
    passportIssueDate: passenger.documents[0]?.issueDate || new Date().toISOString(),
    passportExpiry: passenger.documents[0]?.expiry || new Date().toISOString(),
    passportIssuePlace: passenger.documents[0]?.country || 'US',
    hasDocuments: passenger.documents.length > 0,
    specialRequests: [],
    boardingPass: passenger.boardingPassUrl ? {
      id: `bp-${index}`,
      passengerId: `passenger-${index}`,
      flightId: 'api-flight',
      passengerName: `${passenger.firstName} ${passenger.lastName}`,
      flightNumber: apiData.flightNumber,
      date: new Date(apiData.departure.time).toLocaleDateString(),
      departure: new Date(apiData.departure.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      arrival: new Date(apiData.arrival.time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      route: {
        from: apiData.departure.city,
        to: apiData.arrival.city,
        fromCode: apiData.departure.airportIata,
        toCode: apiData.arrival.airportIata
      },
      seatNumber: passenger.seatNumber || 'TBD',
      gate: apiData.boardingGate || 'TBD',
      boardingGroup: 'A',
      ticketClass: 'Economy',
      barcode: `${apiData.flightNumber}${passenger.firstName}${passenger.lastName}`.replace(/\s/g, '').toUpperCase(),
      qrCode: `QR${apiData.flightNumber}${passenger.firstName}${passenger.lastName}`.replace(/\s/g, '').toUpperCase(),
      issuedAt: new Date().toISOString()
    } : undefined
  }))

  return {
    pnr: apiData.pnr,
    bookingReference: apiData.bookingReference || apiData.pnr,
    flight: {
      id: apiData.flightNumber,
      flightNumber: apiData.flightNumber,
      route: {
        from: apiData.departure.city,
        to: apiData.arrival.city,
        fromCode: apiData.departure.airportIata,
        toCode: apiData.arrival.airportIata
      },
      departure: new Date(apiData.departure.time).toLocaleString(),
      arrival: new Date(apiData.arrival.time).toLocaleString(),
      checkInStatus: apiData.checkInStatus,
      aircraft: apiData.aircraftType,
      gate: apiData.boardingGate || 'TBD',
      status: apiData.checkInStatus === 'FAILED' ? 'Delayed' : 'On Time',
      flightType: apiData.isInternational ? 'International' : 'Domestic',
      webCheckinStatus: apiData.checkInStatus === 'FAILED' ? 'Failed' : 'Completed',
      delay: apiData.checkInStatus === 'FAILED' ? 30 : undefined,
      passengers: passengers.length
    },
    passengers,
    totalPassengers: passengers.length,
    checkedInPassengers: passengers.filter(p => p.status === 'Checked In').length,
    boardedPassengers: passengers.filter(p => p.status === 'Boarded').length,
    pendingPassengers: passengers.filter(p => p.status === 'Pending').length,
    bookingDate: new Date().toISOString(),
    bookingStatus: 'Confirmed' as const,
    totalAmount: 0,
    currency: 'USD',
    contactEmail: passengers[0]?.email || '',
    contactPhone: passengers[0]?.phone || ''
  }
}

// Always editable field component
interface EditableFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'date'
  className?: string
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    </div>
  )
}

// Gender selector component
interface GenderSelectorProps {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

const GenderSelector: React.FC<GenderSelectorProps> = ({
  label,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Male">Male</SelectItem>
          <SelectItem value="Female">Female</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// Read-only field component
interface ReadOnlyFieldProps {
  label: string
  value: string
  className?: string
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({
  label,
  value,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-900">
        {value}
      </div>
    </div>
  )
}

// Country selector component for nationality
interface NationalitySelectorProps {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

const NationalitySelector: React.FC<NationalitySelectorProps> = ({
  label,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Editable field with copy/apply functionality
interface EditableFieldWithCopyProps {
  label: string
  value: string
  onChange: (value: string) => void
  onCopyToAll: (value: string) => void
  type?: 'text' | 'email' | 'tel'
  className?: string
}

const EditableFieldWithCopy: React.FC<EditableFieldWithCopyProps> = ({
  label,
  value,
  onChange,
  onCopyToAll,
  type = 'text',
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex space-x-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCopyToAll(value)}
          disabled={!value}
          className="px-2 text-xs"
        >
          Apply to All
        </Button>
      </div>
    </div>
  )
}

// Country selector component for issue place
interface CountrySelectorProps {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  label,
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const TripDetails = () => {
  const { flightId, ticketId } = useParams<{ flightId: string; ticketId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiData, setApiData] = useState<FlightDataByIdsResponse['data'] | null>(null)

  useEffect(() => {
    const fetchFlightDetails = async () => {
      if (!flightId) return

      try {
        setLoading(true)
        setError(null)

        // Get ticketId from URL params or search params (fallback)
        const finalTicketId = ticketId || searchParams.get('ticketId')

        if (finalTicketId) {
          // Try to fetch from API first
          const response = await getFlightDataByIds(flightId, finalTicketId)

          if ('success' in response && response.success) {
            const apiResponse = response as FlightDataByIdsResponse
            setApiData(apiResponse.data)

            // Convert API data to BookingDetails format
            const convertedBookingDetails = convertApiToBookingDetails(apiResponse.data)
            setBookingDetails(convertedBookingDetails)
          } else {
            const errorResponse = response as ApiError
            setError(errorResponse.message)
            // Fallback to mock data
            const details = getBookingDetails(flightId)
            setBookingDetails(details)
          }
        } else {
          // No ticketId, use mock data
          const details = getBookingDetails(flightId)
          setBookingDetails(details)
        }
      } catch (err) {
        console.error('Error fetching flight details:', err)
        setError('Failed to load flight details')
        // Fallback to mock data
        const details = getBookingDetails(flightId)
        setBookingDetails(details)
      } finally {
        setLoading(false)
      }
    }

    fetchFlightDetails()
  }, [flightId, ticketId, searchParams])

  const handleFieldChange = (section: string, field: string, value: string, passengerIndex?: number) => {
    if (!bookingDetails) return

    const updatedBooking = { ...bookingDetails }

    if (section === 'booking') {
      (updatedBooking as any)[field] = value
    } else if (section === 'flight') {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        ;(updatedBooking.flight as any)[parent][child] = value
      } else {
        (updatedBooking.flight as any)[field] = value
      }
    } else if (section === 'passenger' && passengerIndex !== undefined) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        ;(updatedBooking.passengers[passengerIndex] as any)[parent][child] = value
      } else {
        (updatedBooking.passengers[passengerIndex] as any)[field] = value
      }
    }

    setBookingDetails(updatedBooking)
    // Here you would typically save to backend
    console.log('Field updated:', section, field, value)
  }

  const handleCopyEmailToAll = (email: string) => {
    if (!bookingDetails || !email) return

    const updatedBooking = { ...bookingDetails }
    updatedBooking.passengers = updatedBooking.passengers.map(passenger => ({
      ...passenger,
      email: email
    }))

    setBookingDetails(updatedBooking)
    console.log('Email copied to all passengers:', email)
  }

  const handleCopyPhoneToAll = (phone: string) => {
    if (!bookingDetails || !phone) return

    const updatedBooking = { ...bookingDetails }
    updatedBooking.passengers = updatedBooking.passengers.map(passenger => ({
      ...passenger,
      phone: phone
    }))

    setBookingDetails(updatedBooking)
    console.log('Phone copied to all passengers:', phone)
  }

  const handleDownloadBoardingPass = (boardingPass: BoardingPass) => {
    // Create a comprehensive HTML boarding pass
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boarding Pass - ${boardingPass.flightNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        .boarding-pass {
            background: white;
            border: 2px dashed #2563eb;
            border-radius: 12px;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            position: relative;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        }
        .airline-logo {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .boarding-pass-title {
            font-size: 24px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
        }
        .flight-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .info-title {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 5px;
        }
        .route-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            border-radius: 12px;
        }
        .route-cities {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .route-codes {
            font-size: 16px;
            opacity: 0.9;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-item {
            text-align: center;
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .barcode-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px dashed #d1d5db;
        }
        .barcode {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            background: #111827;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body { background: white; padding: 0; }
            .boarding-pass { box-shadow: none; border: 2px solid #333; }
        }
        @media (max-width: 768px) {
            .flight-info { grid-template-columns: 1fr; gap: 15px; }
            .details-grid { grid-template-columns: 1fr 1fr; }
            .route-cities { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="boarding-pass">
        <div class="header">
            <div class="airline-logo">✈ AIRLINE</div>
            <div class="boarding-pass-title">BOARDING PASS</div>
        </div>

        <div class="flight-info">
            <div class="info-section">
                <div class="info-title">Passenger Name</div>
                <div class="info-value">${boardingPass.passengerName}</div>
                <div class="info-title">Flight Number</div>
                <div class="info-value">${boardingPass.flightNumber}</div>
            </div>
            <div class="info-section">
                <div class="info-title">Date</div>
                <div class="info-value">${boardingPass.date}</div>
                <div class="info-title">Departure Time</div>
                <div class="info-value">${boardingPass.departure}</div>
            </div>
        </div>

        <div class="route-section">
            <div class="route-cities">${boardingPass.route.from} → ${boardingPass.route.to}</div>
            <div class="route-codes">${boardingPass.route.fromCode} → ${boardingPass.route.toCode}</div>
        </div>

        <div class="details-grid">
            <div class="detail-item">
                <div class="info-title">Seat</div>
                <div class="info-value">${boardingPass.seatNumber}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Gate</div>
                <div class="info-value">${boardingPass.gate}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Boarding Group</div>
                <div class="info-value">${boardingPass.boardingGroup}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Class</div>
                <div class="info-value">${boardingPass.ticketClass}</div>
            </div>
        </div>

        <div class="barcode-section">
            <div class="barcode">${boardingPass.barcode}</div>
            <div style="color: #6b7280; font-size: 12px;">Scan at gate for boarding</div>
        </div>

        <div class="footer">
            <p>Please arrive at the gate 30 minutes before departure</p>
            <p>Issued: ${new Date(boardingPass.issuedAt).toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `.trim()

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boarding-pass-${boardingPass.flightNumber}-${boardingPass.passengerName.replace(/\s+/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrintBoardingPass = (boardingPass: BoardingPass) => {
    // Create the same HTML content for printing
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boarding Pass - ${boardingPass.flightNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 20px;
            color: #333;
        }
        .boarding-pass {
            background: white;
            border: 2px solid #333;
            border-radius: 12px;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .airline-logo {
            font-size: 32px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
        }
        .boarding-pass-title {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        .flight-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f8f8f8;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #000;
        }
        .info-title {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        .route-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #000;
            color: white;
            border-radius: 12px;
        }
        .route-cities {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .route-codes {
            font-size: 16px;
            opacity: 0.9;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .detail-item {
            text-align: center;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .barcode-section {
            text-align: center;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px dashed #333;
        }
        .barcode {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            background: #000;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { padding: 0; }
            .boarding-pass { border: 2px solid #000; }
        }
    </style>
</head>
<body>
    <div class="boarding-pass">
        <div class="header">
            <div class="airline-logo">✈ AIRLINE</div>
            <div class="boarding-pass-title">BOARDING PASS</div>
        </div>

        <div class="flight-info">
            <div class="info-section">
                <div class="info-title">Passenger Name</div>
                <div class="info-value">${boardingPass.passengerName}</div>
                <div class="info-title">Flight Number</div>
                <div class="info-value">${boardingPass.flightNumber}</div>
            </div>
            <div class="info-section">
                <div class="info-title">Date</div>
                <div class="info-value">${boardingPass.date}</div>
                <div class="info-title">Departure Time</div>
                <div class="info-value">${boardingPass.departure}</div>
            </div>
        </div>

        <div class="route-section">
            <div class="route-cities">${boardingPass.route.from} → ${boardingPass.route.to}</div>
            <div class="route-codes">${boardingPass.route.fromCode} → ${boardingPass.route.toCode}</div>
        </div>

        <div class="details-grid">
            <div class="detail-item">
                <div class="info-title">Seat</div>
                <div class="info-value">${boardingPass.seatNumber}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Gate</div>
                <div class="info-value">${boardingPass.gate}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Boarding Group</div>
                <div class="info-value">${boardingPass.boardingGroup}</div>
            </div>
            <div class="detail-item">
                <div class="info-title">Class</div>
                <div class="info-value">${boardingPass.ticketClass}</div>
            </div>
        </div>

        <div class="barcode-section">
            <div class="barcode">${boardingPass.barcode}</div>
            <div style="color: #666; font-size: 12px;">Scan at gate for boarding</div>
        </div>

        <div class="footer">
            <p>Please arrive at the gate 30 minutes before departure</p>
            <p>Issued: ${new Date(boardingPass.issuedAt).toLocaleString()}</p>
        </div>
    </div>
    <script>
        window.onload = function() {
            window.print();
            window.onafterprint = function() {
                window.close();
            }
        }
    </script>
</body>
</html>
    `.trim()

    // Open in new window and print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
  }

  const handleDownloadTextBoardingPass = (boardingPass: BoardingPass) => {
    // Create a simple text representation of the boarding pass
    const content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                BOARDING PASS                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  PASSENGER: ${boardingPass.passengerName.padEnd(25)} FLIGHT: ${boardingPass.flightNumber.padEnd(10)}        ║
║                                                                              ║
║  FROM: ${boardingPass.route.fromCode.padEnd(3)} ${boardingPass.route.from.padEnd(20)} TO: ${boardingPass.route.toCode.padEnd(3)} ${boardingPass.route.to.padEnd(15)} ║
║                                                                              ║
║  DATE: ${boardingPass.date.padEnd(12)} DEPARTURE: ${boardingPass.departure.padEnd(8)} SEAT: ${boardingPass.seatNumber.padEnd(4)}     ║
║                                                                              ║
║  GATE: ${boardingPass.gate.padEnd(4)} BOARDING GROUP: ${boardingPass.boardingGroup.padEnd(8)} CLASS: ${boardingPass.ticketClass.padEnd(12)} ║
║                                                                              ║
║  ${boardingPass.barcode.padEnd(70)} ║
║                                                                              ║
║  Please arrive at gate 30 minutes before departure                          ║
║  Issued: ${new Date(boardingPass.issuedAt).toLocaleString().padEnd(50)}                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boarding-pass-${boardingPass.flightNumber}-${boardingPass.passengerName.replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: BookingPassenger['status']) => {
    switch (status) {
      case 'Boarded':
        return 'bg-green-100 text-green-800'
      case 'Checked In':
        return 'bg-blue-100 text-blue-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFlightStatusColor = (status: string) => {
    switch (status) {
      case 'On Time':
        return 'bg-green-100 text-green-800'
      case 'Delayed':
        return 'bg-red-100 text-red-800'
      case 'Boarding':
        return 'bg-blue-100 text-blue-800'
      case 'Departed':
        return 'bg-gray-100 text-gray-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getWebCheckinStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'Failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Plane className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!bookingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Plane className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Booking not found</h3>
          <p className="text-gray-500 mb-4">The requested booking could not be found.</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Button>
        </div>
      </div>
    )
  }

  const { pnr, bookingReference, flight, passengers, totalPassengers, checkedInPassengers, boardedPassengers, pendingPassengers, bookingDate, totalAmount, currency, contactEmail, contactPhone } = bookingDetails

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error}. Showing fallback data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        {/* Back button row */}
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Trips</span>
          </Button>
        </div>

        {/* Header content row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {flight.route.fromCode} → {flight.route.toCode}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-gray-600">
              <p>Flight {flight.flightNumber}</p>
              <p className="flex items-center space-x-1">
                <span>•</span>
                <span>PNR: <span className="font-semibold text-gray-900">{pnr}</span></span>
              </p>
              <p className="flex items-center space-x-1">
                <span>•</span>
                <span>{totalPassengers} passenger{totalPassengers !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Badge className={getWebCheckinStatusColor(flight.webCheckinStatus)} variant="outline">
              Web Check-in: {flight.webCheckinStatus}
            </Badge>
          </div>
        </div>
      </div>



      {/* Accordion Sections */}
      <Accordion type="single" collapsible defaultValue="booking-info" className="w-full space-y-4">
        {/* Booking Information */}
        <AccordionItem value="booking-info">
          <AccordionTrigger className="text-left">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Booking Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <EditableField
                  label="PNR Code"
                  value={pnr}
                  onChange={(value) => handleFieldChange('booking', 'pnr', value)}
                />
                <EditableField
                  label="Booking Reference"
                  value={bookingReference}
                  onChange={(value) => handleFieldChange('booking', 'bookingReference', value)}
                />

              </div>
              <div className="space-y-4">
                <EditableField
                  label="Contact Email"
                  value={contactEmail}
                  onChange={(value) => handleFieldChange('booking', 'contactEmail', value)}
                  type="email"
                />
                <EditableField
                  label="Contact Phone"
                  value={contactPhone}
                  onChange={(value) => handleFieldChange('booking', 'contactPhone', value)}
                  type="tel"
                />

              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        {/* Flight Information */}
        <AccordionItem value="flight-info">
          <AccordionTrigger className="text-left">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Flight Information</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <EditableField
                  label="Flight Number"
                  value={flight.flightNumber}
                  onChange={(value) => handleFieldChange('flight', 'flightNumber', value)}
                />
                <EditableField
                  label="From City"
                  value={flight.route.from}
                  onChange={(value) => handleFieldChange('flight', 'route.from', value)}
                />
                <EditableField
                  label="From Code"
                  value={flight.route.fromCode}
                  onChange={(value) => handleFieldChange('flight', 'route.fromCode', value)}
                />
                <EditableField
                  label="To City"
                  value={flight.route.to}
                  onChange={(value) => handleFieldChange('flight', 'route.to', value)}
                />
                <EditableField
                  label="To Code"
                  value={flight.route.toCode}
                  onChange={(value) => handleFieldChange('flight', 'route.toCode', value)}
                />
              </div>
              <div className="space-y-4">
                <EditableField
                  label="Aircraft"
                  value={flight.aircraft}
                  onChange={(value) => handleFieldChange('flight', 'aircraft', value)}
                />
                <ReadOnlyField
                  label="Departure Time"
                  value={flight.departure}
                />
                <ReadOnlyField
                  label="Arrival Time"
                  value={flight.arrival}
                />
                <EditableField
                  label="Gate"
                  value={flight.gate || 'TBD'}
                  onChange={(value) => handleFieldChange('flight', 'gate', value)}
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {flight.status && flight.status !== 'Departed' && (
                  <Badge className={getFlightStatusColor(flight.status)}>
                    {flight.status}
                    {flight.delay && ` (+${flight.delay}min)`}
                  </Badge>
                )}
                <Badge variant="outline">
                  {flight.flightType}
                </Badge>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Passenger Details */}
        <AccordionItem value="passengers">
          <AccordionTrigger className="text-left">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Passenger Details ({totalPassengers} passengers)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              {passengers.map((passenger, index) => (
                <Card key={passenger.id} className={`border-l-4 ${passenger.isMainPassenger ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-gray-300'}`}>
                  <CardContent className="p-6">
                    {/* Header with name, status, and boarding pass button */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-6 w-6 text-gray-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">{passenger.name}</h3>
                            {passenger.isMainPassenger && (
                              <Badge variant="secondary" className="text-xs">Main Passenger</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {passenger.seatNumber ? `Seat ${passenger.seatNumber}` : 'Seat not assigned'} • {passenger.ticketClass}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                        {passenger.boardingPass && (
                          <Button
                            size="sm"
                            onClick={() => handleDownloadBoardingPass(passenger.boardingPass!)}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download Boarding Pass</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-1">Personal Information</h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <EditableField
                              label="First Name"
                              value={passenger.name.split(' ')[0] || ''}
                              onChange={(value) => {
                                const lastName = passenger.name.split(' ').slice(1).join(' ') || ''
                                const fullName = lastName ? `${value} ${lastName}` : value
                                handleFieldChange('passenger', 'name', fullName, index)
                              }}
                              className="text-sm"
                            />
                            <EditableField
                              label="Last Name"
                              value={passenger.name.split(' ').slice(1).join(' ') || ''}
                              onChange={(value) => {
                                const firstName = passenger.name.split(' ')[0] || ''
                                const fullName = firstName ? `${firstName} ${value}` : value
                                handleFieldChange('passenger', 'name', fullName, index)
                              }}
                              className="text-sm"
                            />
                          </div>
                          <EditableField
                            label="Date of Birth"
                            value={new Date(passenger.dateOfBirth).toISOString().split('T')[0]}
                            onChange={(value) => handleFieldChange('passenger', 'dateOfBirth', new Date(value).toISOString(), index)}
                            type="date"
                            className="text-sm"
                          />
                          <GenderSelector
                            label="Gender"
                            value={passenger.gender}
                            onChange={(value) => handleFieldChange('passenger', 'gender', value, index)}
                            className="text-sm"
                          />
                          <NationalitySelector
                            label="Country"
                            value={passenger.nationality}
                            onChange={(value) => handleFieldChange('passenger', 'nationality', value, index)}
                            className="text-sm"
                          />
                          <EditableFieldWithCopy
                            label="Email"
                            value={passenger.email || ''}
                            onChange={(value) => handleFieldChange('passenger', 'email', value, index)}
                            onCopyToAll={handleCopyEmailToAll}
                            type="email"
                            className="text-sm"
                          />
                          <EditableFieldWithCopy
                            label="Phone"
                            value={passenger.phone || ''}
                            onChange={(value) => handleFieldChange('passenger', 'phone', value, index)}
                            onCopyToAll={handleCopyPhoneToAll}
                            type="tel"
                            className="text-sm"
                          />
                          <EditableField
                            label="Seat Number"
                            value={passenger.seatNumber || ''}
                            onChange={(value) => handleFieldChange('passenger', 'seatNumber', value, index)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-1">Passport Details</h4>
                        <div className="space-y-3">
                          <EditableField
                            label="Passport Number"
                            value={passenger.passportNumber}
                            onChange={(value) => handleFieldChange('passenger', 'passportNumber', value, index)}
                            className="text-sm"
                          />
                          <EditableField
                            label="Issue Date"
                            value={new Date(passenger.passportIssueDate).toISOString().split('T')[0]}
                            onChange={(value) => handleFieldChange('passenger', 'passportIssueDate', new Date(value).toISOString(), index)}
                            type="date"
                            className="text-sm"
                          />
                          <EditableField
                            label="Expiry Date"
                            value={new Date(passenger.passportExpiry).toISOString().split('T')[0]}
                            onChange={(value) => handleFieldChange('passenger', 'passportExpiry', new Date(value).toISOString(), index)}
                            type="date"
                            className="text-sm"
                          />
                          <CountrySelector
                            label="Issue Place"
                            value={passenger.passportIssuePlace}
                            onChange={(value) => handleFieldChange('passenger', 'passportIssuePlace', value, index)}
                            className="text-sm"
                          />
                        </div>
                        {!passenger.hasDocuments && (
                          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                            <FileText className="h-5 w-5" />
                            <span className="text-sm font-medium">Passport documents required</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Special Requests */}
                    {passenger.specialRequests && passenger.specialRequests.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                        <div className="flex flex-wrap gap-2">
                          {passenger.specialRequests.map((request, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {request}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>


      </Accordion>
    </div>
  )
}

export default TripDetails
