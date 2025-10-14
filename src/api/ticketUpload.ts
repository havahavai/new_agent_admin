import { handleNetworkError } from "./utils";
import { getJwtToken, ApiError, BASE_API_URL } from "./types";

// Passenger information in a flight
export interface PassengerInfo {
  first_name: string;
  last_name: string;
  seat_info?: string;
  meal_info?: string;
  baggage_info?: {
    cabin?: string;
    check_in?: string;
  };
}

// Individual flight segment
export interface FlightSegment {
  arr_city: string;
  dep_city: string;
  arr_country_flag?: string;
  dep_country_flag?: string;
  airline?: string; // URL to airline logo
  flight_number: string;
  departure_date_time: string; // Format: "2025-02-20 06:55:00"
  arrival_date_time: string; // Format: "2025-02-20 11:25:00"
  dep_airport: string;
  arr_airport: string;
  passengers: PassengerInfo[];
}

// Ticket information (can be onward, return, etc.)
export interface TicketInfo {
  type: string; // "onward", "return", etc.
  pnr: string;
  fare: string; // "STANDARD", "FLEXI", etc.
  class: string; // "ECONOMY", "BUSINESS", etc.
  flights: FlightSegment[];
  ticket_source: string; // "PDF", "IMAGE", etc.
}

// Response from uploadTicketByDocument API
export interface UploadTicketByDocumentResponse {
  success: boolean;
  message?: string;
  data?: {
    ticket: TicketInfo[];
  };
}

// Request body for confirmParsing API
export interface ConfirmParsingRequest {
  ticket: TicketInfo[];
  email: string;
}

// Response from confirmParsing API
export interface ConfirmParsingResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Step 1: Upload ticket document and parse it
 * Endpoint: POST /v2/ticket/uploadTicketByDocument
 */
export const uploadTicketByDocument = async (
  file: File
): Promise<UploadTicketByDocumentResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    if (!file) {
      return {
        success: false,
        message: "No file selected for upload.",
      };
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: "Invalid file type. Only PDF, JPG, and PNG files are allowed.",
      };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        message: "File size must be less than 10MB.",
      };
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("file", file);

    // Note: This endpoint is v2, not v1
    const apiUrl = BASE_API_URL.replace('/v1', '/v2');
    const fullUrl = `${apiUrl}/ticket/uploadTicketByDocument`;

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorText = await response.text();

      // Try to parse error as JSON
      let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        // Not JSON, use the text as is
        if (errorText) {
          errorMessage = errorText;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: errorText,
      };
    }

    const data = await response.json();

    // Handle different response formats
    // The API might return the data directly or wrapped in a success object
    if (data && typeof data === 'object') {
      // If data has a success field, return as is
      if ('success' in data) {
        return data;
      }

      // If data is an array, wrap it in the expected format
      if (Array.isArray(data)) {
        return {
          success: true,
          message: 'Ticket parsed successfully',
          data: {
            ticket: data
          }
        };
      }

      // If data has a ticket field directly, wrap it
      if ('ticket' in data) {
        return {
          success: true,
          message: 'Ticket parsed successfully',
          data: data
        };
      }

      // If data has a data field, check if it contains ticket
      if ('data' in data && data.data) {
        if ('ticket' in data.data || Array.isArray(data.data)) {
          return {
            success: true,
            message: 'Ticket parsed successfully',
            data: data.data
          };
        }
      }

      // Otherwise, assume it's a single ticket object
      return {
        success: true,
        message: 'Ticket parsed successfully',
        data: {
          ticket: [data]
        }
      };
    }

    return data;
  } catch (error) {
    console.error("Upload ticket document error:", error);
    return handleNetworkError(error);
  }
};

/**
 * Step 2: Confirm the parsed ticket data
 * Endpoint: POST /v1/ticket/confirmParsing
 */
export const confirmTicketParsing = async (
  ticketData: TicketInfo[],
  userEmail: string
): Promise<ConfirmParsingResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    if (!ticketData || ticketData.length === 0) {
      return {
        success: false,
        message: "No ticket data to confirm.",
      };
    }

    if (!userEmail) {
      return {
        success: false,
        message: "User email is required.",
      };
    }

    const requestBody: ConfirmParsingRequest = {
      ticket: ticketData,
      email: userEmail,
    };

    // Note: This endpoint is v1 (different from upload which is v2)
    const response = await fetch(
      `${BASE_API_URL}/ticket/confirmParsing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return {
        success: false,
        message: `Confirmation failed: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();

    return data;
  } catch (error) {
    return handleNetworkError(error);
  }
};

