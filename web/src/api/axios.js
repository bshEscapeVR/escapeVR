import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
});

// Interceptor for auth token
api.interceptors.request.use(
  (reqConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        reqConfig.headers['x-auth-token'] = token;
      }
    }
    return reqConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
