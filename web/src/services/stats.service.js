import httpService from './http.service';

const ENDPOINT = '/api/stats'; 

const statsService = {
  getStats: async () => {
    return httpService.get(ENDPOINT);
  }
};

export default statsService;
