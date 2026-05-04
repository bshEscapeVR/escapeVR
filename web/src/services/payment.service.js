import httpService from './http.service';

const ENDPOINT = 'v1/payments';

const paymentService = {
  // Returns { formAction, fields } — the caller builds and submits the uPay form
  initiate: async (bookingId) => {
    return await httpService.post(`${ENDPOINT}/initiate/${bookingId}`);
  },
};

export default paymentService;
