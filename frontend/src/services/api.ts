// frontend/src/services/api.ts

import axios, { AxiosRequestConfig, AxiosError } from 'axios'; 

// IMPORTANT: Update this URL to your deployed FastAPI server URL when you deploy!
const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

// Interceptor to automatically attach the JWT token (for Admin/User Authentication)
api.interceptors.request.use(
  // *** FIX: Use the most generic config type here to satisfy TypeScript ***
  (config: any) => { // <--- Changed back to 'any' or use AxiosRequestConfig<any> if it works, but 'any' is safest for this specific issue
    // We will read the token from localStorage once we implement login
    const token = localStorage.getItem('token');

    if (token) {
      // Ensure config.headers is an object before assigning to it
      if (!config.headers) {
        config.headers = {};
      }
      // Assign the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => { // Error handler can remain AxiosError or 'any'
    return Promise.reject(error);
  }
);