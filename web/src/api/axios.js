// import axios from 'axios';

// const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// console.log('🔌 Axios Base URL:', process.env.NEXT_PUBLIC_API_URL);

// const api = axios.create({
//   baseURL,
// });

// api.interceptors.request.use(
//   (config) => {
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('token');
//       if (token) config.headers['x-auth-token'] = token;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default api;
import axios from 'axios';

// משאירים את זה לגיבוי, אבל נדרוס את זה בהמשך
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

console.log('🔌 Initial Load - API URL:', process.env.NEXT_PUBLIC_API_URL); // לוג לבדיקה

const api = axios.create({
  baseURL,
  // מגדירים Timeout כדי שלא ייתקע לנצח אם השרת ישן
  timeout: 10000, 
});

api.interceptors.request.use(
  (config) => {
    // --- התיקון הקריטי ---
    // אנחנו בודקים את המשתנה שוב בזמן אמת, ממש לפני שהבקשה יוצאת
    // זה פותר מקרים שבהם המשתנה לא היה מוכן בטעינת הקובץ הראשונית
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
       config.baseURL = process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) config.headers['x-auth-token'] = token;
    }
    
    // לוג שיעזור לך להבין לאן הבקשה יוצאת באמת
    // console.log(`🚀 Requesting: ${config.baseURL}/${config.url}`); 
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;