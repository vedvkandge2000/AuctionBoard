const request = require('supertest');

// Mock Socket.io — player operations may trigger auction state events
jest.mock('../../src/config/socket', () => ({
  getIO: () => ({ to: () => ({ emit: () => {} }) }),
}));

const app = require('../../src/app');
const testDb = require('../../src/config/testDb');
const { createAdminUser, createTeamOwnerUser, getAuthHeader, createAuction, createPlayer } = require('../helpers/fixtures');

let admin, owner, adminHeader, ownerHeader, auction;

beforeAll(async () => { await testDb.connect(); });
beforeEach(async () => {
  await testDb.clear();
  admin = await createAdminUser();
  owner = await createTeamOwnerUser();
  adminHeader = getAuthHeader(admin);
  ownerHeader = getAuthHeader(owner);
  auction = await createAuction(admin._id);
});
afterAll(async () => { await testDb.disconnect(); });

describe('POST /api/auctions/:id/players', () => {
  test('admin adds a player', async () => {
    const res = await request(app).post(`/api/auctions/${auction._id}/players`).set(adminHeader)
      .send({ name: 'Virat Kohli', role: 'Batsman', basePrice: 200, nationality: 'domestic' });
    expect(res.status).toBe(201);
    expect(res.body.player.name).toBe('Virat Kohli');
  });

  test('non-admin is rejected', async () => {
    const res = await request(app).post(`/api/auctions/${auction._id}/players`).set(ownerHeader)
      .send({ name: 'Player X', role: 'Batsman', basePrice: 100 });
    expect(res.status).toBe(403);
  });

  test('player is added to auctionOrder', async () => {
    const Auction = require('../../src/models/Auction');
    await request(app).post(`/api/auctions/${auction._id}/players`).set(adminHeader)
      .send({ name: 'Player A', role: 'Bowler', basePrice: 50 });
    const updated = await Auction.findById(auction._id);
    expect(updated.auctionOrder.length).toBe(1);
  });

  test('missing basePrice → validation error', async () => {
    const res = await request(app).post(`/api/auctions/${auction._id}/players`).set(adminHeader)
      .send({ name: 'No Price', role: 'Batsman' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('PATCH /api/auctions/:id/players/:pid', () => {
  test('admin updates player', async () => {
    const player = await createPlayer(auction._id);
    const res = await request(app).patch(`/api/auctions/${auction._id}/players/${player._id}`).set(adminHeader)
      .send({ basePrice: 300 });
    expect(res.status).toBe(200);
    expect(res.body.player.basePrice).toBe(300);
  });

  test('returns 404 for unknown player', async () => {
    const res = await request(app).patch(`/api/auctions/${auction._id}/players/000000000000000000000000`).set(adminHeader)
      .send({ basePrice: 100 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/auctions/:id/players/:pid', () => {
  test('admin deletes a pool player', async () => {
    const player = await createPlayer(auction._id);
    const res = await request(app).delete(`/api/auctions/${auction._id}/players/${player._id}`).set(adminHeader);
    expect(res.status).toBe(200);
  });

  test('cannot delete a sold player', async () => {
    const player = await createPlayer(auction._id, { status: 'sold' });
    const res = await request(app).delete(`/api/auctions/${auction._id}/players/${player._id}`).set(adminHeader);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auctions/:id/players', () => {
  test('returns player list for authenticated user', async () => {
    await createPlayer(auction._id, { name: 'P1' });
    await createPlayer(auction._id, { name: 'P2' });
    const res = await request(app).get(`/api/auctions/${auction._id}/players`).set(ownerHeader);
    expect(res.status).toBe(200);
    expect(res.body.players.length).toBe(2);
  });

  test('filters by status', async () => {
    await createPlayer(auction._id, { name: 'Pool', status: 'pool' });
    await createPlayer(auction._id, { name: 'Sold', status: 'sold' });
    const res = await request(app).get(`/api/auctions/${auction._id}/players?status=pool`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.players.every((p) => p.status === 'pool')).toBe(true);
  });
});
