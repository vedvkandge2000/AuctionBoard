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

// Browse all open auctions (with membership status for team_owners)
export const browseAuctions = async () => {
  const { data } = await api.get('/auctions/browse');
  return data.auctions;
};

// Membership calls (team_owner)
export const applyToAuction = async (auctionId) => {
  const { data } = await api.post('/memberships', { auctionId });
  return data.membership;
};

export const getMyMemberships = async () => {
  const { data } = await api.get('/memberships/mine');
  return data.memberships;
};

export const withdrawMembership = async (membershipId) => {
  const { data } = await api.delete(`/memberships/${membershipId}`);
  return data;
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
export const advanceRound = async (id) =>
  api.post(`/auctions/${id}/advance-round`);

export const setOfflineBid = async (id, teamId, amount) =>
  api.post(`/auctions/${id}/offline-bid`, { teamId, amount });

export const releasePlayerDirect = async (auctionId, playerId) =>
  api.post(`/auctions/${auctionId}/players/${playerId}/release`);

// Release request flow
export const requestRelease = async (id, playerId, reason = '') =>
  api.post(`/auctions/${id}/release-requests`, { playerId, reason });
export const listReleaseRequests = async (id, status = 'pending') => {
  const { data } = await api.get(`/auctions/${id}/release-requests`, { params: { status } });
  return data.requests;
};
export const approveReleaseRequest = async (id, reqId) =>
  api.post(`/auctions/${id}/release-requests/${reqId}/approve`);
export const rejectReleaseRequest = async (id, reqId, rejectionNote = '') =>
  api.post(`/auctions/${id}/release-requests/${reqId}/reject`, { rejectionNote });

export const getAuctionReport = async (id) => {
  const { data } = await api.get(`/auctions/${id}/report`);
  return data;
};
