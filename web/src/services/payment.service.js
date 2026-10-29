import httpService from './http.service';

const ENDPOINT = 'v1/payments';

const paymentService = {
  // דף האישור: השרת בודק מול Sumit אם ההזמנה שולמה → { status, paymentStatus }
  verify: async (bookingId, paymentId) => {
    const response = await httpService.post(`${ENDPOINT}/sumit/verify`, { bookingId, paymentId });
    return response.data;
  },

  // הלקוח לחץ "ביטול" בדף התשלום - השעה משתחררת מיד → { status, paymentStatus }
  cancel: async (bookingId) => {
    const response = await httpService.post(`${ENDPOINT}/sumit/cancel`, { bookingId });
    return response.data;
  },

  // הלקוח יצא מדף התשלום - דף תשלום חדש כל עוד השעה שמורה לו → { paymentUrl }
  retry: async (bookingId, lang) => {
    const response = await httpService.post(`${ENDPOINT}/sumit/retry`, { bookingId, lang });
    return response.data;
  },

  // אדמין: האם מפתחות Sumit מוגדרים בשרת → { sumitConfigured }
  getStatus: async () => {
    const response = await httpService.get(`${ENDPOINT}/status`);
    return response.data;
  },
};

export default paymentService;
