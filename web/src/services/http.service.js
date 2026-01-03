import getApi from '../api/axios';

const httpService = {
  get: async (endpoint, params = {}) => {
    try {
      const response = await getApi().get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`GET request failed for ${endpoint}`, error);
      throw error;
    }
  },

  post: async (endpoint, data) => {
    try {
      const response = await getApi().post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`POST request failed for ${endpoint}`, error);
      throw error;
    }
  },

  put: async (endpoint, data) => {
    try {
      const response = await getApi().put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`PUT request failed for ${endpoint}`, error);
      throw error;
    }
  },

  patch: async (endpoint, data) => {
    try {
      const response = await getApi().patch(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`PATCH request failed for ${endpoint}`, error);
      throw error;
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await getApi().delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`DELETE request failed for ${endpoint}`, error);
      throw error;
    }
  },
};

export default httpService;
