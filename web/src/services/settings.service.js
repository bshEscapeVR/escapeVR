import httpService from './http.service';

const ENDPOINT = '/api/settings';

const settingsService = {
  // קבלת הגדרות
  get: async () => {
    const response = await httpService.get(ENDPOINT);
    return response.data;
  },

  // עדכון הגדרות (אדמין)
  update: async (settingsData) => {
    const response = await httpService.put(ENDPOINT, settingsData);
    return response.data;
  }
};

export default settingsService;