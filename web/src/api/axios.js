import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Fail build if env var is missing (Safety Check)
if (!API_BASE_URL) {
    console.error('CRITICAL: NEXT_PUBLIC_API_URL is not defined!');
    // In production build, we might want to throw, but for now log error
}

const api = axios.create({
    baseURL: API_BASE_URL || 'http://localhost:5000', // Fallback for local dev only
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) config.headers['x-auth-token'] = token;
    }
    return config;
}, (error) => Promise.reject(error));

export default api;
