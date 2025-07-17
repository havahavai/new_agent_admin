import { ApiError } from "./types";

/**
 * API Base URL from environment variables
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://prod-api.flyo.ai";

/**
 * Utility function to handle API calls with retry logic
 */
export const withRetry = async <T>(
  apiCall: () => Promise<T | ApiError>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T | ApiError> => {
  let lastError: ApiError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();

      // If it's a successful response, return it
      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        result.success
      ) {
        return result;
      }

      // If it's an API error but not a network error, don't retry
      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        !result.success
      ) {
        return result;
      }

      return result;
    } catch (error) {
      lastError = {
        success: false,
        message: `Attempt ${attempt} failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error,
      };

      // If this is the last attempt, don't wait
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  return lastError!;
};

/**
 * Utility function to check if response is an error
 */
export const isApiError = (response: any): response is ApiError => {
  return response && "success" in response && response.success === false;
};

/**
 * Utility function to get error message from API response
 */
export const getErrorMessage = (response: any): string => {
  if (isApiError(response)) {
    return response.message;
  }
  return "An unexpected error occurred";
};

/**
 * Utility function to handle network errors
 */
export const handleNetworkError = (error: any): ApiError => {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      success: false,
      message: "Network error: Please check your internet connection",
      error,
    };
  }

  if (error.name === "AbortError") {
    return {
      success: false,
      message: "Request was cancelled",
      error,
    };
  }

  return {
    success: false,
    message: error instanceof Error ? error.message : "Unknown error occurred",
    error,
  };
};

/**
 * Decode JWT token payload without verification (client-side safe)
 * Note: This only decodes the payload, it doesn't verify the signature
 */
export const decodeJwtPayload = (token: string): any => {
  try {
    // Split the token into parts
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT token format");
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    // Decode base64url to string
    const decodedPayload = atob(
      paddedPayload.replace(/-/g, "+").replace(/_/g, "/")
    );

    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (err) {
    console.error("Error decoding JWT payload:", err);
    return null;
  }
};

/**
 * Get user ID from JWT token
 */
export const GetUserId = (jwtToken: string): string | number => {
  try {
    const decoded = decodeJwtPayload(jwtToken);
    if (decoded && decoded.userId) {
      return decoded.userId;
    }
    return "";
  } catch (err) {
    console.error("Error getting user ID from JWT:", err);
    return "";
  }
};
