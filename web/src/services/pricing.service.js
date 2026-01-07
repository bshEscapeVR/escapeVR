import httpService from './http.service';

const ENDPOINT = 'v1/pricing';

const pricingService = {
    // קבלת כל תוכניות המחירים הפעילות (לאתר)
    getAll: async () => {
        const response = await httpService.get(ENDPOINT);
        return response.data;
    },

    // קבלת כל התוכניות כולל לא פעילות (לאדמין)
    getAllAdmin: async () => {
        const response = await httpService.get(`${ENDPOINT}/admin/all`);
        return response.data;
    },

    // קבלת תוכנית בודדת
    getById: async (id) => {
        const response = await httpService.get(`${ENDPOINT}/${id}`);
        return response.data;
    },

    // יצירת תוכנית חדשה (אדמין)
    create: async (planData) => {
        const response = await httpService.post(ENDPOINT, planData);
        return response.data;
    },

    // עדכון תוכנית (אדמין)
    update: async (id, planData) => {
        const response = await httpService.patch(`${ENDPOINT}/${id}`, planData);
        return response.data;
    },

    // מחיקת תוכנית (אדמין)
    remove: async (id) => {
        return await httpService.delete(`${ENDPOINT}/${id}`);
    },

    // שינוי סדר התוכניות (אדמין)
    reorder: async (orderedIds) => {
        const response = await httpService.patch(`${ENDPOINT}/admin/reorder`, { orderedIds });
        return response.data;
    }
};

export default pricingService;
