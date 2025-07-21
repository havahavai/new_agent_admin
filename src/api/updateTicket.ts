import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  UpdateTicketRequest,
  UpdateTicketResponse,
  ApiError,
  getJwtToken,
} from "./types";

/**
 * Update ticket details (PNR and booking reference)
 */
export const updateTicket = async (
  ticketId: number,
  pnr?: string,
  bookingReference?: string
): Promise<UpdateTicketResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!ticketId) {
      return {
        success: false,
        message: "Ticket ID is required.",
      };
    }

    // Build request body with only provided fields
    const body: any = { ticketId };

    if (pnr !== undefined && pnr.trim()) {
      body.pnr = pnr.trim();
    }
    if (bookingReference !== undefined && bookingReference.trim()) {
      body.bookingReference = bookingReference.trim();
    }

    // If no fields to update, return error
    if (Object.keys(body).length === 1) {
      return {
        success: false,
        message: "At least one field (PNR or booking reference) must be provided for update.",
      };
    }

    const requestBody: UpdateTicketRequest = {
      type: "TICKET",
      body,
    };

    console.log("Updating ticket with data:", requestBody);

    const response = await fetch(
      `https://prod-api.flyo.ai/core/v1/admin/update`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update ticket API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to update ticket: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Update ticket API response:", data);

    return {
      success: true,
      message: "Ticket details updated successfully",
      data,
    };
  } catch (error) {
    console.error("Update ticket error:", error);
    return handleNetworkError(error);
  }
};
