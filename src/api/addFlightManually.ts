import { handleNetworkError } from "./utils";
import { getJwtToken, ApiError, BASE_API_URL } from "./types";
import { GetUserId } from "./utils";

export interface AddFlightManuallyRequest {
  airline: string;
  flightNumber: string;
  departureDate: string; // ISO date string
}

export interface AddFlightManuallyResponse {
  success: boolean;
  message: string;
  data?: {
    flightId?: string;
    ticketId?: string;
  };
}

/**
 * Add a flight manually by providing airline, flight number, and departure date
 */
export const addFlightManually = async (
  airline: string,
  flightNumber: string,
  departureDate: Date
): Promise<AddFlightManuallyResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!airline || !flightNumber || !departureDate) {
      return {
        success: false,
        message: "Airline, flight number, and departure date are required.",
      };
    }

    const userId = GetUserId(jwtToken);

    // Format the departure date to ISO string
    const departureDateISO = departureDate.toISOString();

    // Construct the full flight number (airline code + number)
    const fullFlightNumber = flightNumber.toUpperCase().startsWith(airline.toUpperCase())
      ? flightNumber.toUpperCase()
      : `${airline.toUpperCase()}${flightNumber}`;

    const requestBody = {
      userId,
      airline: airline.toUpperCase(),
      flightNumber: fullFlightNumber,
      departureDate: departureDateISO,
    };

    console.log("Adding flight manually with data:", requestBody);

    const response = await fetch(
      `${BASE_API_URL}/admin/addFlight`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Add flight manually API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to add flight: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Add flight manually API response:", data);

    return {
      success: true,
      message: "Flight added successfully",
      data,
    };
  } catch (error) {
    console.error("Add flight manually error:", error);
    return handleNetworkError(error);
  }
};

