import { API_BASE_URL, handleNetworkError } from "./utils";
import {
  getJwtToken,
  UploadDocumentResponse,
  ApiError,
  UploadDocumentData,
} from "./types";

/**
 * Upload user document API
 * @param userId - The user ID to upload document for
 * @param passengerId - The passenger ID to upload document for
 * @param file - The file to upload
 * @returns Promise<UploadDocumentResponse | ApiError>
 */
export const uploadUserDocument = async (
  userId: string | number,
  passengerId: string | number,
  file: File
): Promise<UploadDocumentResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `https://prod-api.flyo.ai/core/v1/admin/uploadUserDocument?userId=${userId}&passengerId=${passengerId}`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Upload failed: ${response.status} ${response.statusText}. ${errorText}`,
      };
    }

    const data: UploadDocumentData = await response.json();

    // Check if the uploaded document is a passport
    if (data.passportExtraction && !data.passportExtraction.data.is_passport) {
      return {
        success: false,
        message:
          "This document is not a passport. Please upload a valid passport document.",
      };
    }

    return {
      success: true,
      message: data.passportExtraction?.data.is_passport
        ? "Passport document uploaded and validated successfully"
        : "Document uploaded successfully",
      data,
    };
  } catch (error) {
    console.error("Upload document error:", error);
    return handleNetworkError(error);
  }
};
