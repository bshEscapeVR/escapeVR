import httpService from './http.service';

const ENDPOINT = '/api/leads';

const leadService = {
  // יצירת ליד חדש (מטופס צור קשר)
  create: async (leadData) => {
    const response = await httpService.post(ENDPOINT, leadData);
    return response.data;
  },

  // קבלת כל הלידים (אדמין)
  getAll: async () => {
    const response = await httpService.get(ENDPOINT);
    return response.data;
  },

  // עדכון סטטוס (חדש/טופל)
  updateStatus: async (id, status) => {
    const response = await httpService.patch(`${ENDPOINT}/${id}`, { status });
    return response.data;
  },

  // מחיקת ליד
  remove: async (id) => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  }
};

export default leadService;