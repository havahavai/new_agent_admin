/**
 * Authentication configuration
 */

/**
 * List of allowed user types that can access the flight admin dashboard
 */
export const ALLOWED_USER_TYPES = ["agent", "admin", "superAdmin"] as const;

/**
 * Type definition for allowed user types
 */
export type AllowedUserType = (typeof ALLOWED_USER_TYPES)[number];

/**
 * Check if a user type is allowed to access the dashboard
 */
export const isUserTypeAllowed = (userType: string): boolean => {
  return ALLOWED_USER_TYPES.includes(userType as AllowedUserType);
};

/**
 * Get user-friendly error message for unauthorized access
 */
export const getUnauthorizedMessage = (userType?: string): string => {
  if (!userType) {
    return "Access denied. Your account type is not recognized. This area is restricted to authorized agents and administrators.";
  }

  return `Access denied. Your account does not have permission to access this dashboard. Only authorized agents and administrators are allowed.`;
};

/**
 * Interface for email/password credentials configuration
 */
export interface EmailPasswordConfig {
  [email: string]: string; // email -> password mapping
}

/**
 * Parse email/password configuration from environment variables
 * Expected format: VITE_AUTH_CREDENTIALS={"email1@example.com":"password1","email2@example.com":"password2"}
 */
export const getEmailPasswordConfig = (): EmailPasswordConfig => {
  try {
    const configString = import.meta.env.VITE_AUTH_CREDENTIALS;
    if (!configString) {
      console.warn("VITE_AUTH_CREDENTIALS not found in environment variables");
      return {};
    }

    const config = JSON.parse(configString);
    if (typeof config !== "object" || config === null) {
      console.error("VITE_AUTH_CREDENTIALS must be a valid JSON object");
      return {};
    }

    return config;
  } catch (error) {
    console.error("Error parsing VITE_AUTH_CREDENTIALS:", error);
    return {};
  }
};

/**
 * Validate email and password against environment configuration
 * Email comparison is case-insensitive
 */
export const validateEmailPassword = (
  email: string,
  password: string
): boolean => {
  const config = getEmailPasswordConfig();
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email exists in config (case-insensitive)
  for (const [configEmail, configPassword] of Object.entries(config)) {
    if (configEmail.toLowerCase().trim() === normalizedEmail) {
      return configPassword === password;
    }
  }

  return false;
};

/**
 * Get specific error message for credential validation failures
 */
export const getCredentialErrorMessage = (): string => {
  return "Access denied. Invalid email or password.";
};
