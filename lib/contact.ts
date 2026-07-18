import api from './api';

export const contact = {
  async send(data: { name: string; email: string; subject: string; message: string }) {
    const { data: response } = await api.post('/contact', data);
    return response;
  },
};
