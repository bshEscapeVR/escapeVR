import api from '../api/axios'; // שימוש ישיר ב-axios לצורך הגדרות Header ספציפיות

const ENDPOINT = '/api/upload';

const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post(ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // השרת מחזיר { status: 'success', imageUrl: '...' }
      return response.data;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }
};

export default uploadService;