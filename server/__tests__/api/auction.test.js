const request = require('supertest');

// Mock Socket.io — auction state transitions emit events; tests don't need real sockets
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

describe('POST /api/auctions', () => {
  test('admin creates auction successfully', async () => {
    const res = await request(app).post('/api/auctions').set(adminHeader).send({ name: 'New Auction', sport: 'cricket' });
    expect(res.status).toBe(201);
    expect(res.body.auction.name).toBe('New Auction');
    expect(res.body.auction.status).toBe('draft');
  });

  test('missing name → 400', async () => {
    const res = await request(app).post('/api/auctions').set(adminHeader).send({ sport: 'cricket' });
    expect(res.status).toBe(400);
  });

  test('non-admin is rejected → 403', async () => {
    const res = await request(app).post('/api/auctions').set(ownerHeader).send({ name: 'Unauthorized', sport: 'cricket' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/auctions', () => {
  test('returns auction list for authenticated users', async () => {
    const res = await request(app).get('/api/auctions').set(ownerHeader);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.auctions)).toBe(true);
    expect(res.body.auctions.length).toBe(1);
  });
});

describe('GET /api/auctions/:id', () => {
  test('returns auction detail', async () => {
    const res = await request(app).get(`/api/auctions/${auction._id}`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.auction._id).toBe(auction._id.toString());
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/auctions/000000000000000000000000').set(adminHeader);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/auctions/:id/config', () => {
  test('admin updates allowed config fields', async () => {
    const res = await request(app).patch(`/api/auctions/${auction._id}/config`).set(adminHeader)
      .send({ defaultPursePerTeam: 2000, maxSquadSize: 20 });
    expect(res.status).toBe(200);
    expect(res.body.auction.defaultPursePerTeam).toBe(2000);
    expect(res.body.auction.maxSquadSize).toBe(20);
  });

  test('non-admin is rejected', async () => {
    const res = await request(app).patch(`/api/auctions/${auction._id}/config`).set(ownerHeader).send({ defaultPursePerTeam: 9999 });
    expect(res.status).toBe(403);
  });

  test('cannot update config when auction is live', async () => {
    await auction.updateOne({ status: 'live' });
    const res = await request(app).patch(`/api/auctions/${auction._id}/config`).set(adminHeader).send({ defaultPursePerTeam: 9999 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/auctions/:id', () => {
  test('admin can delete a draft auction', async () => {
    const res = await request(app).delete(`/api/auctions/${auction._id}`).set(adminHeader);
    expect(res.status).toBe(200);
  });

  test('cannot delete a live auction', async () => {
    await auction.updateOne({ status: 'live' });
    const res = await request(app).delete(`/api/auctions/${auction._id}`).set(adminHeader);
    expect(res.status).toBe(400);
  });
});

describe('Auction state machine', () => {
  test('draft → live (start)', async () => {
    const res = await request(app).post(`/api/auctions/${auction._id}/start`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.auction.status).toBe('live');
  });

  test('cannot start an already-live auction', async () => {
    await auction.updateOne({ status: 'live' });
    const res = await request(app).post(`/api/auctions/${auction._id}/start`).set(adminHeader);
    expect(res.status).toBe(400);
  });

  test('live → paused (pause)', async () => {
    await auction.updateOne({ status: 'live' });
    const res = await request(app).post(`/api/auctions/${auction._id}/pause`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.auction.status).toBe('paused');
  });

  test('paused → live (resume)', async () => {
    await auction.updateOne({ status: 'paused' });
    const res = await request(app).post(`/api/auctions/${auction._id}/resume`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.auction.status).toBe('live');
  });

  test('live → completed (end)', async () => {
    await auction.updateOne({ status: 'live' });
    const res = await request(app).post(`/api/auctions/${auction._id}/end`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.auction.status).toBe('completed');
  });

  test('next-player on live auction with players', async () => {
    const player = await createPlayer(auction._id);
    await auction.updateOne({ status: 'live', auctionOrder: [player._id] });
    const res = await request(app).post(`/api/auctions/${auction._id}/next-player`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.player._id).toBe(player._id.toString());
  });

  test('next-player with no players → 400', async () => {
    await auction.updateOne({ status: 'live' });
    const res = await request(app).post(`/api/auctions/${auction._id}/next-player`).set(adminHeader);
    expect(res.status).toBe(400);
  });
});
