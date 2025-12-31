import axios from 'axios';

// 👇 כתיבה קשיחה של הכתובת. זה עוקף את כל הבעיות של Vercel.
const PRODUCTION_URL = 'https://escapevr-server.onrender.com';

const api = axios.create({
  baseURL: PRODUCTION_URL,
});

// Interceptor להוספת הטוקן (נשאר אותו דבר)
api.interceptors.request.use(
  (config) => {
    // בדיקה שאנחנו בצד לקוח (דפדפן)
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