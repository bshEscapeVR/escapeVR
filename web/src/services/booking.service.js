import httpService from './http.service';

const ENDPOINT = 'v1/bookings';

const bookingService = {
  // קבלת כל ההזמנות (אדמין)
  getAll: async () => {
    const response = await httpService.get(`${ENDPOINT}/all`);
    return response.data;
  },

  // בדיקת זמינות (סלוטים פנויים - עכשיו כולל גם שבת וחגים!)
  getAvailableSlots: async (roomId, date) => {
    const response = await httpService.get(`${ENDPOINT}/slots`, { roomId, date });
    return response.data;
  },

  // יצירת הזמנה חדשה
  create: async (bookingData) => {
    const response = await httpService.post(ENDPOINT, bookingData);
    return response.data;
  },

  // עדכון הזמנה קיימת
  update: async (id, bookingData) => {
    const response = await httpService.patch(`${ENDPOINT}/${id}`, bookingData);
    return response.data;
  },

  // מחיקה רכה (העברה לפח)
  remove: async (id) => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  },

  // --- ניהול פח (Trash) ---

  // קבלת הזמנות מחוקות
  getTrash: async () => {
    const response = await httpService.get(`${ENDPOINT}/trash`);
    return response.data;
  },

  // שחזור הזמנה מהפח
  restore: async (id) => {
    const response = await httpService.patch(`${ENDPOINT}/trash/${id}/restore`);
    return response.data;
  },

  // מחיקה לצמיתות
  permanentDelete: async (id) => {
    return await httpService.delete(`${ENDPOINT}/trash/${id}/permanent`);
  },

  // ריקון הפח
  emptyTrash: async () => {
    const response = await httpService.delete(`${ENDPOINT}/trash/empty`);
    return response.data;
  },

  // --- ניהול חסימות ---

  // קבלת רשימת חסימות עתידיות
  getBlockedDates: async () => {
    const response = await httpService.get(`${ENDPOINT}/blocked-dates`);
    return response.data;
  },

  // חסימת תאריך
  blockDate: async (data) => {
    // data = { date: '2025-05-20', reason: 'Renovation', isFullDay: true }
    const response = await httpService.post(`${ENDPOINT}/blocked-dates`, data);
    return response.data;
  },

  // הסרת חסימה
  removeBlock: async (id) => {
    return await httpService.delete(`${ENDPOINT}/blocked-dates/${id}`);
  }
};

export default bookingService;