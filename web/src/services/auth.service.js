import httpService from './http.service';

const ENDPOINT = '/api/auth';

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

  // בדיקה האם מחובר
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // קבלת הטוקן
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;