// import axios from 'axios';

// // Debug: Log the API URL being used
// console.log('🔌 Client API URL:', process.env.NEXT_PUBLIC_API_URL);

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// // CRITICAL: Throw error if missing during build/runtime to prevent silent failures
// if (!API_BASE_URL) {
//     throw new Error('CRITICAL CONFIG ERROR: NEXT_PUBLIC_API_URL is missing!');
// }

// const api = axios.create({
//     baseURL: API_BASE_URL,
// });

// api.interceptors.request.use((config) => {
//     if (typeof window !== 'undefined') {
//         const token = localStorage.getItem('token');
//         if (token) config.headers['x-auth-token'] = token;
//     }
//     return config;
// }, (error) => Promise.reject(error));

// export default api;
import axios from 'axios';

// 👇 כתובת השרת הקבועה שלנו
const API_BASE_URL = 'https://escapevr-server.onrender.com';

// פונקציה שתבנה את ה-URL המלא לכל קריאה
const buildUrl = (path) => {
  // ודאי שה-path תמיד מתחיל ב־"/"
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

// יצירת instance של axios
const api = axios.create({
  baseURL: API_BASE_URL, // baseURL עדיין חשוב למקרים של relative paths
});

// Interceptor להוספת token אם קיים
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['x-auth-token'] = token;
      }
    }

    // ודא שה-path הנשלח הוא מלא
    if (config.url && !config.url.startsWith('http')) {
      config.url = buildUrl(config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
