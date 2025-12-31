import { getJwtToken } from "./auth";
import { API_BASE_URL } from "./utils";
import { ApiError } from "./types";

export interface Ticket {
  id: number;
  pnr: string;
  status: string;
  departure: {
    date: string;
    iata: string;
    city: string;
    country: string;
  };
  arrival: {
    date: string;
    iata: string;
    city: string;
    country: string;
  };
  source: Array<{
    name: string;
    sourceId: string;
  }>;
  amount: number | null;
  bookingClass: string;
  fareType: string | null;
  clients: Array<{
    id: number;
    name: string;
    email: string;
  }>;
}

export interface GetTicketsResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    sortedData: { [key: string]: Ticket[] };
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface GetTicketsParams {
  timeframe?: "upcoming" | "past";
  page?: number;
  limit?: number;
  pnr?: string;
  clientEmail?: string;
  sector?: string;
}

/**
 * Get tickets with optional filters
 */
export const getTickets = async (
  params: GetTicketsParams = {},
  signal?: AbortSignal
): Promise<GetTicketsResponse | ApiError> => {
  try {
    const token = getJwtToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication token not found",
      };
    }

    const queryParams = new URLSearchParams();
    if (params.timeframe) queryParams.append("timeframe", params.timeframe);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.pnr) queryParams.append("pnr", params.pnr);
    if (params.clientEmail) queryParams.append("clientEmail", params.clientEmail);
    if (params.sector) queryParams.append("sector", params.sector);

    const url = `${API_BASE_URL}/core/v1/businessFlyo/tickets/getTickets?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch tickets",
      };
    }

    return data;
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch tickets",
    };
  }
};

/**
 * Upload ticket by document
 */
export const uploadTicketByDocument = async (
  file: File,
  clientEmail?: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string; data?: any } | ApiError> => {
  try {
    const token = getJwtToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication token not found",
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    if (clientEmail) {
      formData.append("clientEmail", clientEmail);
    }

    const url = `${API_BASE_URL}/core/v1/businessFlyo/tickets/uploadByDocument`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to upload ticket",
      };
    }

    return data;
  } catch (error) {
    console.error("Error uploading ticket:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload ticket",
    };
  }
};

