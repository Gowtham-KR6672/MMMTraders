/**
 * axiosClient.ts
 * 
 * A global axios instance that automatically attaches the JWT token
 * from localStorage as an Authorization header on every request.
 * 
 * This is the PWA fix: iOS clears httpOnly cookies when the app is closed,
 * so we persist the token in localStorage and send it via header as a fallback.
 */
import axios from 'axios';

const axiosClient = axios.create();

axiosClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('mmm_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

export default axiosClient;
