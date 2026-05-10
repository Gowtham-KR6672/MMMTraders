import axios, { AxiosError } from 'axios';

const axiosClient = axios.create({
  timeout: 30000, // 30 second timeout
});

// Track pending requests to avoid duplicates
const pendingRequests = new Map<string, Promise<any>>();

const getRequestKey = (config: any) => `${config.method}:${config.url}`;

// Request interceptor: add auth token and dedup
axiosClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mmm_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Dedup GET requests
  if (config.method?.toUpperCase() === 'GET') {
    const key = getRequestKey(config);
    if (pendingRequests.has(key)) {
      return Promise.reject(new Error('Duplicate request cancelled'));
    }
  }

  return config;
});

// Response interceptor: retry logic and cleanup
axiosClient.interceptors.response.use(
  (response) => {
    if (response.config.method?.toUpperCase() === 'GET') {
      const key = getRequestKey(response.config);
      pendingRequests.delete(key);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as any;

    if (!config) return Promise.reject(error);

    // Cleanup pending request
    const key = getRequestKey(config);
    pendingRequests.delete(key);

    // Retry logic for network errors and 5xx server errors
    config.retryCount = config.retryCount || 0;
    const maxRetries = config.method?.toUpperCase() === 'GET' ? 3 : 1;
    const shouldRetry = !error.response || (error.response && error.response.status >= 500);

    if (config.retryCount < maxRetries && shouldRetry) {
      config.retryCount++;
      const delay = Math.min(1000 * Math.pow(2, config.retryCount - 1), 10000);

      // Return cached data if available for GET requests
      if (config.method?.toUpperCase() === 'GET' && typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(`cache:${config.url}`);
        if (cached && error.response && error.response.status >= 500) {
          try {
            return Promise.resolve({ data: JSON.parse(cached), cached: true });
          } catch {}
        }
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosClient(config);
    }

    return Promise.reject(error);
  }
);

// Optionally cache GET responses in sessionStorage for 5 minutes
axiosClient.interceptors.response.use((response) => {
  if (response.config.method?.toUpperCase() === 'GET' && typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`cache:${response.config.url}`, JSON.stringify(response.data));
    } catch {}
  }
  return response;
});

export default axiosClient;
