import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  AddPassportRequest,
  AddPassportResponse,
  ApiError,
  getJwtToken,
} from "./types";

/**
 * Add passport document for a passenger
 */
export const addPassport = async (
  passengerId: number,
  documentNumber: string,
  dateOfIssue: string,
  dateOfExpiry: string,
  placeOfIssue: string
): Promise<AddPassportResponse | ApiError> => {
  try {
    //comment
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Validate required fields
    if (!passengerId || !documentNumber || !dateOfExpiry || !placeOfIssue) {
      return {
        success: false,
        message:
          "Passenger ID, document number, expiry date, and place of issue are required.",
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

    const requestBody: AddPassportRequest = {
      type: "PASSENGERDOCUMENT",
      operationType: "ADD",
      body: {
        passengerId,
        documentType: "passport",
        documentNumber,
        dateOfIssue,
        dateOfExpiry,
        placeOfIssue,
      },
    };

    console.log("Adding passport with data:", requestBody);

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
      console.error("Add passport API error:", response.status, errorText);

      return {
        success: false,
        message: `Failed to add passport: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Add passport API response:", data);

    return {
      success: true,
      message: "Passport added successfully",
      data,
    };
  } catch (error) {
    console.error("Add passport error:", error);
    return handleNetworkError(error);
  }
};
