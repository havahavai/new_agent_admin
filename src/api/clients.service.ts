import { getJwtToken } from "./auth";
import { API_BASE_URL } from "./utils";
import { ApiError } from "./types";

export interface Client {
  clientId: number;  // API returns clientId, not id
  name: string;
  email: string;
  phone?: string;
  type?: 'individual' | 'corporate';
  countryCode?: string;
  createdAt?: string;
  updatedAt?: string;
  bookingCount?: number;  // Optional field from API response
}

export interface AddClientPayload {
  email: string;
  name: string;
  phone?: string;
  type?: 'individual' | 'corporate';
  countryCode?: string;
}

export interface UpdateClientPayload {
  clientId: number;
  updates: {
    name?: string;
    phone?: string;
    countryCode?: string;
    type?: 'individual' | 'corporate';
  };
}

export interface MergeClientsPayload {
  clientIds: number[];
  mainClientEmail: string;
  clientName: string;
}

export interface GetClientsResponse {
  success: boolean;
  data: Client[];
  message?: string;
}

/**
 * Get all clients
 */
export const getClients = async (
  signal?: AbortSignal
): Promise<GetClientsResponse | ApiError> => {
  try {
    const token = getJwtToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication token not found",
      };
    }

    const url = `${API_BASE_URL}/core/v1/businessFlyo/clients`;

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
        message: data.message || "Failed to fetch clients",
      };
    }

    return data;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch clients",
    };
  }
};

/**
 * Add a new client
 */
export const addClient = async (
  payload: AddClientPayload,
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

    const url = `${API_BASE_URL}/core/v1/businessFlyo/update`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "client",
        operation: "add",
        payload,
      }),
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to add client",
      };
    }

    return data;
  } catch (error) {
    console.error("Error adding client:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add client",
    };
  }
};

/**
 * Update a client
 */
export const updateClient = async (
  payload: UpdateClientPayload,
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

    // Validate payload - allow 0 as valid ID
    if (payload.clientId === null || payload.clientId === undefined || isNaN(Number(payload.clientId))) {
      return {
        success: false,
        message: "Invalid client ID provided",
      };
    }

    if (!payload.updates || typeof payload.updates !== 'object') {
      return {
        success: false,
        message: "Updates object is required",
      };
    }

    const url = `${API_BASE_URL}/core/v1/businessFlyo/update`;

    // API expects clientId and updates nested inside payload object
    const requestBody = {
      type: "client",
      operation: "update",
      payload: {
        clientId: Number(payload.clientId),
        updates: payload.updates,
      },
    };

    console.log("Update client request:", requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update client",
      };
    }

    return data;
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update client",
    };
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (
  clientId: number,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string; data?: any } | ApiError> => {
  try {
    // Validate clientId - allow 0 as valid ID
    if (clientId === null || clientId === undefined || isNaN(Number(clientId))) {
      return {
        success: false,
        message: "Invalid client ID provided",
      };
    }

    const token = getJwtToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication token not found",
      };
    }

    const url = `${API_BASE_URL}/core/v1/businessFlyo/update`;

    // Ensure clientId is a number
    const numericClientId = Number(clientId);

    // Try structure with clientId at top level (based on error message "Missing clientId")
    const requestBody = {
      type: "client",
      operation: "delete",
      clientId: numericClientId,
    };

    console.log("Delete client request:", requestBody);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Delete client error response:", data);
      return {
        success: false,
        message: data.message || "Failed to delete client",
      };
    }

    return data;
  } catch (error) {
    console.error("Error deleting client:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete client",
    };
  }
};

/**
 * Merge multiple clients
 */
export const mergeClients = async (
  payload: MergeClientsPayload,
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

    const url = `${API_BASE_URL}/core/v1/businessFlyo/update`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "client",
        operation: "merge",
        payload,
      }),
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to merge clients",
      };
    }

    return data;
  } catch (error) {
    console.error("Error merging clients:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to merge clients",
    };
  }
};

