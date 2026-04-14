const request = require('supertest');

// Mock Socket.io to avoid "not initialized" errors if any auth path touches socket
jest.mock('../../src/config/socket', () => ({
  getIO: () => ({ to: () => ({ emit: () => {} }) }),
}));

const app = require('../../src/app');
const testDb = require('../../src/config/testDb');
const { createAdminUser, createTeamOwnerUser, createPendingOwner, getAuthHeader } = require('../helpers/fixtures');

beforeAll(async () => { await testDb.connect(); });
afterEach(async () => { await testDb.clear(); });
afterAll(async () => { await testDb.disconnect(); });

describe('POST /api/auth/register', () => {
  test('registers admin and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin', email: 'admin@test.com', password: 'Password1!', role: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  test('registers team_owner and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Owner', email: 'owner@test.com', password: 'Password1!', role: 'team_owner',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('team_owner');
  });

  test('rejects duplicate email', async () => {
    await createAdminUser();
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin Two', email: 'admin@test.com', password: 'Password1!', role: 'admin',
    });
    expect(res.status).toBe(409);
  });

  test('rejects missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('POST /api/auth/login', () => {
  test('logs in approved admin with valid credentials', async () => {
    await createAdminUser();
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects wrong password', async () => {
    await createAdminUser();
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  test('rejects unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'anything' });
    expect(res.status).toBe(401);
  });

  test('allows team_owner to log in immediately (no global approval gate)', async () => {
    await createPendingOwner();
    const res = await request(app).post('/api/auth/login').send({ email: 'pending@test.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

describe('GET /api/auth/me', () => {
  test('returns user for valid token', async () => {
    const admin = await createAdminUser();
    const res = await request(app).get('/api/auth/me').set(getAuthHeader(admin));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
  });

  test('rejects missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rejects invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set({ Authorization: 'Bearer bad_token' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/health', () => {
  test('returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
