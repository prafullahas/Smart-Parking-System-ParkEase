import axios from 'axios';

const resolveBaseURL = () => {
  const envBaseURL = import.meta.env.VITE_API_BASE_URL;
  if (envBaseURL && envBaseURL.trim()) {
    return envBaseURL.trim();
  }

  // Dev: same-origin `/api` → Vite proxy → backend (see vite.config.js; default PORT is 5002 in server.js).
  // Override with VITE_API_BASE_URL if your API runs elsewhere.
  return '/api';
};

// Create an axios instance
const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        response: {
          status: 0,
          data: {
            success: false,
            message: 'Network error. Please check your connection and try again.'
          }
        }
      });
    }

    // Handle 401 unauthorized (but not failed login/signup — those should show inline errors)
    if (error.response?.status === 401) {
      const reqUrl = error.config?.url || '';
      const isPublicAuth =
        reqUrl.includes('/auth/login') ||
        reqUrl.includes('/auth/signup') ||
        reqUrl.includes('/auth/send-email-otp') ||
        reqUrl.includes('/auth/verify-email-otp') ||
        reqUrl.includes('/auth/resend-email-otp');
      if (!isPublicAuth) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;