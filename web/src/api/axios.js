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

    if (!apiInstance) {
        apiInstance = axios.create({ baseURL });

        // Request interceptor - הוספת טוקן לכל בקשה
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

        // Response interceptor - טיפול בטוקן שפג תוקף
        apiInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                // אם קיבלנו 401 (Unauthorized) - הטוקן פג תוקף או לא תקין
                if (error.response?.status === 401 && typeof window !== 'undefined') {
                    // בדיקה אם אנחנו בעמוד אדמין (לא נפעיל logout בעמודים ציבוריים)
                    const isAdminPage = window.location.pathname.includes('/admin/');
                    const isLoginPage = window.location.pathname.includes('/admin/login');

                    if (isAdminPage && !isLoginPage) {
                        // מחיקת הטוקן
                        localStorage.removeItem('token');

                        // חילוץ השפה מה-URL
                        const pathParts = window.location.pathname.split('/');
                        const lang = pathParts[1] || 'he';

                        // הפניה לדף הלוגין
                        window.location.href = `/${lang}/admin/login`;
                    }
                }
                return Promise.reject(error);
            }
        );
    }
    return apiInstance;
};

export default getApi;
