import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

// --- הוספת Interceptor (מיירט) ---
// כל בקשה שיוצאת מהאתר תעבור דרך הפונקציה הזו קודם
api.interceptors.request.use(
  (config) => {
    // 1. בדיקה האם יש טוקן שמור בדפדפן
    const token = localStorage.getItem('token');
    
    // 2. אם יש, צרף אותו לכותרות הבקשה (Headers)
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;