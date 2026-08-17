import axios from 'axios';

const baseUrlStr = import.meta.env.VITE_API_URL || '';
const api = axios.create({
  baseURL: baseUrlStr.endsWith('/api') ? baseUrlStr : `${baseUrlStr.replace(/\/$/, '')}/api`,
});

// Interceptor: adjunta el JWT a cada petición
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: redirige al login si el token expira (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
