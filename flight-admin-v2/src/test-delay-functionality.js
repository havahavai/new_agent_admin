// Test script to verify delay functionality
// This can be run in the browser console to test the delay parsing functions

// Helper function to parse delay string and extract minutes
const parseDelayString = (delayString) => {
  if (!delayString) return undefined
  
  // Extract number from strings like "35m delay", "2h delay", "45 min delay", etc.
  const match = delayString.match(/(\d+)\s*(m|min|h|hour)/i)
  if (match) {
    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()
    
    // Convert to minutes
    if (unit.startsWith('h')) {
      return value * 60
    } else {
      return value
    }
  }
  
  return undefined
}

// Helper function to determine flight status based on delay and check-in status
const determineFlightStatus = (delayString, checkInStatus) => {
  if (delayString && delayString.toLowerCase().includes('delay')) {
    return 'Delayed'
  }
  
  switch (checkInStatus) {
    case 'FAILED':
      return 'Delayed'
    case 'COMPLETED':
      return 'On Time'
    case 'BOARDING':
      return 'Boarding'
    default:
      return 'On Time'
  }
}

// Test cases
const testCases = [
  {
    delay: "35m delay",
    checkInStatus: "FAILED",
    expectedMinutes: 35,
    expectedStatus: "Delayed"
  },
  {
    delay: "2h delay", 
    checkInStatus: "COMPLETED",
    expectedMinutes: 120,
    expectedStatus: "Delayed"
  },
  {
    delay: "45 min delay",
    checkInStatus: "COMPLETED", 
    expectedMinutes: 45,
    expectedStatus: "Delayed"
  },
  {
    delay: "",
    checkInStatus: "COMPLETED",
    expectedMinutes: undefined,
    expectedStatus: "On Time"
  },
  {
    delay: "",
    checkInStatus: "BOARDING",
    expectedMinutes: undefined,
    expectedStatus: "Boarding"
  },
  {
    delay: "",
    checkInStatus: "FAILED",
    expectedMinutes: undefined,
    expectedStatus: "Delayed"
  }
]

// Run tests
console.log("Testing delay functionality...")
testCases.forEach((testCase, index) => {
  const actualMinutes = parseDelayString(testCase.delay)
  const actualStatus = determineFlightStatus(testCase.delay, testCase.checkInStatus)
  
  const minutesMatch = actualMinutes === testCase.expectedMinutes
  const statusMatch = actualStatus === testCase.expectedStatus
  
  console.log(`Test ${index + 1}:`, {
    input: testCase,
    actualMinutes,
    actualStatus,
    minutesMatch,
    statusMatch,
    passed: minutesMatch && statusMatch
  })
})

// Test with the actual API response format
const mockApiResponse = {
  "success": true,
  "data": {
    "flightNumber": "TK34",
    "pnr": "TESTING",
    "flightClass": "",
    "bookingReference": "",
    "checkInStatus": "FAILED",
    "isInternational": true,
    "aircraftType": "Boeing 787-9",
    "boardingGate": "D11",
    "Terminal": "D",
    "delay": "35m delay",
    "departure": {
      "airportIata": "IAH",
      "city": "Houston",
      "time": "2025-07-13T21:35:00.000Z"
    },
    "arrival": {
      "airportIata": "IST",
      "city": "Arnavutköy, Istanbul",
      "time": "2025-07-14T16:48:00.000Z"
    }
  }
}

console.log("\nTesting with mock API response:")
const apiDelayMinutes = parseDelayString(mockApiResponse.data.delay)
const apiStatus = determineFlightStatus(mockApiResponse.data.delay, mockApiResponse.data.checkInStatus)

console.log({
  originalDelay: mockApiResponse.data.delay,
  parsedMinutes: apiDelayMinutes,
  determinedStatus: apiStatus,
  checkInStatus: mockApiResponse.data.checkInStatus
})

console.log("\nAll tests completed!")
