// import api from '../api/axios';

// // const API_URL = 'https://escapevr-server.onrender.com';

// // פונקציות עזר גנריות
// const httpService = {
//   get: async (url, params = {}) => {
//     try {
//       const response = await api.get(url, { params });
//       return response.data; // מחזיר ישירות את הגוף של התשובה
//     } catch (error) {
//       console.error(`GET request failed for ${url}`, error);
//       throw error;
//     }
//   },

//   post: async (url, data) => {
//     try {
//       const response = await api.post(url, data);
//       return response.data;
//     } catch (error) {
//       console.error(`POST request failed for ${url}`, error);
//       throw error;
//     }
//   },

//   put: async (url, data) => {
//     try {
//       const response = await api.put(url, data);
//       return response.data;
//     } catch (error) {
//       console.error(`PUT request failed for ${url}`, error);
//       throw error;
//     }
//   },

//   patch: async (url, data) => {
//     try {
//       const response = await api.patch(url, data);
//       return response.data;
//     } catch (error) {
//       console.error(`PATCH request failed for ${url}`, error);
//       throw error;
//     }
//   },

//   delete: async (url) => {
//     try {
//       const response = await api.delete(url);
//       return response.data;
//     } catch (error) {
//       console.error(`DELETE request failed for ${url}`, error);
//       throw error;
//     }
//   },
// };

// export default httpService;

import axios from 'axios';

// כתובת השרת הקבועה
const SERVER_URL = 'https://escapevr-server.onrender.com';

// 👇 הלוג הזה יופיע לך בקונסול (F12) באתר ויגיד לנו את האמת
console.log('%c [HTTP SERVICE] Initialized with URL:', 'color: green; font-size: 20px;', SERVER_URL);

const api = axios.create({
    baseURL: SERVER_URL
});

api.interceptors.request.use((config) => {
    // לוג נוסף לכל בקשה שיוצאת
    console.log(`[HTTP Request] ${config.method.toUpperCase()} -> ${config.baseURL}${config.url}`);
    
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
    }
    return config;
});

const httpService = {
  get: async (url, params = {}) => {
    const res = await api.get(url, { params });
    return res.data;
  },
  post: async (url, data) => {
    const res = await api.post(url, data);
    return res.data;
  },
  put: async (url, data) => {
    const res = await api.put(url, data);
    return res.data;
  },
  patch: async (url, data) => {
    const res = await api.patch(url, data);
    return res.data;
  },
  delete: async (url) => {
    const res = await api.delete(url);
    return res.data;
  }
};

export default httpService;