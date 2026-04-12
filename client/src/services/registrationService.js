import api from './api';

// Public: no auth required
export const registerTeamOwner = async (payload) => {
  const { data } = await api.post('/register/team-owner', payload);
  return data;
};

export const registerPlayer = async (payload) => {
  const { data } = await api.post('/register/player', payload);
  return data;
};

// Admin: approval management
export const getPendingUsers = async (status = 'pending') => {
  const { data } = await api.get(`/admin/pending-users?status=${status}`);
  return data.users;
};

export const approveUser = async (userId) => {
  const { data } = await api.post(`/admin/users/${userId}/approve`);
  return data.user;
};

export const rejectUser = async (userId) => {
  const { data } = await api.post(`/admin/users/${userId}/reject`);
  return data.user;
};

export const getPendingPlayers = async (status = 'pending') => {
  const { data } = await api.get(`/admin/pending-players?status=${status}`);
  return data.registrations;
};

export const approvePlayer = async (registrationId, auctionId, setNumber = 1) => {
  const { data } = await api.post(`/admin/players/${registrationId}/approve`, { auctionId, setNumber });
  return data;
};

export const rejectPlayer = async (registrationId, reason = '') => {
  const { data } = await api.post(`/admin/players/${registrationId}/reject`, { reason });
  return data.registration;
};

export const getApprovedOwners = async () => {
  const { data } = await api.get('/admin/approved-owners');
  return data.users;
};
