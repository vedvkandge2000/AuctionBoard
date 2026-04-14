import api from './api';

// Public: no auth required
export const listOpenAuctions = async () => {
  const { data } = await api.get('/register/auctions');
  return data.auctions;
};

export const registerTeamOwner = async (payload) => {
  const { data } = await api.post('/register/team-owner', payload);
  return data;
};

export const registerPlayer = async (payload) => {
  const { data } = await api.post('/register/player', payload);
  return data;
};

export const applyAsPlayer = async (auctionId, payload) => {
  const { data } = await api.post('/register/player/apply', { auctionId, ...payload });
  return data;
};

export const getMyPlayerRegistrations = async () => {
  const { data } = await api.get('/register/player/my-registrations');
  return data.registrations;
};

// Admin: auction membership approvals
export const getPendingMemberships = async (status = 'pending') => {
  const { data } = await api.get(`/admin/memberships?status=${status}`);
  return data.memberships;
};

export const approveMembership = async (membershipId) => {
  const { data } = await api.post(`/admin/memberships/${membershipId}/approve`);
  return data.membership;
};

export const rejectMembership = async (membershipId, reason = '') => {
  const { data } = await api.post(`/admin/memberships/${membershipId}/reject`, { reason });
  return data.membership;
};

// Admin: player pool approvals
export const getPendingPlayers = async (status = 'pending') => {
  const { data } = await api.get(`/admin/pending-players?status=${status}`);
  return data.registrations;
};

export const approvePlayer = async (registrationId, { auctionId, setNumber = 1, category, basePrice } = {}) => {
  // auctionId is optional for account-linked registrations (server uses registration.auctionId)
  const payload = { setNumber, category, basePrice };
  if (auctionId) payload.auctionId = auctionId;
  const { data } = await api.post(`/admin/players/${registrationId}/approve`, payload);
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
