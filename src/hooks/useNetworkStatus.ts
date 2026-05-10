import { useEffect, useState } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect slow connection using Network Information API
    const checkConnection = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        const isSlowConnection =
          conn.effectiveType === '2g' || (conn.effectiveType === '3g' && conn.saveData);
        setStatus((prev) => ({ ...prev, isSlowConnection }));
      }
    };

    checkConnection();
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', checkConnection);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', checkConnection);
      }
    };
  }, []);

  return status;
}
