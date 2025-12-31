import httpService from './http.service';

const ENDPOINT = '/v1/stats'; 

const statsService = {
  getStats: async () => {
    return httpService.get(ENDPOINT);
  }
};

export default statsService;
