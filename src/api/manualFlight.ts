import { handleNetworkError } from "./utils";
import { getJwtToken, ApiError, BASE_API_URL } from "./types";

// Step 1: Search Manual Flight Request/Response
export interface SearchManualFlightRequest {
  departureDate: string; // Format: YYYY-MM-DD
  flightNumber: string; // e.g., "6E2716"
}

export interface FlightOption {
  flight_number: string;
  airline_logo: string;
  dep_airport: string;
  arr_airport: string;
  departure_date_time: string; // ISO format
  departure_timezone: string;
  arrival_date_time: string; // ISO format
  arrival_timezone: string;
  departure_city: string;
  arrival_city: string;
  departure_flag: string;
  arrival_flag: string;
  departure_time: string; // HH:MM format
  arrival_time: string; // HH:MM format
  duration: string;
  departure_date: string; // Formatted date
  stop_airport_code: string;
  passengers: any[];
}

export interface SearchManualFlightResponse {
  success: boolean;
  message?: string;
  data?: FlightOption[];
}

// Step 2: Confirm Manual Flight Request/Response
export interface ConfirmManualFlightRequest {
  dep_airport: string;
  arr_airport: string;
  email: string;
  belongs_to: string; // "user" or "agent"
  first_name: string;
  arrival_date_time: string; // ISO format
  arrival_timezone: string;
  last_name: string;
  data: FlightOption[];
}

export interface ConfirmManualFlightResponse {
  success: boolean;
  message: string;
  data?: {
    flightId?: string;
    ticketId?: string;
  };
}

/**
 * Step 1: Search for manual flight options
 * Calls POST /flight/manualFlight
 */
export const searchManualFlight = async (
  flightNumber: string,
  departureDate: Date
): Promise<SearchManualFlightResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!flightNumber || !departureDate) {
      return {
        success: false,
        message: "Flight number and departure date are required.",
      };
    }

    // Format date to YYYY-MM-DD
    const year = departureDate.getFullYear();
    const month = String(departureDate.getMonth() + 1).padStart(2, '0');
    const day = String(departureDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    const requestBody: SearchManualFlightRequest = {
      departureDate: formattedDate,
      flightNumber: flightNumber.toUpperCase(),
    };

    console.log("Searching manual flight with data:", requestBody);

    const response = await fetch(
      `${BASE_API_URL}/flight/manualFlight`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Search manual flight API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to search flight: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Search manual flight API response:", data);

    // Handle different response formats
    if (data.success === false) {
      return {
        success: false,
        message: data.message || "No flights found",
      };
    }

    return {
      success: true,
      data: data.data || data, // Handle both {data: [...]} and direct array
    };
  } catch (error) {
    console.error("Search manual flight error:", error);
    return handleNetworkError(error);
  }
};

/**
 * Step 2: Confirm manual flight selection
 * Calls POST /flight/confirmManualFlight
 */
export const confirmManualFlight = async (
  selectedFlight: FlightOption,
  userEmail: string,
  userFirstName: string,
  userLastName: string
): Promise<ConfirmManualFlightResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!selectedFlight || !userEmail) {
      return {
        success: false,
        message: "Flight selection and user email are required.",
      };
    }

    const requestBody: ConfirmManualFlightRequest = {
      dep_airport: selectedFlight.dep_airport,
      arr_airport: selectedFlight.arr_airport,
      email: userEmail,
      belongs_to: "user",
      first_name: userFirstName || "",
      arrival_date_time: selectedFlight.arrival_date_time,
      arrival_timezone: selectedFlight.arrival_timezone,
      last_name: userLastName || "",
      data: [selectedFlight],
    };

    console.log("Confirming manual flight with data:", requestBody);

    const response = await fetch(
      `${BASE_API_URL}/flight/confirmManualFlight`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Confirm manual flight API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to confirm flight: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Confirm manual flight API response:", data);

    return {
      success: true,
      message: data.message || "Flight confirmed successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Confirm manual flight error:", error);
    return handleNetworkError(error);
  }
};

