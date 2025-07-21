import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  UpdatePassengerRequest,
  UpdatePassengerResponse,
  ApiError,
  getJwtToken,
} from "./types";

/**
 * Update passenger details - allows partial updates
 */
export const updatePassenger = async (
  passengerId: string,
  firstName?: string,
  lastName?: string,
  mobileNumber?: string,
  email?: string,
  dateOfBirth?: string,
  gender?: string,
  nationality?: string,
  countryOfResidence?: string
): Promise<UpdatePassengerResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields - only passengerId is required for updates
    if (!passengerId) {
      return {
        success: false,
        message: "Passenger ID is required.",
      };
    }

    // Build request body with only provided fields
    const body: any = { passengerId };

    if (firstName !== undefined && firstName.trim())
      body.firstName = firstName.trim();
    if (lastName !== undefined && lastName.trim())
      body.lastName = lastName.trim();
    if (mobileNumber !== undefined) body.mobileNumber = mobileNumber;
    if (email !== undefined) body.email = email;
    if (dateOfBirth !== undefined) body.dateOfBirth = dateOfBirth;
    if (gender !== undefined) body.gender = gender;
    if (nationality !== undefined) body.nationality = nationality;
    if (countryOfResidence !== undefined)
      body.countryOfResidence = countryOfResidence;

    const requestBody: UpdatePassengerRequest = {
      type: "INDIVIDUAL_PASSENGER",
      operationType: "UPDATE",
      body,
    };

    console.log("Updating passenger with data:", requestBody);

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
      console.error("Update passenger API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to update passenger: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Update passenger API response:", data);

    return {
      success: true,
      message: "Passenger details updated successfully",
      data,
    };
  } catch (error) {
    console.error("Update passenger error:", error);
    return handleNetworkError(error);
  }
};
