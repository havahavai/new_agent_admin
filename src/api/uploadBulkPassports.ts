import { handleNetworkError } from "./utils";
import { getJwtToken, ApiError } from "./types";

export interface BulkPassportUploadResponse {
  success: boolean;
  message: string;
  data?: {
    uploadedFiles: Array<{
      filename: string;
      status: "success" | "failed";
      message?: string;
    }>;
    totalFiles: number;
    successfulUploads: number;
    failedUploads: number;
  };
}

export const uploadBulkPassports = async (
  userId: string | number,
  files: File[]
): Promise<BulkPassportUploadResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();

    if (!jwtToken) {
      return {
        success: false,
        message: "Authentication token not found. Please login again.",
      };
    }

    if (!files || files.length === 0) {
      return {
        success: false,
        message: "No files selected for upload.",
      };
    }

    // Validate file types and sizes
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          message: `File "${file.name}" has invalid type. Only PDF, JPG, and PNG files are allowed.`,
        };
      }

      if (file.size > maxSize) {
        return {
          success: false,
          message: `File "${file.name}" is too large. Maximum file size is 5MB.`,
        };
      }
    }

    // Create FormData for file upload
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    console.log(`Uploading ${files.length} passport files for user ${userId}`);
    console.log(
      "Files being uploaded:",
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );
    console.log(
      "FormData entries:",
      Array.from(formData.entries()).map(([key, value]) => ({
        key,
        fileName: value instanceof File ? value.name : value,
      }))
    );

    const url = `http://localhost:443/core/v1/b2bUser/uploadPassport?userId=${userId}`;
    console.log("Request URL:", url);
    console.log(
      "Authorization header:",
      `Bearer ${jwtToken.substring(0, 20)}...`
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      body: formData,
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Bulk passport upload API error:",
        response.status,
        response.statusText
      );
      console.error("Error response body:", errorText);

      return {
        success: false,
        message: `Upload failed: ${response.status} ${response.statusText}. ${errorText}`,
      };
    }

    const data = await response.json();
    console.log("Bulk passport upload API response:", data);

    return {
      success: true,
      message: `Successfully uploaded ${files.length} passport file(s)`,
      data: {
        uploadedFiles: files.map((file) => ({
          filename: file.name,
          status: "success" as const,
        })),
        totalFiles: files.length,
        successfulUploads: files.length,
        failedUploads: 0,
      },
    };
  } catch (error) {
    console.error("Bulk passport upload error:", error);
    return handleNetworkError(error);
  }
};
