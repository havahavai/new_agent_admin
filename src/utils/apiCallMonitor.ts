/**
 * API Call Monitor Utility
 * Helps detect and prevent duplicate API calls
 */

interface ApiCall {
  url: string;
  timestamp: number;
  id: string;
}

class ApiCallMonitor {
  private activeCalls: Map<string, ApiCall> = new Map();
  private callHistory: ApiCall[] = [];
  private readonly DUPLICATE_THRESHOLD = 1000; // 1 second

  /**
   * Check if an API call is a duplicate within the threshold time
   */
  isDuplicateCall(url: string): boolean {
    const now = Date.now();
    const existingCall = this.activeCalls.get(url);
    
    if (existingCall && (now - existingCall.timestamp) < this.DUPLICATE_THRESHOLD) {
      console.warn(`🚫 Duplicate API call detected for: ${url}`);
      console.warn(`Previous call was ${now - existingCall.timestamp}ms ago`);
      return true;
    }
    
    return false;
  }

  /**
   * Register a new API call
   */
  registerCall(url: string): string {
    const callId = `${url}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const apiCall: ApiCall = {
      url,
      timestamp: Date.now(),
      id: callId
    };

    this.activeCalls.set(url, apiCall);
    this.callHistory.push(apiCall);
    
    console.log(`📡 API call registered: ${url} (ID: ${callId})`);
    return callId;
  }

  /**
   * Mark an API call as completed
   */
  completeCall(url: string, callId: string): void {
    const activeCall = this.activeCalls.get(url);
    if (activeCall && activeCall.id === callId) {
      this.activeCalls.delete(url);
      console.log(`✅ API call completed: ${url} (ID: ${callId})`);
    }
  }

  /**
   * Get statistics about API calls
   */
  getStats(): { activeCalls: number; totalCalls: number; recentDuplicates: number } {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(call => (now - call.timestamp) < 10000); // Last 10 seconds
    const urlCounts = new Map<string, number>();
    
    recentCalls.forEach(call => {
      urlCounts.set(call.url, (urlCounts.get(call.url) || 0) + 1);
    });

    const recentDuplicates = Array.from(urlCounts.values()).filter(count => count > 1).length;

    return {
      activeCalls: this.activeCalls.size,
      totalCalls: this.callHistory.length,
      recentDuplicates
    };
  }

  /**
   * Clear old call history to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const HISTORY_RETENTION = 60000; // Keep history for 1 minute
    
    this.callHistory = this.callHistory.filter(
      call => (now - call.timestamp) < HISTORY_RETENTION
    );
  }
}

// Create a singleton instance
export const apiCallMonitor = new ApiCallMonitor();

// Cleanup old history every 30 seconds
setInterval(() => {
  apiCallMonitor.cleanup();
}, 30000);

/**
 * Wrapper function to monitor API calls
 */
export const monitoredFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  // Check for duplicate calls
  if (apiCallMonitor.isDuplicateCall(url)) {
    throw new Error(`Duplicate API call prevented for: ${url}`);
  }

  // Register the call
  const callId = apiCallMonitor.registerCall(url);

  try {
    const response = await fetch(url, options);
    apiCallMonitor.completeCall(url, callId);
    return response;
  } catch (error) {
    apiCallMonitor.completeCall(url, callId);
    throw error;
  }
};

/**
 * Development helper to log API call statistics
 */
export const logApiStats = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const stats = apiCallMonitor.getStats();
    console.log('📊 API Call Statistics:', stats);
    
    if (stats.recentDuplicates > 0) {
      console.warn(`⚠️  Detected ${stats.recentDuplicates} potential duplicate API calls in the last 10 seconds`);
    }
  }
};

// Log stats every 10 seconds in development
if (process.env.NODE_ENV === 'development') {
  setInterval(logApiStats, 10000);
}
