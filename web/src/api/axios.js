import axios from 'axios';

// 👇 אנחנו כותבים את הכתובת קשיח כדי למנוע את בעיית ה-Hydration
const SERVER_URL = 'https://escapevr-server.onrender.com';

const api = axios.create({
  baseURL: SERVER_URL,
});

// Interceptor - נשאר כרגיל כדי לנהל את הטוקן
api.interceptors.request.use(
  (config) => {
    // בדיקה שאנחנו בצד לקוח לפני שנוגעים ב-localStorage
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