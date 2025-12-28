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

// Debug: Verify this file loaded (check browser console)
console.log('🚀 Axios Build Check:', Date.now());

const api = axios.create({
  baseURL: 'https://escapevr-server.onrender.com',
});

// Log the actual baseURL after creation
console.log('📡 Axios baseURL is:', api.defaults.baseURL);

// Interceptor להוספת הטוקן
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