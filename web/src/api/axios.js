import axios from 'axios';

let apiInstance = null;

// Prefer explicit URL, but guard against accidental whitespace/newlines in builds.
// If it resolves to an empty/whitespace string, fall back to the Render API.
const API_BASE_URL_RAW = process.env.NEXT_PUBLIC_API_URL;
const FALLBACK_API_BASE_URL = 'https://escapevr-server.onrender.com';

const resolveApiBaseUrl = () => {
    const candidate = typeof API_BASE_URL_RAW === 'string' ? API_BASE_URL_RAW.trim() : '';
    return candidate ? candidate : FALLBACK_API_BASE_URL;
};

/**
 * Lazy-initialized Axios instance.
 * This ensures Axios is NEVER initialized during server-side rendering/build,
 * preventing configuration mismatches between server and client.
 */
const getApi = () => {
    const baseURL = resolveApiBaseUrl();

    // Debug log - remove after fixing
    if (typeof window !== 'undefined') {
        console.log(`🔍 API_URL: ${String(baseURL)}`);
    }

    if (!apiInstance) {
        apiInstance = axios.create({ baseURL });

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
