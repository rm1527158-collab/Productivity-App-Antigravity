import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for auto-refreshing data every 5 seconds
 * @param {Function} fetchFunction - The function to call for fetching data
 * @param {Array} dependencies - Dependencies array for the fetch function
 * @param {number} interval - Refresh interval in milliseconds (default: 5000)
 * @returns {Function} manualRefresh - Function to manually trigger a refresh
 */
export const useAutoRefresh = (fetchFunction, dependencies = [], interval = 200) => {
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Wrapper to ensure we don't update state if unmounted
  const safeFetch = useCallback(async () => {
    if (isMountedRef.current) {
      await fetchFunction();
    }
  }, [fetchFunction]);

  useEffect(() => {
    // Initial fetch
    safeFetch();

    // Set up interval for auto-refresh
    intervalRef.current = setInterval(safeFetch, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      isMountedRef.current = false;
    };
  }, [safeFetch, interval, ...dependencies]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    safeFetch();
  }, [safeFetch]);

  return manualRefresh;
};

export default useAutoRefresh;
