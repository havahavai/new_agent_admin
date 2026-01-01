import { API_BASE_URL, handleNetworkError } from "./utils";
import { ApiError, getJwtToken } from "./types";

export interface UpdateTravellerRequest {
  travellerId: number;
  updates: {
    passportNumber?: string;
    nationality?: string;
    countryCode?: string;
    phone?: string;
    baggage?: {
      cabin?: string;
      checkin?: string;
      additional?: string;
    };
    seat?: string;
    meal?: string;
    gender?: string;
  };
}

export interface UpdateTravellerResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Update traveller details
 * Endpoint: POST https://prod-api.flyo.ai/core/v1/businessFlyo/update
 */
export const updateTraveller = async (
  request: UpdateTravellerRequest
): Promise<UpdateTravellerResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    if (!request.travellerId) {
      return {
        success: false,
        message: "Traveller ID is required.",
      };
    }

    const requestBody = {
      type: "traveller",
      operation: "update",
      payload: {
        travellerId: request.travellerId,
        updates: request.updates,
      },
    };

    console.log("Updating traveller with data:", requestBody);

    const response = await fetch(
      `${API_BASE_URL}/core/v1/businessFlyo/update`,
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
      console.error("Update traveller API error:", response.status, errorText);

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message:
          errorData.message ||
          `Failed to update traveller: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data: UpdateTravellerResponse = await response.json();
    console.log("Update traveller API response:", data);

    return data;
  } catch (error) {
    console.error("Update traveller error:", error);
    return handleNetworkError(error);
  }
};

