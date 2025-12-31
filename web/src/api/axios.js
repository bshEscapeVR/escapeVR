import axios from 'axios';

// כתובת השרת קבועה
const API_URL = 'https://escapevr-server.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;