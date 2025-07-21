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
