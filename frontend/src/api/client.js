import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL });

// Attach JWT from localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error || err.message || 'Something went wrong';
    err.userMessage = message;
    return Promise.reject(err);
  }
);
