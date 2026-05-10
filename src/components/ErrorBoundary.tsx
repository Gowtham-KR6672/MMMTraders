'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });
  const networkStatus = useNetworkStatus();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught:', event.error);
      setErrorState({ hasError: true, error: event.error });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (errorState.hasError && errorState.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            {errorState.error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={() => setErrorState({ hasError: false })}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!networkStatus.isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <WifiOff className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-bold text-slate-800">No internet connection</h1>
          </div>
          <p className="text-slate-600 text-sm mb-6">
            Please check your internet connection. We'll reconnect automatically when you're back online.
          </p>
          <div className="text-sm text-slate-500 text-center">Waiting for connection...</div>
        </div>
      </div>
    );
  }

  return children;
}

export function NetworkStatusIndicator() {
  const networkStatus = useNetworkStatus();

  if (networkStatus.isOnline && !networkStatus.isSlowConnection) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] bg-red-50 border-b border-red-200 px-4 py-2">
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        {!networkStatus.isOnline ? (
          <>
            <WifiOff className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">No internet connection</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700 font-medium">Slow connection detected</span>
          </>
        )}
      </div>
    </div>
  );
}
