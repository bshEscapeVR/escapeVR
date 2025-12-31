import axios from 'axios';

// משתמש במשתנה הסביבה, ואם אין - ברירת מחדל לשרת בענן
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://escapevr-server.onrender.com';

console.log('=== AXIOS DEBUG ===');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('baseURL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;