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
  | "MISSING_INFO";

export interface CheckInStatusResult {
  displayStatus: CheckInStatusDisplay;
  colorClass: string;
}

/**
 * Utility function to normalize check-in status and provide consistent display values and colors
 * @param status - The raw check-in status from API or data
 * @param subStatus - The optional check-in sub-status from API
 * @returns Object with normalized display status and corresponding color class
 */
export function getCheckinStatusDisplay(
  status: string,
  subStatus?: string
): CheckInStatusResult {
  // Convert to uppercase for consistent comparison
  const upperStatus = status.toUpperCase();
  const upperSubStatus = subStatus?.toUpperCase();
  console.log("Status:", upperStatus, "SubStatus:", upperSubStatus);

  // Determine display status based on the rules:
  // - If it's SCHEDULED and checkInSubStatus is MISSING_INFO, show MISSING_INFO
  // - If it's SCHEDULED, show SCHEDULED
  // - If it contains COMPLETE (using includes), show COMPLETED
  // - If it's FAILED_BY_ADMIN, show FAILED
  // - In other cases, show INPROGRESS
  let displayStatus: CheckInStatusDisplay;

  if (upperStatus === "SCHEDULED" && upperSubStatus === "MISSING_INFO") {
    displayStatus = "MISSING_INFO";
  } else if (upperStatus === "SCHEDULED") {
    displayStatus = "SCHEDULED";
  } else if (
    upperStatus === "MANUAL_INTERVENTION_REQUIRED" &&
    upperSubStatus === "MISSING_INFO"
  ) {
    displayStatus = "MISSING_INFO";
  } else if (upperStatus.includes("COMPLETE")) {
    displayStatus = "COMPLETED";
  } else if (upperStatus === "FAILED_BY_ADMIN") {
    displayStatus = "FAILED";
  } else {
    displayStatus = "INPROGRESS";
  }

  // Get color class based on display status:
  // - COMPLETED: green
  // - SCHEDULED: yellow
  // - INPROGRESS: blue
  // - FAILED: red
  // - MISSING_INFO: red
  let colorClass: string;

  switch (displayStatus) {
    case "COMPLETED":
      colorClass = "bg-green-100 text-green-800";
      break;
    case "SCHEDULED":
      colorClass = "bg-yellow-100 text-yellow-800";
      break;
    case "INPROGRESS":
      colorClass = "bg-blue-100 text-blue-800";
      break;
    case "FAILED":
      colorClass = "bg-red-100 text-red-800";
      break;
    case "MISSING_INFO":
      colorClass = "bg-red-100 text-red-800";
      break;
    default:
      colorClass = "bg-gray-100 text-gray-800";
  }

  return {
    displayStatus,
    colorClass,
  };
}
