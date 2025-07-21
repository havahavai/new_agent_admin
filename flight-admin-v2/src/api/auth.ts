import { API_BASE_URL } from "./utils";
import { isUserTypeAllowed, getUnauthorizedMessage } from "../config/auth";

export interface LoginRequest {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export interface LoginResponse {
  jwtToken: string;
  userType: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

export interface SpecialUserLoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface SpecialUserLoginResponse {
  success: boolean;
  data: {
    jwtToken: string;
    userType: string;
  };
  message: string;
}

/**
 * Login with Google OAuth tokens
 */
export const loginWithGoogle = async (
  tokens: AuthTokens
): Promise<LoginResponse> => {
  try {
    console.log("Login request tokens:", tokens);
    console.log("Login request URL:", `${API_BASE_URL}/core/v2/websiteLogin`);
    const response = await fetch(
      `https://prod-api.flyo.ai/core/v2/websiteLogin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Login failed: ${response.status} ${response.statusText}. ${
          errorData.message || errorData.error || ""
        }`
      );
    }

    const data = await response.json();

    if (!data.jwtToken) {
      throw new Error("JWT token not received from login API");
    }

    // Validate user type if provided
    if (data.userType && !isUserTypeAllowed(data.userType)) {
      throw new Error(getUnauthorizedMessage(data.userType));
    }

    return data;
  } catch (error) {
    console.error("Login API error:", error);
    throw error;
  }
};

/**
 * Login with email and password for special users
 */
export const loginWithEmailPassword = async (
  credentials: SpecialUserLoginRequest
): Promise<LoginResponse> => {
  try {
    console.log("Special user login request:", {
      email: credentials.email,
      role: credentials.role,
    });
    const response = await fetch(
      `https://prod-api.flyo.ai/core/v1/admin/specialUserAuth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          role: credentials.role,
        }),
      }
    );

    const data: SpecialUserLoginResponse = await response.json();

    if (!response.ok || !data.success) {
      // Return the access denied message for unauthorized users
      throw new Error(getUnauthorizedMessage());
    }

    if (!data.data.jwtToken) {
      throw new Error("JWT token not received from login API");
    }

    // Validate user type if provided
    if (data.data.userType && !isUserTypeAllowed(data.data.userType)) {
      throw new Error(getUnauthorizedMessage(data.data.userType));
    }

    return {
      jwtToken: data.data.jwtToken,
      userType: data.data.userType,
    };
  } catch (error) {
    console.error("Special user login API error:", error);
    throw error;
  }
};

/**
 * Store JWT token in localStorage
 */
export const storeJwtToken = (jwtToken: string): void => {
  localStorage.setItem("jwtToken", jwtToken);
};

/**
 * Store JWT token with user type validation
 */
export const storeJwtTokenWithValidation = (
  jwtToken: string,
  userType: string
): void => {
  if (!isUserTypeAllowed(userType)) {
    throw new Error(getUnauthorizedMessage(userType));
  }
  localStorage.setItem("jwtToken", jwtToken);
  localStorage.setItem("userType", userType);
};

/**
 * Get JWT token from localStorage
 */
export const getJwtToken = (): string => {
  return localStorage.getItem("jwtToken") || "";
};

/**
 * Remove JWT token from localStorage
 */
export const removeJwtToken = (): void => {
  localStorage.removeItem("jwtToken");
};

/**
 * Check if user is authenticated (has valid JWT token)
 */
export const isAuthenticated = (): boolean => {
  const token = getJwtToken();
  return !!token;
};

/**
 * Logout user by removing JWT token
 */
export const logout = (): void => {
  removeJwtToken();
  // Clear user type and other auth-related data
  localStorage.removeItem("userType");
  localStorage.removeItem("oauthDebugData");
};
