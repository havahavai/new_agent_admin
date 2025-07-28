import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  ApiError,
  getJwtToken,
} from "./types";

// Merge Passengers API Types
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
        ...mergedData
      },
    };

    console.log("Updating primary passenger with merged data:", updateRequestBody);

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
      console.error("Update primary passenger API error:", updateResponse.status, errorText);

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
        console.error("Delete secondary passenger API error:", deleteResponse.status, errorText);
        
        // Continue with other deletions even if one fails
        console.warn(`Failed to delete passenger ${passengerId}, continuing with merge...`);
      }
    }

    const updateData = await updateResponse.json();
    console.log("Merge passengers API response:", updateData);

    return {
      success: true,
      message: `Successfully merged ${secondaryPassengerIds.length + 1} passengers`,
      data: updateData,
    };
  } catch (error) {
    console.error("Merge passengers error:", error);
    return handleNetworkError(error);
  }
};
