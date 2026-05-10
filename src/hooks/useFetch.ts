import { useEffect, useState, useCallback } from 'react';
import axiosClient from '@/lib/axiosClient';
import { AxiosError } from 'axios';

interface UseFetchOptions {
  skip?: boolean;
  pollInterval?: number; // in ms, 0 to disable polling
  onError?: (error: Error) => void;
}

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isRetrying: boolean;
}

export function useFetch<T = any>(
  url: string,
  options: UseFetchOptions = {}
): UseFetchState<T> {
  const { skip = false, pollInterval = 0, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchData = useCallback(async () => {
    if (skip) return;

    try {
      setError(null);
      const response = await axiosClient.get<T>(url);
      setData(response.data);
      setLoading(false);
    } catch (err) {
      const error = err instanceof AxiosError ? new Error(err.message) : (err as Error);
      setError(error);
      setLoading(false);
      onError?.(error);
      console.error(`Failed to fetch from ${url}:`, error.message);
    }
  }, [url, skip, onError]);

  useEffect(() => {
    fetchData();

    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  const refetch = useCallback(async () => {
    setIsRetrying(true);
    setLoading(true);
    await fetchData();
    setIsRetrying(false);
  }, [fetchData]);

  return { data, loading, error, refetch, isRetrying };
}
