
import { useEffect, useRef } from 'react';

export const getErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  
  // Standard Error object
  if (error instanceof Error) return error.message;
  
  // Custom API Error objects
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.error) {
     if (typeof error.error === 'string') return error.error;
     if (error.error.message) return error.error.message;
  }

  // Fallback for unexpected objects (e.g. from API responses like { status: 400, statusText: "Bad Request" })
  if (typeof error === 'object') {
     // Try to find ANY useful string property
     if (error.statusText) return `${error.status} ${error.statusText}`;
     if (error.detail) return error.detail;
     if (error.details) return error.details;
     
     try {
       const json = JSON.stringify(error, null, 2);
       if (json === '{}') return 'Unknown Object Error (Check Console)';
       return json;
     } catch (e) {
       return 'Unreadable Error Object';
     }
  }
  return String(error);
};

export const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};
