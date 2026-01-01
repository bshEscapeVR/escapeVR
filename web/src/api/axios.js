import axios from 'axios';

// Debug: Log the API URL being used
console.log('🔌 Client API URL:', process.env.NEXT_PUBLIC_API_URL);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// CRITICAL: Throw error if missing during build/runtime to prevent silent failures
if (!API_BASE_URL) {
    throw new Error('CRITICAL CONFIG ERROR: NEXT_PUBLIC_API_URL is missing!');
}

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) config.headers['x-auth-token'] = token;
    }
    return config;
}, (error) => Promise.reject(error));

export default api;
