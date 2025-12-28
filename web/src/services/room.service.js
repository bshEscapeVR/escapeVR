import httpService from './http.service';

const ENDPOINT = '/api/rooms';

const roomService = {
  // קבלת כל החדרים
  getAll: async () => {
    // ה-httpService כבר מחזיר את res.data, אז אנחנו מקבלים את האובייקט { status, data, ... }
    const response = await httpService.get(ENDPOINT);
    return response.data; // מחזיר רק את המערך של החדרים
  },

  // קבלת חדר לפי מזהה
  getById: async (id) => {
    const response = await httpService.get(`${ENDPOINT}/${id}`);
    return response.data;
  },

  // יצירת חדר (אדמין)
  create: async (roomData) => {
    const response = await httpService.post(ENDPOINT, roomData);
    return response.data;
  },

  // עדכון חדר (אדמין)
  update: async (id, roomData) => {
    const response = await httpService.patch(`${ENDPOINT}/${id}`, roomData);
    return response.data;
  },

  // מחיקת חדר (אדמין)
  remove: async (id) => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  }
};

export default roomService;