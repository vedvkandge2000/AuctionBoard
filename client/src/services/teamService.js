import api from './api';

export const listTeams = async (auctionId) => {
  const { data } = await api.get(`/auctions/${auctionId}/teams`);
  return data.teams;
};

export const createTeam = async (auctionId, payload) => {
  const { data } = await api.post(`/auctions/${auctionId}/teams`, payload);
  return data.team;
};

export const updateTeam = async (auctionId, teamId, payload) => {
  const { data } = await api.patch(`/auctions/${auctionId}/teams/${teamId}`, payload);
  return data.team;
};

export const deleteTeam = async (auctionId, teamId) => {
  const { data } = await api.delete(`/auctions/${auctionId}/teams/${teamId}`);
  return data;
};

export const getSquad = async (auctionId, teamId) => {
  const { data } = await api.get(`/auctions/${auctionId}/teams/${teamId}/squad`);
  return data.team;
};

export const listTeamsWithSquads = async (auctionId) => {
  const { data } = await api.get(`/auctions/${auctionId}/teams?squads=1`);
  return data.teams;
};

export const exerciseRTM = async (auctionId, teamId) => {
  const { data } = await api.post(`/auctions/${auctionId}/teams/${teamId}/rtm`);
  return data;
};
