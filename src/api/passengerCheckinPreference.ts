import { 
  PassengerCheckinPreferenceRequest, 
  PassengerCheckinPreferenceResponse, 
  ApiError, 
  getJwtToken, 
  BASE_API_URL 
} from "./types";
import { handleNetworkError } from "./utils";

/**
 * API: Update Passenger Check-in Preference
 * Updates seat preferences for passengers (1-5 passengers supported)
 */
export const updatePassengerCheckinPreference = async (
  passengerId: string,
  preferences: {
    seatPosition?: string;
    rowPosition?: string;
    seatPosition2?: string;
    rowPosition2?: string;
    seatPosition3?: string;
    rowPosition3?: string;
    seatPosition4?: string;
    rowPosition4?: string;
    seatPosition5?: string;
    rowPosition5?: string;
  }
): Promise<PassengerCheckinPreferenceResponse | ApiError> => {
  try {
    const jwtToken = getJwtToken();
    const url = `${BASE_API_URL}/admin/update`;

    const requestBody: PassengerCheckinPreferenceRequest = {
      type: "PASSENGER_CHECKIN_PREFERENCE",
      operationType: "ADD",
      body: {
        passengerId,
        ...preferences
      }
    };

    console.log('Updating passenger check-in preference:', requestBody);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data: PassengerCheckinPreferenceResponse = await response.json();

    // Validate response structure
    if (typeof data.success !== 'boolean') {
      throw new Error("Invalid response format from server");
    }

    return data;
  } catch (error) {
    console.error("Error updating passenger check-in preference:", error);
    return handleNetworkError(error);
  }
};

/**
 * Helper function to build seat preferences object for multiple passengers
 * @param passengerPreferences Array of seat preferences for each passenger (max 5)
 * @returns Formatted preferences object for API
 */
export const buildPassengerSeatPreferences = (
  passengerPreferences: Array<{
    seatPosition?: string;
    rowPosition?: string;
  }>
) => {
  const preferences: any = {};
  
  passengerPreferences.forEach((pref, index) => {
    const suffix = index === 0 ? '' : (index + 1).toString();
    
    if (pref.seatPosition) {
      preferences[`seatPosition${suffix}`] = pref.seatPosition;
    }
    if (pref.rowPosition) {
      preferences[`rowPosition${suffix}`] = pref.rowPosition;
    }
  });

  return preferences;
};
