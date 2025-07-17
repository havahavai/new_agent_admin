import {
  FlightDataByIdsResponse,
  ApiError,
  getUserId,
  JWT_TOKEN_ADMIN,
  BASE_API_URL,
} from "./types";
import { handleNetworkError } from "./utils";

/**
 * API 2: Get Flight Data by IDs
 * Fetches detailed flight data by flight ID and ticket ID
 */
export const getFlightDataByIds = async (
  flightId: string,
  ticketId: string,
  signal?: AbortSignal
): Promise<FlightDataByIdsResponse | ApiError> => {
  try {
    const userId = getUserId();
    const url = `${BASE_API_URL}/admin/getFlightDataByIds?userId=${userId}&flightId=${flightId}&ticketId=${ticketId}`;

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

    const data: FlightDataByIdsResponse = await response.json();

    // Validate response structure
    if (!data.success || !data.data) {
      throw new Error("Invalid response format from server");
    }

    return data;
  } catch (error) {
    console.error("Error fetching flight data by IDs:", error);
    return handleNetworkError(error);
  }
};
