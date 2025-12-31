import api from '../api/axios';

// const API_URL = 'https://escapevr-server.onrender.com';

// פונקציות עזר גנריות
const httpService = {
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data; // מחזיר ישירות את הגוף של התשובה
    } catch (error) {
      console.error(`GET request failed for ${url}`, error);
      throw error;
    }
  },

  post: async (url, data) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`POST request failed for ${url}`, error);
      throw error;
    }
  },

  put: async (url, data) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed for ${url}`, error);
      throw error;
    }
  },

  patch: async (url, data) => {
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH request failed for ${url}`, error);
      throw error;
    }
  },

  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed for ${url}`, error);
      throw error;
    }
  },
};

export default httpService;