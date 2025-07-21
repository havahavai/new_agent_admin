import { B2BUserResponse, ApiError, getJwtToken, BASE_API_URL } from "./types";
import { handleNetworkError } from "./utils";
import { GetUserId } from "./utils";

/**
 * API 3: Get B2B User Info
 * Fetches B2B user account information
 */
export const getB2BUserInfo = async (
  signal?: AbortSignal
): Promise<B2BUserResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();
    const userId = GetUserId(jwtToken);
    const url = `${BASE_API_URL}/admin/b2bUsers/user?userId=${userId}`;

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

    const data: B2BUserResponse = await response.json();

    // Validate response structure
    if (!data.success || !data.data) {
      throw new Error("Invalid response format from server");
    }

    return data;
  } catch (error) {
    console.error("Error fetching B2B user info:", error);
    return handleNetworkError(error);
  }
};
