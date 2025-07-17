import {
  PassengerDetailsResponse,
  ApiError,
  JWT_TOKEN_PASSENGER,
  BASE_API_URL,
} from "./types";
import { handleNetworkError } from "./utils";

/**
 * API 4: Get Users Passenger Details
 * Fetches passenger details for the user
 */
export const getUsersPassengerDetails = async (
  signal?: AbortSignal
): Promise<PassengerDetailsResponse | ApiError> => {
  try {
    const url = `${BASE_API_URL}/passenger/getUsersPassengerDetails`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${JWT_TOKEN_PASSENGER}`,
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

    const data: PassengerDetailsResponse = await response.json();

    // Validate response structure
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid response format from server");
    }

    return data;
  } catch (error) {
    console.error("Error fetching passenger details:", error);
    return handleNetworkError(error);
  }
};
