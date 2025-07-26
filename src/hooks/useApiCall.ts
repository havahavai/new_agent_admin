import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to prevent duplicate API calls and handle loading states
 */
export function useApiCall<T>(
  apiFunction: (signal?: AbortSignal) => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCallInProgressRef = useRef(false);

  // Function to execute the API call
  const executeCall = useCallback(async () => {
    // Prevent duplicate calls
    if (isCallInProgressRef.current) {
      console.warn('API call already in progress, skipping duplicate call');
      return;
    }

    // Abort any existing call
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    isCallInProgressRef.current = true;

    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(abortControllerRef.current.signal);
      
      // Check if the call was aborted
      if (abortControllerRef.current.signal.aborted) {
        console.log('API call was aborted');
        return;
      }

      setData(result);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('API call was aborted');
        return;
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API call error:', err);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
      isCallInProgressRef.current = false;
    }
  }, [apiFunction]);

  // Effect to execute the call when dependencies change
  useEffect(() => {
    executeCall();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isCallInProgressRef.current = false;
    };
  }, dependencies);

  // Manual refresh function
  const refresh = useCallback(() => {
    executeCall();
  }, [executeCall]);

  return {
    data,
    loading,
    error,
    refresh,
    isCallInProgress: isCallInProgressRef.current
  };
}

/**
 * Hook for manual API calls (not triggered by useEffect)
 */
export function useManualApiCall<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCallInProgressRef = useRef(false);

  const execute = useCallback(async (apiFunction: (signal?: AbortSignal) => Promise<T>) => {
    // Prevent duplicate calls
    if (isCallInProgressRef.current) {
      console.warn('API call already in progress, skipping duplicate call');
      return null;
    }

    // Abort any existing call
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    isCallInProgressRef.current = true;

    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(abortControllerRef.current.signal);
      
      // Check if the call was aborted
      if (abortControllerRef.current.signal.aborted) {
        console.log('API call was aborted');
        return null;
      }

      setData(result);
      return result;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('API call was aborted');
        return null;
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API call error:', err);
      return null;
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
      isCallInProgressRef.current = false;
    }
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isCallInProgressRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    isCallInProgress: isCallInProgressRef.current
  };
}
