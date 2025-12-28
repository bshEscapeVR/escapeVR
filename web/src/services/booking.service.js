import httpService from './http.service';

const ENDPOINT = '/api/bookings';

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

  // מחיקת הזמנה
  remove: async (id) => {
    return await httpService.delete(`${ENDPOINT}/${id}`);
  },

  // --- 👇 חדש: ניהול חסימות ---

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