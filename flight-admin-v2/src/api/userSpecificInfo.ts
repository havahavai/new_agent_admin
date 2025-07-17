import {
  UserSpecificInfoResponse,
  ApiError,
  getUserId,
  JWT_TOKEN_ADMIN,
  BASE_API_URL,
} from "./types";
import { handleNetworkError } from "./utils";

/**
 * API 1: Get User Specific Info
 * Fetches flight data for a specific user
 */
export const getUserSpecificInfo = async (
  signal?: AbortSignal
): Promise<UserSpecificInfoResponse | ApiError> => {
  try {
    const userId = getUserId();
    const url = `${BASE_API_URL}/admin/getUserSpecificInfo?userId=${userId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${JWT_TOKEN_ADMIN}`,
        "Content-Type": "application/json",
      },
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data: UserSpecificInfoResponse = await response.json();

    // Validate response structure
    if (!data.success || !data.data || !Array.isArray(data.data.flightsData)) {
      throw new Error("Invalid response format from server");
    }

    return data;
  } catch (error) {
    console.error("Error fetching user specific info:", error);
    return handleNetworkError(error);
  }
};
