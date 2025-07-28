import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  ApiError,
  getJwtToken,
} from "./types";

// Delete Passenger API Types
export interface DeletePassengerRequest {
  type: "INDIVIDUAL_PASSENGER";
  operationType: "DELETE";
  body: {
    passengerId: string;
  };
}

export interface DeletePassengerResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Delete a passenger
 */
export const deletePassenger = async (
  passengerId: string
): Promise<DeletePassengerResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!passengerId) {
      return {
        success: false,
        message: "Passenger ID is required.",
      };
    }

    const requestBody: DeletePassengerRequest = {
      type: "INDIVIDUAL_PASSENGER",
      operationType: "DELETE",
      body: {
        passengerId,
      },
    };

    console.log("Deleting passenger with data:", requestBody);

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
      console.error("Delete passenger API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to delete passenger: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Delete passenger API response:", data);

    return {
      success: true,
      message: "Passenger deleted successfully",
      data,
    };
  } catch (error) {
    console.error("Delete passenger error:", error);
    return handleNetworkError(error);
  }
};

/**
 * Delete multiple passengers
 */
export const deleteMultiplePassengers = async (
  passengerIds: string[]
): Promise<DeletePassengerResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!passengerIds || passengerIds.length === 0) {
      return {
        success: false,
        message: "At least one passenger ID is required.",
      };
    }

    // Delete passengers one by one (API might not support bulk delete)
    const results = [];
    for (const passengerId of passengerIds) {
      const result = await deletePassenger(passengerId);
      results.push(result);
      
      // If any deletion fails, return the error
      if (!('success' in result) || !result.success) {
        return result;
      }
    }

    return {
      success: true,
      message: `Successfully deleted ${passengerIds.length} passenger(s)`,
      data: results,
    };
  } catch (error) {
    console.error("Delete multiple passengers error:", error);
    return handleNetworkError(error);
  }
};
