import { handleNetworkError } from "./utils";
import { getJwtToken, ApiError, BASE_API_URL } from "./types";
import { GetUserId } from "./utils";

export interface UploadTicketResponse {
  success: boolean;
  message: string;
  data?: {
    flightId?: string;
    ticketId?: string;
    extractedData?: {
      airline?: string;
      flightNumber?: string;
      departureDate?: string;
      departureAirport?: string;
      arrivalAirport?: string;
    };
  };
}

/**
 * Upload a ticket file (PDF, JPG, PNG) to extract flight information
 */
export const uploadTicket = async (
  file: File
): Promise<UploadTicketResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    if (!file) {
      return {
        success: false,
        message: "No file selected for upload.",
      };
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: "Invalid file type. Only PDF, JPG, and PNG files are allowed.",
      };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        message: "File size must be less than 10MB.",
      };
    }

    const userId = GetUserId(jwtToken);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("file", file);

    console.log("Uploading ticket file:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId,
    });

    const response = await fetch(
      `${BASE_API_URL}/b2bUser/uploadTicket?userId=${userId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload ticket API error:", response.status, errorText);

      return {
        success: false,
        message: `Upload failed: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const data = await response.json();
    console.log("Upload ticket API response:", data);

    return {
      success: true,
      message: "Ticket uploaded successfully",
      data,
    };
  } catch (error) {
    console.error("Upload ticket error:", error);
    return handleNetworkError(error);
  }
};

