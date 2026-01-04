import axios from 'axios';

let apiInstance = null;

const API_BASE_URL = 'https://escapevr-server.onrender.com';

const getApi = () => {
    if (typeof window !== 'undefined') {
        console.log('API_URL:', API_BASE_URL);
    }

    if (!apiInstance) {
        apiInstance = axios.create({ baseURL: API_BASE_URL });

        apiInstance.interceptors.request.use(
            (config) => {
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem('token');
                    if (token) config.headers['x-auth-token'] = token;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }
    return apiInstance;
};

export default getApi;
