import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  ApiError,
  getJwtToken,
} from "./types";

// Add Passenger API Types
export interface AddPassengerRequest {
  type: "INDIVIDUAL_PASSENGER";
  operationType: "ADD";
  body: {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
  };
}

export interface AddPassengerResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Add a new passenger
 * Uses the ADD operation with firstName, lastName, email, and userId
 */
export const addPassenger = async (
  firstName: string,
  lastName: string,
  email: string,
  userId: string
): Promise<AddPassengerResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return {
        success: false,
        message: "First name and last name are required.",
      };
    }

    if (!userId) {
      return {
        success: false,
        message: "User ID is required.",
      };
    }

    const requestBody: AddPassengerRequest = {
      type: "INDIVIDUAL_PASSENGER",
      operationType: "ADD",
      body: {
        firstName,
        lastName,
        email,
        userId,
      },
    };

    console.log("Add passenger API request:", requestBody);

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
      console.error("Add passenger API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to add passenger: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Add passenger API response:", data);

    return {
      success: true,
      message: "Passenger added successfully",
      data,
    };
  } catch (error) {
    console.error("Add passenger error:", error);
    return handleNetworkError(error);
  }
};
