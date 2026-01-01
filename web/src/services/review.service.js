import httpService from './http.service';

const ENDPOINT = 'v1/reviews';

const reviewService = {
  // יצירת ביקורת חדשה
  create: async (reviewData) => {
    const response = await httpService.post(ENDPOINT, reviewData);
    return response.data;
  },

  // קבלת ביקורות (אפשר לסנן רק מאושרות)
  // usage: getAll({ approved: true })
  getAll: async (filters = {}) => {
    const response = await httpService.get(ENDPOINT, filters);
    return response.data;
  },

  // אישור/הסרה של ביקורת
  toggleApproval: async (id) => {
    const response = await httpService.patch(`${ENDPOINT}/${id}`);
    return response.data;
  },

  // מחיקת ביקורת
  remove: async (id) => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  }
};

export default reviewService;