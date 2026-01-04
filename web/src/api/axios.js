import axios from 'axios';

let apiInstance = null;

/**
 * Lazy-initialized Axios instance.
 * This ensures Axios is NEVER initialized during server-side rendering/build,
 * preventing configuration mismatches between server and client.
 */
const getApi = () => {
    // Hardcoded URL as ultimate fallback (prevents localhost fallback on Vercel)
const API_URL = 'https://escapevr-server.onrender.com';
    if (!apiInstance) {
        apiInstance = axios.create({ baseURL: API_URL });

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
