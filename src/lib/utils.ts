import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Check-in status utility types
export type CheckInStatusDisplay =
  | "SCHEDULED"
  | "COMPLETED"
  | "INPROGRESS"
  | "FAILED"
  | "MISSING_INFO"
  | "In Progress";

export interface CheckInStatusResult {
  displayStatus: CheckInStatusDisplay;
  colorClass: string;
  statusMessage?: string; // Include statusMessage when it should be displayed
}

/**
 * Utility function to normalize check-in status and provide consistent display values and colors
 * @param checkInStatus - The raw check-in status from API or data
 * @param statusMessage - The status message from API
 * @param checkInSubStatus - The optional check-in sub-status from API
 * @returns Object with normalized display status and corresponding color class
 */
export function getCheckinStatusDisplay(
  checkInStatus: string,
  checkInSubStatus?: string,
  statusMessage?: string
): CheckInStatusResult {
  let displayText: string;
  let colorClass: string;

  let shouldShowStatusMessage = false;

  // Implement the logic in the correct order with exact string matching
  if (checkInStatus.includes("COMPLETED")) {
    // 1. If checkInStatus.includes('COMPLETED') → display: "COMPLETED" with green color
    // When COMPLETED, show only checkInStatus, ignore subStatus and statusMessage
    displayText = "COMPLETED";
    colorClass = "bg-green-100 text-green-800";
    shouldShowStatusMessage = false; // Don't show statusMessage for COMPLETED
  } else if (checkInStatus === "COMPLETED_BY_USER") {
    // When COMPLETED_BY_USER, show only checkInStatus, ignore subStatus and statusMessage
    displayText = "COMPLETED";
    colorClass = "bg-green-100 text-green-800";
    shouldShowStatusMessage = false; // Don't show statusMessage for COMPLETED_BY_USER
  } else if (checkInStatus === "FAILED_BY_ADMIN") {
    // 2. If checkInStatus === 'FAILED_BY_ADMIN' → display: statusMessage value with red color
    displayText = statusMessage || "FAILED";
    colorClass = "bg-red-100 text-red-800";
    shouldShowStatusMessage = false; // statusMessage is already used as displayText
  } else if (
    checkInStatus === "MANUAL_INTERVENTION_REQUIRED" &&
    checkInSubStatus === "MISSING_INFO"
  ) {
    // 3. If checkInStatus === 'MANUAL_INTERVENTION_REQUIRED' AND checkInSubStatus === 'MISSING_INFO' → display: checkInSubStatus value with red color
    displayText = checkInSubStatus;
    colorClass = "bg-red-100 text-red-800";
    shouldShowStatusMessage = !!statusMessage; // Show statusMessage below if available
  } else if (
    checkInStatus === "SCHEDULED" &&
    checkInSubStatus === "MISSING_INFO"
  ) {
    // 4. If checkInStatus === 'SCHEDULED' AND checkInSubStatus === 'MISSING_INFO' → display: checkInSubStatus value with red color
    displayText = checkInSubStatus;
    colorClass = "bg-red-100 text-red-800";
    shouldShowStatusMessage = !!statusMessage; // Show statusMessage below if available
  } else {
    // 5. For all other cases → display: "In Progress" with yellow color
    displayText = "In Progress";
    colorClass = "bg-yellow-100 text-yellow-800";
    shouldShowStatusMessage = !!statusMessage; // Show statusMessage below if available
  }

  return {
    displayStatus: displayText as CheckInStatusDisplay,
    colorClass,
    ...(shouldShowStatusMessage && statusMessage ? { statusMessage } : {}),
  };
}
