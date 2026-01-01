import { API_BASE_URL, handleNetworkError } from "./utils";
import { ApiError, getJwtToken } from "./types";

// Trip Details Response Types
export interface TripDetailsData {
  id: number;
  bookingId: string | null;
  pnr: string;
  bookingReference: string | null;
  bookingStatus: string;
  bookingDate: string;
  isRefundable: boolean | null;
  departure: {
    iata: string;
    city: string;
    country: string;
    date: string;
  };
  arrival: {
    iata: string;
    city: string;
    country: string;
    date: string;
  };
  source: Array<{
    name: string;
    sourceId: string;
  }>;
  attachments: Array<{
    name: string;
    url: string;
  }>;
  flights: Array<{
    flightId: number;
    flightNumber: string;
    airlineIata: string;
    departure: {
      iata: string;
      city: string;
      country: string;
      date: string;
    };
    arrival: {
      iata: string;
      city: string;
      country: string;
      date: string;
    };
  }>;
  travellers: Array<{
    travellerId: number;
    firstname: string;
    lastname: string;
    countryCode: string | null;
    phone: string | null;
    dateOfBirth: string;
    passport: string;
    nationality: string | null;
    gender: string;
    seat: string;
    meal: string;
    baggage: {
      cabin: string | null;
      checkin: string | null;
      additional: string | null;
    };
  }>;
  clients: Array<{
    clientId: number;
    name: string;
    email: string;
    type: string;
    phone: string;
    countryCode: string | null;
    companyName: string | null;
    lastBookingDate: string | null;
  }>;
}

export interface GetTripDetailsResponse {
  success: boolean;
  data: TripDetailsData;
  message?: string;
}

/**
 * Get trip details by ticket ID
 * @param ticketId - The ticket ID
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise with trip details or error
 */
export const getTripDetails = async (
  ticketId: string,
  signal?: AbortSignal
): Promise<GetTripDetailsResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    if (!ticketId) {
      return {
        success: false,
        message: "Ticket ID is required.",
      };
    }

    const url = `${API_BASE_URL}/core/v1/businessFlyo/tickets/${ticketId}`;

    console.log("Fetching trip details:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Get trip details API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to fetch trip details: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data: GetTripDetailsResponse = await response.json();
    console.log("Get trip details API response:", data);

    if (!data.success || !data.data) {
      return {
        success: false,
        message: "Invalid response format from server",
      };
    }

    return data;
  } catch (error) {
    console.error("Get trip details error:", error);
    return handleNetworkError(error);
  }
};

