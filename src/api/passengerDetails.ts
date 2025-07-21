import {
  PassengerDetailsResponse,
  ApiError,
  BASE_API_URL,
  PassengerDetail,
} from "./types";
import { handleNetworkError } from "./utils";

import { getJwtToken } from "./auth";

/**
 * API 4: Get Users Passenger Details
 * Fetches passenger details for the user
 */
export const getUsersPassengerDetails = async (
  signal?: AbortSignal
): Promise<PassengerDetailsResponse | ApiError> => {
  try {
    const url = `${BASE_API_URL}/passenger/getUsersPassengerDetails?type=documentNotRequired`;
    const jwtToken = getJwtToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
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

/**
 * API: Get Passenger Detail By ID
 * Fetches specific passenger details by passenger ID
 */
export const getPassengerDetailById = async (
  passengerId: string,
  signal?: AbortSignal
): Promise<{ data: PassengerDetail } | ApiError> => {
  try {
    const url = `${BASE_API_URL}/admin/getPassengerDetailById?passengerId=${passengerId}`;
    const jwtToken = getJwtToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
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

    const data = await response.json();

    // Validate response structure
    if (!data.data) {
      throw new Error("Invalid response format from server");
    }

    return data;
  } catch (error) {
    console.error("Error fetching passenger detail by ID:", error);
    return handleNetworkError(error);
  }
};
