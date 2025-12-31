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

// 👇 הנה הכתובת, צרובה בתוך הסרביס עצמו. אי אפשר לפספס את זה.
const SERVER_URL = 'https://escapevr-server.onrender.com';

// יצירת מופע מקומי - לא תלוי בשום קובץ חיצוני
const localApi = axios.create({
    baseURL: SERVER_URL
});

// הוספת טוקן (Interceptor מקומי)
localApi.interceptors.request.use((config) => {
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
    try {
      const response = await localApi.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`GET request failed for ${url}`, error);
      throw error;
    }
  },

  post: async (url, data) => {
    try {
      const response = await localApi.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`POST request failed for ${url}`, error);
      throw error;
    }
  },

  put: async (url, data) => {
    try {
      const response = await localApi.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed for ${url}`, error);
      throw error;
    }
  },

  patch: async (url, data) => {
    try {
      const response = await localApi.patch(url, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH request failed for ${url}`, error);
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const response = await localApi.delete(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed for ${url}`, error);
      throw error;
    }
  },
};

export default httpService;