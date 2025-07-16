import type { Flight } from '@/components/ui/flight-list'

// Extended interfaces for booking/PNR details
export interface BookingPassenger {
  id: string
  name: string
  email?: string
  phone?: string
  seatNumber?: string
  ticketClass: 'Economy' | 'Business' | 'First Class'
  status: 'Checked In' | 'Boarded' | 'Pending'
  hasDocuments: boolean
  nationality: string
  passportNumber: string
  passportExpiry: string
  passportIssueDate: string
  passportIssuePlace: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  specialRequests?: string[]
  boardingPass?: BoardingPass
  isMainPassenger: boolean
}

export interface BoardingPass {
  id: string
  passengerId: string
  flightId: string
  passengerName: string
  flightNumber: string
  route: {
    from: string
    to: string
    fromCode: string
    toCode: string
  }
  date: string
  departure: string
  arrival: string
  seatNumber: string
  gate: string
  boardingGroup: string
  ticketClass: string
  barcode: string
  qrCode: string
  issuedAt: string
}

export interface BookingDetails {
  pnr: string
  bookingReference: string
  flight: Flight
  passengers: BookingPassenger[]
  totalPassengers: number
  checkedInPassengers: number
  boardedPassengers: number
  pendingPassengers: number
  bookingDate: string
  bookingStatus: 'Confirmed' | 'Pending' | 'Cancelled'
  totalAmount: number
  currency: string
  contactEmail: string
  contactPhone: string
}

// Generate dates for the next 30 days
export const generateDateRange = (days: number = 30): Date[] => {
  const dates: Date[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }
  
  return dates
}

// Mock flight data
const mockFlights: Flight[] = [
  // Today's flights
  {
    id: 'FL001',
    flightNumber: 'AI 675',
    route: {
      from: 'New York',
      to: 'Los Angeles',
      fromCode: 'JFK',
      toCode: 'LAX'
    },
    departure: '08:30 AM',
    arrival: '11:45 AM',
    status: 'On Time',
    passengers: 4,
    aircraft: 'Boeing 737-800',
    gate: 'A12',
    webCheckinStatus: 'Completed',
    flightType: 'Domestic'
  },
  {
    id: 'FL002',
    flightNumber: 'UA5678',
    route: {
      from: 'Chicago',
      to: 'Miami',
      fromCode: 'ORD',
      toCode: 'MIA'
    },
    departure: '10:15 AM',
    arrival: '02:30 PM',
    status: 'Delayed',
    passengers: 2,
    aircraft: 'Airbus A320',
    gate: 'B8',
    delay: 25,
    webCheckinStatus: 'In Progress',
    flightType: 'Domestic'
  },
  {
    id: 'FL003',
    flightNumber: 'DL9012',
    route: {
      from: 'Seattle',
      to: 'Denver',
      fromCode: 'SEA',
      toCode: 'DEN'
    },
    departure: '02:45 PM',
    arrival: '05:20 PM',
    status: 'Boarding',
    passengers: 6,
    aircraft: 'Boeing 757-200',
    gate: 'C15',
    webCheckinStatus: 'Scheduled',
    flightType: 'Domestic'
  },
  {
    id: 'FL004',
    flightNumber: 'SW3456',
    route: {
      from: 'Boston',
      to: 'San Francisco',
      fromCode: 'BOS',
      toCode: 'SFO'
    },
    departure: '06:20 PM',
    arrival: '09:45 PM',
    status: 'On Time',
    passengers: 3,
    aircraft: 'Boeing 737-700',
    gate: 'D22',
    webCheckinStatus: 'Failed',
    flightType: 'Domestic'
  },
  {
    id: 'FL005',
    flightNumber: 'JB7890',
    route: {
      from: 'Atlanta',
      to: 'Las Vegas',
      fromCode: 'ATL',
      toCode: 'LAS'
    },
    departure: '08:10 PM',
    arrival: '09:30 PM',
    status: 'On Time',
    passengers: 8,
    aircraft: 'Airbus A321',
    gate: 'E7',
    webCheckinStatus: 'Completed',
    flightType: 'International'
  },
  {
    id: 'FL006',
    flightNumber: 'AI2468',
    route: {
      from: 'Mumbai',
      to: 'Delhi',
      fromCode: 'BOM',
      toCode: 'DEL'
    },
    departure: '11:30 AM',
    arrival: '01:45 PM',
    status: 'On Time',
    passengers: 5,
    aircraft: 'Airbus A320',
    gate: 'F12',
    webCheckinStatus: 'Document Pending',
    flightType: 'Domestic'
  }
]

// Generate flights for different dates
export const generateFlightsForDate = (date: Date): Flight[] => {
  const today = new Date()
  const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  // Some dates have no flights (every 4th day starting from day 3)
  if ((daysDiff + 3) % 4 === 0 && daysDiff > 0) {
    return []
  }
  
  // Generate different flight patterns based on the day
  const baseFlights = [...mockFlights]
  const flightsForDate: Flight[] = []
  
  // Vary the number of flights per day (1-5 flights)
  const numFlights = Math.max(1, Math.min(5, Math.abs(daysDiff % 5) + 1))
  
  for (let i = 0; i < numFlights; i++) {
    const baseFlight = baseFlights[i % baseFlights.length]
    const flightId = `FL${String(daysDiff * 10 + i + 1).padStart(3, '0')}`
    
    // Modify flight details based on date
    const modifiedFlight: Flight = {
      ...baseFlight,
      id: flightId,
      flightNumber: generateFlightNumber(daysDiff, i),
      passengers: Math.floor(Math.random() * 9) + 1, // 1-9 passengers per ticket
      status: generateRandomStatus(daysDiff, i),
      gate: generateGate(i),
      delay: undefined,
      webCheckinStatus: generateWebCheckinStatus(daysDiff, i),
      flightType: generateFlightType(daysDiff, i)
    }
    
    // Add delay for delayed flights
    if (modifiedFlight.status === 'Delayed') {
      modifiedFlight.delay = Math.floor(Math.random() * 60) + 10 // 10-70 minutes
    }
    
    flightsForDate.push(modifiedFlight)
  }
  
  return flightsForDate
}

const generateFlightNumber = (daysDiff: number, index: number): string => {
  const airlines = ['AA', 'UA', 'DL', 'SW', 'JB', 'AS', 'NK', 'F9']
  const airline = airlines[(daysDiff + index) % airlines.length]
  const number = String(Math.abs(daysDiff * 100 + index * 123 + 1000) % 9000 + 1000)
  return `${airline}${number}`
}

const generateRandomStatus = (daysDiff: number, index: number): Flight['status'] => {
  const statuses: Flight['status'][] = ['On Time', 'Delayed', 'Boarding', 'Departed']
  
  // Today's flights have more varied statuses
  if (daysDiff === 0) {
    return statuses[index % statuses.length]
  }
  
  // Future flights are mostly "On Time"
  if (daysDiff > 0) {
    const rand = (daysDiff + index) % 10
    if (rand < 7) return 'On Time'
    if (rand < 9) return 'Delayed'
    return 'Boarding'
  }
  
  // Past flights are mostly "Departed"
  return 'Departed'
}

const generateGate = (index: number): string => {
  const terminals = ['A', 'B', 'C', 'D', 'E']
  const terminal = terminals[index % terminals.length]
  const gate = Math.floor(Math.random() * 30) + 1
  return `${terminal}${gate}`
}

const generateWebCheckinStatus = (daysDiff: number, index: number): Flight['webCheckinStatus'] => {
  const rand = (daysDiff + index) % 10

  if (rand < 3) return 'Completed'
  if (rand < 5) return 'Scheduled'
  if (rand < 7) return 'In Progress'
  if (rand < 8) return 'Document Pending'
  return 'Failed'
}

const generateFlightType = (daysDiff: number, index: number): Flight['flightType'] => {
  // Make roughly 30% of flights international
  const rand = (daysDiff + index) % 10
  return rand < 3 ? 'International' : 'Domestic'
}

// Get flights for a specific date
export const getFlightsForDate = (date: Date): Flight[] => {
  return generateFlightsForDate(date)
}

// Get date carousel data
export const getDateCarouselData = (days: number = 30) => {
  const dates = generateDateRange(days)

  return dates.map(date => {
    const flights = getFlightsForDate(date)
    return {
      date,
      hasFlights: flights.length > 0,
      flightCount: flights.length
    }
  })
}

// Mock boarding passes data
const generateBoardingPass = (passenger: BookingPassenger, flight: Flight): BoardingPass => {
  return {
    id: `BP-${passenger.id}-${flight.id}`,
    passengerId: passenger.id,
    flightId: flight.id,
    passengerName: passenger.name,
    flightNumber: flight.flightNumber,
    route: flight.route,
    date: new Date().toLocaleDateString(),
    departure: flight.departure,
    arrival: flight.arrival,
    seatNumber: passenger.seatNumber || 'TBD',
    gate: flight.gate || 'TBD',
    boardingGroup: passenger.ticketClass === 'First Class' ? 'Group 1' :
                   passenger.ticketClass === 'Business' ? 'Group 2' : 'Group 3',
    ticketClass: passenger.ticketClass,
    barcode: `*${flight.flightNumber}${passenger.seatNumber}*`,
    qrCode: `QR-${flight.id}-${passenger.id}`,
    issuedAt: new Date().toISOString()
  }
}

// Mock booking data generation
const generateBookingPassengers = (pnr: string, flightId: string): BookingPassenger[] => {
  // Family/group names for realistic bookings with relationships
  const familyGroups = [
    { lastName: 'Smith', members: [
      { name: 'John', relation: 'adult', gender: 'Male' },
      { name: 'Sarah', relation: 'adult', gender: 'Female' },
      { name: 'Emma', relation: 'child', gender: 'Female' },
      { name: 'Michael', relation: 'child', gender: 'Male' }
    ]},
    { lastName: 'Johnson', members: [
      { name: 'David', relation: 'adult', gender: 'Male' },
      { name: 'Lisa', relation: 'adult', gender: 'Female' },
      { name: 'James', relation: 'child', gender: 'Male' }
    ]},
    { lastName: 'Brown', members: [
      { name: 'Robert', relation: 'adult', gender: 'Male' },
      { name: 'Jennifer', relation: 'adult', gender: 'Female' },
      { name: 'William', relation: 'child', gender: 'Male' }
    ]},
    { lastName: 'Wilson', members: [
      { name: 'Mary', relation: 'adult', gender: 'Female' },
      { name: 'Thomas', relation: 'adult', gender: 'Male' },
      { name: 'Patricia', relation: 'child', gender: 'Female' },
      { name: 'Christopher', relation: 'child', gender: 'Male' }
    ]},
    { lastName: 'Chen', members: [
      { name: 'Wei', relation: 'adult', gender: 'Male' },
      { name: 'Li', relation: 'adult', gender: 'Female' },
      { name: 'Ming', relation: 'child', gender: 'Male' }
    ]},
    { lastName: 'Garcia', members: [
      { name: 'Carlos', relation: 'adult', gender: 'Male' },
      { name: 'Maria', relation: 'adult', gender: 'Female' },
      { name: 'Sofia', relation: 'child', gender: 'Female' }
    ]},
    { lastName: 'Anderson', members: [
      { name: 'Erik', relation: 'adult', gender: 'Male' },
      { name: 'Anna', relation: 'adult', gender: 'Female' },
      { name: 'Lars', relation: 'child', gender: 'Male' }
    ]},
    { lastName: 'Thompson', members: [
      { name: 'James', relation: 'adult', gender: 'Male' },
      { name: 'Emma', relation: 'adult', gender: 'Female' },
      { name: 'Oliver', relation: 'child', gender: 'Male' }
    ]}
  ]

  const nationalities = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT', 'JP', 'SG']
  const classes: BookingPassenger['ticketClass'][] = ['Economy', 'Business', 'First Class']
  const statuses: BookingPassenger['status'][] = ['Checked In', 'Boarded', 'Pending']

  // Select a random family group
  const familyGroup = familyGroups[Math.floor(Math.random() * familyGroups.length)]
  const passengerCount = Math.min(3 + Math.floor(Math.random() * 2), familyGroup.members.length) // 3-4 passengers
  const selectedMembers = familyGroup.members.slice(0, passengerCount)

  const ticketClass = classes[Math.floor(Math.random() * classes.length)]
  const nationality = nationalities[Math.floor(Math.random() * nationalities.length)]
  const baseStatus = statuses[Math.floor(Math.random() * statuses.length)]

  const passengers: BookingPassenger[] = selectedMembers.map((member, i) => {
    const seatRow = 15 + Math.floor(Math.random() * 20) // Random row between 15-35
    const seatLetter = String.fromCharCode(65 + (i % 6)) // A, B, C, D, E, F

    // More realistic birth years based on relation
    const birthYear = member.relation === 'adult' ?
                     (i === 0 ? 1975 + Math.floor(Math.random() * 20) : 1980 + Math.floor(Math.random() * 15)) :
                     2005 + Math.floor(Math.random() * 15) // Children

    // Generate passport issue and expiry dates
    const issueYear = 2015 + Math.floor(Math.random() * 8)
    const expiryYear = issueYear + 10 // Passports typically valid for 10 years

    const passenger: BookingPassenger = {
      id: `${pnr}-P${i + 1}`,
      name: `${member.name} ${familyGroup.lastName}`,
      email: i === 0 ? `${member.name.toLowerCase()}.${familyGroup.lastName.toLowerCase()}@email.com` : undefined,
      phone: i === 0 ? `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}` : undefined,
      seatNumber: baseStatus !== 'Pending' ? `${seatRow}${seatLetter}` : undefined,
      ticketClass,
      status: baseStatus,
      hasDocuments: Math.random() > 0.05, // 95% have documents
      nationality,
      passportNumber: `${nationality}${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
      passportExpiry: `${expiryYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      passportIssueDate: `${issueYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      passportIssuePlace: nationality === 'US' ? 'New York, NY' :
                         nationality === 'UK' ? 'London, UK' :
                         nationality === 'CA' ? 'Toronto, ON' :
                         nationality === 'AU' ? 'Sydney, NSW' :
                         nationality === 'DE' ? 'Berlin, Germany' :
                         nationality === 'FR' ? 'Paris, France' :
                         nationality === 'ES' ? 'Madrid, Spain' :
                         nationality === 'IT' ? 'Rome, Italy' :
                         nationality === 'JP' ? 'Tokyo, Japan' :
                         'Capital City',
      dateOfBirth: `${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      gender: member.gender as 'Male' | 'Female',
      specialRequests: member.relation === 'child' && Math.random() > 0.5 ? ['Child meal'] :
                      Math.random() > 0.8 ? ['Vegetarian meal'] : undefined,
      isMainPassenger: i === 0
    }

    return passenger
  })

  return passengers
}

// Generate PNR code
const generatePNR = (flightId: string): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  let pnr = ''

  // Generate 6-character PNR (3 letters + 3 numbers)
  for (let i = 0; i < 3; i++) {
    pnr += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  for (let i = 0; i < 3; i++) {
    pnr += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }

  return pnr
}

// Get booking details by flight ID (represents a single booking/ticket)
export const getBookingDetails = (flightId: string): BookingDetails | null => {
  // First, try to find the flight in today's flights
  const today = new Date()
  const todayFlights = getFlightsForDate(today)
  let flight = todayFlights.find(f => f.id === flightId)

  // If not found in today's flights, search in nearby dates
  if (!flight) {
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const flights = getFlightsForDate(date)
      flight = flights.find(f => f.id === flightId)
      if (flight) break
    }
  }

  if (!flight) return null

  // Generate PNR and booking reference
  const pnr = generatePNR(flightId)
  const bookingReference = `BK${pnr}`

  // Generate passengers for this booking (3-4 passengers)
  const passengers = generateBookingPassengers(pnr, flightId)

  // Add boarding passes to passengers who are checked in or boarded
  const passengersWithBoardingPasses = passengers.map(passenger => {
    if (passenger.status === 'Checked In' || passenger.status === 'Boarded') {
      return {
        ...passenger,
        boardingPass: generateBoardingPass(passenger, flight!)
      }
    }
    return passenger
  })

  // Calculate statistics
  const checkedInPassengers = passengers.filter(p => p.status === 'Checked In').length
  const boardedPassengers = passengers.filter(p => p.status === 'Boarded').length
  const pendingPassengers = passengers.filter(p => p.status === 'Pending').length

  // Get main passenger for contact details
  const mainPassenger = passengers.find(p => p.isMainPassenger)

  return {
    pnr,
    bookingReference,
    flight,
    passengers: passengersWithBoardingPasses,
    totalPassengers: passengers.length,
    checkedInPassengers,
    boardedPassengers,
    pendingPassengers,
    bookingDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
    bookingStatus: 'Confirmed',
    totalAmount: passengers.length * (passengers[0].ticketClass === 'First Class' ? 1200 :
                                    passengers[0].ticketClass === 'Business' ? 800 : 400),
    currency: 'USD',
    contactEmail: mainPassenger?.email || 'contact@example.com',
    contactPhone: mainPassenger?.phone || '+1-555-0000'
  }
}

// Get boarding pass by passenger ID and flight ID
export const getBoardingPass = (passengerId: string, flightId: string): BoardingPass | null => {
  const bookingDetails = getBookingDetails(flightId)
  if (!bookingDetails) return null

  const passenger = bookingDetails.passengers.find(p => p.id === passengerId)
  return passenger?.boardingPass || null
}

// Compatibility function for existing code
export const getTripDetails = (flightId: string) => getBookingDetails(flightId)
