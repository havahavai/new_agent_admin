import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  UpdatePassportRequest,
  UpdatePassportResponse,
  ApiError,
  getJwtToken,
} from "./types";

/**
 * Update passport document for a passenger
 */
export const updatePassport = async (
  documentId: number,
  documentNumber: string,
  dateOfIssue: string,
  dateOfExpiry: string,
  placeOfIssue: string
): Promise<UpdatePassportResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!documentId || !documentNumber || !dateOfExpiry || !placeOfIssue) {
      return {
        success: false,
        message:
          "Document ID, document number, expiry date, and place of issue are required.",
      };
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateOfIssue && !dateRegex.test(dateOfIssue)) {
      return {
        success: false,
        message: "Date of issue must be in YYYY-MM-DD format.",
      };
    }

    if (!dateRegex.test(dateOfExpiry)) {
      return {
        success: false,
        message: "Date of expiry must be in YYYY-MM-DD format.",
      };
    }

    // Validate expiry date is in the future
    const today = new Date();
    const expiryDate = new Date(dateOfExpiry);
    if (expiryDate <= today) {
      return {
        success: false,
        message: "Passport expiry date must be in the future.",
      };
    }

    const requestBody: UpdatePassportRequest = {
      type: "PASSENGERDOCUMENT",
      operationType: "UPDATE",
      body: {
        documentId,
        documentType: "passport",
        documentNumber,
        dateOfIssue,
        dateOfExpiry,
        placeOfIssue,
      },
    };

    console.log("Updating passport with data:", requestBody);

    const response = await fetch(
      `https://prod-api.flyo.ai/core/v1/admin/update`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update passport API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to update passport: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Update passport API response:", data);

    return {
      success: true,
      message: "Passport updated successfully",
      data,
    };
  } catch (error) {
    console.error("Update passport error:", error);
    return handleNetworkError(error);
  }
};
