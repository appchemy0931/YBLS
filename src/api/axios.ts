import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const token = JSON.parse(userInfo).token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const err = new Error(message);
    (err as Error & { status?: number }).status = status;

    // If the token is invalid/expired, clear the persisted session so the app
    // treats the user as logged out on the next reload / navigation.
    if (status === 401) {
      localStorage.removeItem('userInfo');
    }

    return Promise.reject(err);
  }
);

export default api;
