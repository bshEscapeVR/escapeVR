// import axios from 'axios';

// // Debug: Log API URL on load
// console.log('Current API URL:', process.env.NEXT_PUBLIC_API_URL);
// console.log('REBUILD CHECK - API URL:', process.env.NEXT_PUBLIC_API_URL);
// const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// const api = axios.create({ baseURL });

// // --- הוספת Interceptor (מיירט) ---
// // כל בקשה שיוצאת מהאתר תעבור דרך הפונקציה הזו קודם
// api.interceptors.request.use(
//   (config) => {
//     // 1. בדיקה האם יש טוקן שמור בדפדפן
//     const token = localStorage.getItem('token');
    
//     // 2. אם יש, צרף אותו לכותרות הבקשה (Headers)
//     if (token) {
//       config.headers['x-auth-token'] = token;
//     }
    
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from 'axios';

// Create axios instance without baseURL
const api = axios.create();

// Interceptor to prepend API URL to every request
api.interceptors.request.use(
  (config) => {
    // Force the full URL for every request
    const API_SERVER = ['https:', '', 'escapevr-server.onrender.com'].join('/');

    if (config.url && !config.url.startsWith('http')) {
      config.url = API_SERVER + config.url;
    }

    // Add auth token if exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['x-auth-token'] = token;
      }
    }

    console.log('📡 Request URL:', config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;