import axios from 'axios';

// משתמש במשתנה הסביבה, ואם אין - ברירת מחדל למקומי
const baseURL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: baseURL,
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