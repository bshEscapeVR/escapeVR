import getApi from '../api/axios';

const ENDPOINT = 'v1/upload';

const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await getApi().post(ENDPOINT, formData, {
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
