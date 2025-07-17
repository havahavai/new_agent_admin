import { ApiError } from "./types";

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
