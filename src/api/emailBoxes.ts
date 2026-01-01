import { API_BASE_URL } from "./utils";
import { getJwtToken } from "./auth";

export interface AddEmailBoxRequest {
  provider: "outlook" | "gmail";
  code?: string; // For Outlook
  refreshToken?: string; // For Gmail
  idToken?: string; // For Gmail
}

export interface AddEmailBoxResponse {
  success: boolean;
  message?: string;
  data?: {
    email?: string;
    provider?: string;
  };
}

/**
 * Add email box using OAuth tokens
 * Endpoint: POST https://prod-api.flyo.ai/core/v1/businessFlyo/addEmailBox
 * 
 * For Outlook: uses authorization code
 * For Gmail: uses refreshToken and idToken
 */
export const addEmailBox = async (
  request: AddEmailBoxRequest
): Promise<AddEmailBoxResponse> => {
  const token = getJwtToken();

  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }

  // Build request body based on provider
  let requestBody: any = {
    provider: request.provider,
  };

  if (request.provider === "outlook") {
    if (!request.code) {
      throw new Error("Authorization code is required for Outlook");
    }
    requestBody.code = request.code;
  } else if (request.provider === "gmail") {
    if (!request.refreshToken || !request.idToken) {
      throw new Error("Refresh token and ID token are required for Gmail");
    }
    requestBody.refreshToken = request.refreshToken;
    requestBody.idToken = request.idToken;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/core/v1/businessFlyo/addEmailBox`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to add email box: ${response.statusText}`
      );
    }

    const data: AddEmailBoxResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to add email box");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while adding email box");
  }
};


