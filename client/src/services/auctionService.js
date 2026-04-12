import api from './api';

export const listAuctions = async () => {
  const { data } = await api.get('/auctions');
  return data.auctions;
};

export const getAuction = async (id) => {
  const { data } = await api.get(`/auctions/${id}`);
  return data.auction;
};

export const createAuction = async (payload) => {
  const { data } = await api.post('/auctions', payload);
  return data.auction;
};

export const updateAuctionConfig = async (id, payload) => {
  const { data } = await api.patch(`/auctions/${id}/config`, payload);
  return data.auction;
};

export const deleteAuction = async (id) => {
  const { data } = await api.delete(`/auctions/${id}`);
  return data;
};

export const getAuctionOrder = async (id) => {
  const { data } = await api.get(`/auctions/${id}/order`);
  return data.order;
};

export const setAuctionOrder = async (id, playerIds) => {
  const { data } = await api.patch(`/auctions/${id}/order`, { playerIds });
  return data.order;
};

// Flow control
export const startAuction = async (id) => api.post(`/auctions/${id}/start`);
export const pauseAuction = async (id) => api.post(`/auctions/${id}/pause`);
export const resumeAuction = async (id) => api.post(`/auctions/${id}/resume`);
export const endAuction = async (id) => api.post(`/auctions/${id}/end`);
export const nextPlayer = async (id) => api.post(`/auctions/${id}/next-player`);
export const markSold = async (id) => api.post(`/auctions/${id}/sold`);
export const markUnsold = async (id) => api.post(`/auctions/${id}/unsold`);
export const overrideBid = async (id, teamId, amount) =>
  api.post(`/auctions/${id}/override-bid`, { teamId, amount });
