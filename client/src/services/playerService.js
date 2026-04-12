import api from './api';

export const listPlayers = async (auctionId, params = {}) => {
  const { data } = await api.get(`/auctions/${auctionId}/players`, { params });
  return data.players;
};

export const addPlayer = async (auctionId, payload) => {
  const { data } = await api.post(`/auctions/${auctionId}/players`, payload);
  return data.player;
};

export const updatePlayer = async (auctionId, playerId, payload) => {
  const { data } = await api.patch(`/auctions/${auctionId}/players/${playerId}`, payload);
  return data.player;
};

export const deletePlayer = async (auctionId, playerId) => {
  const { data } = await api.delete(`/auctions/${auctionId}/players/${playerId}`);
  return data;
};

export const bulkImportPlayers = async (auctionId, file) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/auctions/${auctionId}/players/bulk`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const downloadTemplate = (auctionId) => {
  window.open(`/api/auctions/${auctionId}/players/template`, '_blank');
};
