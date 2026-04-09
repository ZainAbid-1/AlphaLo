// frontend/src/services/api.ts
import axios, { AxiosError } from 'axios';
import { supabase } from './supabaseClient'; // Import your new client

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Interceptor to automatically attach the Supabase JWT token
api.interceptors.request.use(
  async (config: any) => {
    // Ask Supabase for the current logged-in session
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);