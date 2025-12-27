import { UserSpecificInfoResponse, ApiError, BASE_API_URL } from "./types";
import { handleNetworkError } from "./utils";
import { getJwtToken } from "./auth";
import { GetUserId } from "./utils";

/**
 * API 1: Get User Specific Info
 * Fetches flight data for a specific user
 */
export const getUserSpecificInfo = async (
  signal?: AbortSignal
): Promise<UserSpecificInfoResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();
    const userId = GetUserId(jwtToken);
    const url = `${BASE_API_URL}/admin/getUserSpecificInfo?userId=${userId}&type=flightData&timeframe=upcoming`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        authorization: `Bearer ${jwtToken}`,
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

    // Validate sortedData if present
    if (data.data.sortedData && typeof data.data.sortedData !== 'object') {
      throw new Error("Invalid sortedData format from server");
    }

    return data;
  } catch (error) {
    console.error("Error fetching user specific info:", error);
    return handleNetworkError(error);
  }
};
