import api from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const register = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

// Get team for a specific auction
export const getMyTeam = async (auctionId) => {
  const { data } = await api.get('/auth/me/team', { params: auctionId ? { auctionId } : {} });
  return auctionId ? data.team : (data.teams || []);
};

// Get all teams across all auctions (for MySquadPage)
export const getMyTeams = async () => {
  const { data } = await api.get('/auth/me/team');
  return data.teams || [];
};

export const updateMe = async (payload) => {
  const { data } = await api.patch('/auth/me', payload);
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await api.post('/auth/me/change-password', payload);
  return data;
};

export const deleteMe = async (password) => {
  const { data } = await api.delete('/auth/me', { data: { password } });
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password, confirmPassword) => {
  const { data } = await api.post(`/auth/reset-password/${token}`, { password, confirmPassword });
  return data;
};
