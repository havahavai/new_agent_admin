// API Response Types

// API 1: User Specific Info Response
export interface FlightData {
  flightId: string;
  ticketId: string;
  flightNumber: string;
  checkInStatus: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  ticketSource: string;
  belongsTo: string;
  numberOfPassengers: string;
  isInternational: boolean;
}

export interface UserSpecificInfoResponse {
  success: boolean;
  data: {
    flightsData: FlightData[];
  };
}

// API 2: Flight Data by IDs Response
export interface FlightDeparture {
  airportIata: string;
  city: string;
  time: string;
}

export interface FlightArrival {
  airportIata: string;
  city: string;
  time: string;
}

export interface PassengerDocument {
  type: string;
  number: string;
  expiry: string;
  issueDate: string;
  issueCountry: string;
}

export interface FlightPassenger {
  passengerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  email: string;
  mobileNumber: string;
  seatNumber: string;
  meal: string;
  boardingPassUrl: string;
  documents: PassengerDocument[];
}

export interface FlightDataByIdsResponse {
  success: boolean;
  data: {
    flightNumber: string;
    pnr: string;
    flightClass: string;
    bookingReference: string;
    checkInStatus: string;
    isInternational: boolean;
    aircraftType: string;
    delay: string;
    boardingGate: string;
    Terminal: string;
    departure: FlightDeparture;
    arrival: FlightArrival;
    passengers: FlightPassenger[];
  };
}

// API 3: B2B User Response
export interface B2BUserResponse {
  success: boolean;
  message: string;
  data: {
    currentBalance: string;
    companyName: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    emails: string[];
  };
}

// API 4: Passenger Details Response
export interface PassengerDocument4 {
  documentId: number;
  documentType: string;
  gender: string;
  dateOfBirth: string;
  documentNumber: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  nationality: string;
  placeOfIssue: string;
  countryOfResidence: string;
  documentUrl?: string;
}

export interface PassengerDetail {
  passengerFlightId: number;
  passengerId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  countryOfResidence: string;
  email?: string; // Optional field that might not be in API response
  mobileNumber?: string; // Optional field that might not be in API response
  passengerDocuments: PassengerDocument4[];
  numberOfFlights: number;
  mainPassenger: boolean;
}

export interface PassengerDetailsResponse {
  data: PassengerDetail[];
}

// Common API Error Response
export interface ApiError {
  success: false;
  message: string;
  error?: any;
}

// Utility function to get user ID from localStorage or default
export const getJwtToken = (): string => {
  const jwtToken = localStorage.getItem("jwtToken");
  return jwtToken || ""; // Default fallback as specified
};

// Upload Document Response
export interface PassportExtractionData {
  is_passport: boolean;
  passport_number: string | null;
  date_of_expiry: string | null;
  nationality: string | null;
  issue_date: string | null;
  issue_place: string | null;
}

export interface PassportExtraction {
  success: boolean;
  message: string;
  data: PassportExtractionData;
}

export interface UploadDocumentData {
  url: string;
  type: string;
  originalName: string;
  size: number;
  passportExtraction: PassportExtraction;
}

export interface UploadDocumentResponse {
  success: boolean;
  message: string;
  data?: UploadDocumentData;
}

// Base API URL
export const BASE_API_URL = "https://prod-api.flyo.ai/core/v1";

// Update Passenger API Types
export interface UpdatePassengerRequest {
  type: "INDIVIDUAL_PASSENGER";
  operationType: "UPDATE";
  body: {
    passengerId: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
    countryOfResidence?: string;
  };
}

export interface UpdatePassengerResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Add Passport API Types
export interface AddPassportRequest {
  type: "PASSENGERDOCUMENT";
  operationType: "ADD";
  body: {
    passengerId: number;
    documentType: "passport";
    documentNumber: string;
    dateOfIssue: string;
    dateOfExpiry: string;
    placeOfIssue: string;
  };
}

export interface AddPassportResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Update Passport API Types
export interface UpdatePassportRequest {
  type: "PASSENGERDOCUMENT";
  operationType: "UPDATE";
  body: {
    documentId: number;
    documentType: "passport";
    documentNumber: string;
    dateOfIssue: string;
    dateOfExpiry: string;
    placeOfIssue: string;
  };
}

export interface UpdatePassportResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Update Ticket API Types
export interface UpdateTicketRequest {
  type: "TICKET";
  body: {
    ticketId: number;
    pnr?: string;
    bookingReference?: string;
  };
}

export interface UpdateTicketResponse {
  success: boolean;
  message: string;
  data?: any;
}
