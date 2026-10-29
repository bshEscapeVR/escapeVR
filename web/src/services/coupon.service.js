import httpService from './http.service';

const ENDPOINT = 'v1/coupons';

const couponService = {
    // בדיקת קוד מחלון ההזמנה: { valid, reason?, discount, basePrice, finalPrice }
    validate: async ({ code, participantsCount, phone }) => {
        const response = await httpService.post(`${ENDPOINT}/validate`, { code, participantsCount, phone });
        return response.data;
    },

    // --- אדמין ---

    getAll: async () => {
        const response = await httpService.get(ENDPOINT);
        return response.data;
    },

    create: async (couponData) => {
        const response = await httpService.post(ENDPOINT, couponData);
        return response.data;
    },

    update: async (id, couponData) => {
        const response = await httpService.patch(`${ENDPOINT}/${id}`, couponData);
        return response.data;
    },

    remove: async (id) => {
        return await httpService.delete(`${ENDPOINT}/${id}`);
    },

    // --- סדרות קופונים לשותף / מועדון ---

    // { campaign, prefix, count, type, value, expiresAt?, minParticipants?, maxUses?, oncePerCustomer? }
    createBatch: async (batchData) => {
        const response = await httpService.post(`${ENDPOINT}/batch`, batchData);
        return response.data;
    },

    // כל הקודים בסדרה + ההזמנות שהשתמשו בכל קוד
    getCampaignReport: async (name) => {
        const response = await httpService.get(`${ENDPOINT}/campaign`, { name });
        return response.data;
    },

    setCampaignActive: async (name, isActive) => {
        const response = await httpService.patch(`${ENDPOINT}/campaign?name=${encodeURIComponent(name)}`, { isActive });
        return response.data;
    },

    removeCampaign: async (name) => {
        return await httpService.delete(`${ENDPOINT}/campaign?name=${encodeURIComponent(name)}`);
    }
};

export default couponService;
