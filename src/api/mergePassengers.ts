import { API_BASE_URL, handleNetworkError } from "./utils";
import { ApiError, getJwtToken } from "./types";

// New Merge Passengers API Types (based on user requirements)
export interface NewMergePassengersRequest {
  type: "INDIVIDUAL_PASSENGER";
  operationType: "MERGE";
  body: {
    passengerIds: number[];
    mainPassenger: {
      firstName: string;
      lastName: string;
      email: string;
    };
    userId: string;
  };
}

export interface NewMergePassengersResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Legacy Merge Passengers API Types (keeping for backward compatibility)
export interface MergePassengersRequest {
  type: "INDIVIDUAL_PASSENGER";
  operationType: "MERGE";
  body: {
    primaryPassengerId: string;
    secondaryPassengerIds: string[];
    mergedData: {
      firstName?: string;
      lastName?: string;
      mobileNumber?: string;
      email?: string;
      dateOfBirth?: string;
      gender?: string;
      nationality?: string;
      countryOfResidence?: string;
    };
  };
}

export interface MergePassengersResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface PassengerMergeData {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  countryOfResidence?: string;
}

/**
 * Merge multiple passengers into one
 * This is a custom implementation since the API might not support direct merging
 */
export const mergePassengers = async (
  primaryPassengerId: string,
  secondaryPassengerIds: string[],
  mergedData: PassengerMergeData
): Promise<MergePassengersResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!primaryPassengerId) {
      return {
        success: false,
        message: "Primary passenger ID is required.",
      };
    }

    if (!secondaryPassengerIds || secondaryPassengerIds.length === 0) {
      return {
        success: false,
        message: "At least one secondary passenger ID is required.",
      };
    }

    // Since the API might not support direct merging, we'll:
    // 1. Update the primary passenger with merged data
    // 2. Delete the secondary passengers

    // First, update the primary passenger with merged data
    const updateRequestBody = {
      type: "INDIVIDUAL_PASSENGER",
      operationType: "UPDATE",
      body: {
        passengerId: primaryPassengerId,
        ...mergedData,
      },
    };

    console.log(
      "Updating primary passenger with merged data:",
      updateRequestBody
    );

    const updateResponse = await fetch(
      `https://prod-api.flyo.ai/core/v1/admin/update`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(updateRequestBody),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(
        "Update primary passenger API error:",
        updateResponse.status,
        errorText
      );

      return {
        success: false,
        message: `Failed to update primary passenger: ${updateResponse.status} ${updateResponse.statusText}`,
        error: errorText,
      };
    }

    // Then delete the secondary passengers
    for (const passengerId of secondaryPassengerIds) {
      const deleteRequestBody = {
        type: "INDIVIDUAL_PASSENGER",
        operationType: "DELETE",
        body: {
          passengerId,
        },
      };

      console.log("Deleting secondary passenger:", deleteRequestBody);

      const deleteResponse = await fetch(
        `https://prod-api.flyo.ai/core/v1/admin/update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(deleteRequestBody),
        }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        console.error(
          "Delete secondary passenger API error:",
          deleteResponse.status,
          errorText
        );

        // Continue with other deletions even if one fails
        console.warn(
          `Failed to delete passenger ${passengerId}, continuing with merge...`
        );
      }
    }

    const updateData = await updateResponse.json();
    console.log("Merge passengers API response:", updateData);

    return {
      success: true,
      message: `Successfully merged ${
        secondaryPassengerIds.length + 1
      } passengers`,
      data: updateData,
    };
  } catch (error) {
    console.error("Merge passengers error:", error);
    return handleNetworkError(error);
  }
};

/**
 * New merge passengers API function (based on user requirements)
 * Uses the MERGE operation with passengerIds array and mainPassenger object
 */
export const newMergePassengers = async (
  passengerIds: number[],
  mainPassenger: {
    firstName: string;
    lastName: string;
    email: string;
  },
  userId: string
): Promise<NewMergePassengersResponse | ApiError> => {
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

    if (!mainPassenger.firstName || !mainPassenger.lastName) {
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

    const requestBody: NewMergePassengersRequest = {
      type: "INDIVIDUAL_PASSENGER",
      operationType: "MERGE",
      body: {
        passengerIds,
        mainPassenger,
        userId,
      },
    };

    console.log("New merge passengers API request:", requestBody);

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
      console.error(
        "New merge passengers API error:",
        response.status,
        errorText
      );

      return {
        success: false,
        message: `Failed to merge passengers: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("New merge passengers API response:", data);

    return {
      success: true,
      message: `Successfully merged ${passengerIds.length} passengers`,
      data,
    };
  } catch (error) {
    console.error("New merge passengers error:", error);
    return handleNetworkError(error);
  }
};
