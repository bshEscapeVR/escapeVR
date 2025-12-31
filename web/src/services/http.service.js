import api from '../api/axios'; // Keep for interceptor (token logic)

// Explicit base URL - forces all requests to absolute Render URL
const API_BASE = 'https://escapevr-server.onrender.com';

const httpService = {
  get: async (endpoint, params = {}) => {
    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`GET request failed for ${url}`, error);
      throw error;
    }
  },

  post: async (endpoint, data) => {
    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`POST request failed for ${url}`, error);
      throw error;
    }
  },

  put: async (endpoint, data) => {
    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed for ${url}`, error);
      throw error;
    }
  },

  patch: async (endpoint, data) => {
    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH request failed for ${url}`, error);
      throw error;
    }
  },

  delete: async (endpoint) => {
    const url = `${API_BASE}${endpoint}`;
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
