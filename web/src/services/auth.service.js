import httpService from './http.service';

const ENDPOINT = 'v1/auth';

const authService = {
  // התחברות
  login: async (username, password) => {
    const response = await httpService.post(`${ENDPOINT}/login`, { username, password });

    // אם ההתחברות הצליחה, נשמור את הטוקן
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  // התנתקות
  logout: () => {
    localStorage.removeItem('token');
  },

  // בדיקה האם מחובר (בדיקה מקומית בלבד)
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // קבלת הטוקן
  getToken: () => {
    return localStorage.getItem('token');
  },

  // בדיקת תוקף הטוקן מול השרת
  verifyToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      await httpService.get(`${ENDPOINT}/verify`);
      return true;
    } catch (error) {
      // אם הטוקן לא תקין, נמחק אותו
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
      }
      return false;
    }
  }
};

export default authService;