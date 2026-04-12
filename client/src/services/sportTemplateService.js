import api from './api';

export const listSportTemplates = async () => {
  const { data } = await api.get('/sport-templates');
  return data.templates;
};

export const getSportTemplate = async (id) => {
  const { data } = await api.get(`/sport-templates/${id}`);
  return data.template;
};

export const createSportTemplate = async (payload) => {
  const { data } = await api.post('/sport-templates', payload);
  return data.template;
};

export const updateSportTemplate = async (id, payload) => {
  const { data } = await api.patch(`/sport-templates/${id}`, payload);
  return data.template;
};

export const deleteSportTemplate = async (id) => {
  await api.delete(`/sport-templates/${id}`);
};

export const cloneSportTemplate = async (id) => {
  const { data } = await api.post(`/sport-templates/${id}/clone`);
  return data.template;
};
