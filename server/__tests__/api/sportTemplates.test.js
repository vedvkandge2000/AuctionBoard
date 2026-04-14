const request = require('supertest');
const app = require('../../src/app');
const testDb = require('../../src/config/testDb');
const SportTemplate = require('../../src/models/SportTemplate');
const { createAdminUser, createTeamOwnerUser, getAuthHeader } = require('../helpers/fixtures');
const seedSportTemplates = require('../../src/seeds/sportTemplates');

let admin, owner, adminHeader, ownerHeader;

beforeAll(async () => { await testDb.connect(); });
beforeEach(async () => {
  await testDb.clear();
  admin = await createAdminUser();
  owner = await createTeamOwnerUser();
  adminHeader = getAuthHeader(admin);
  ownerHeader = getAuthHeader(owner);
  await seedSportTemplates();
});
afterAll(async () => { await testDb.disconnect(); });

describe('GET /api/sport-templates', () => {
  test('returns seeded templates for authenticated user', async () => {
    const res = await request(app).get('/api/sport-templates').set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.templates.length).toBeGreaterThanOrEqual(2);
    const sports = res.body.templates.map((t) => t.sport);
    expect(sports).toContain('cricket');
    expect(sports).toContain('badminton');
  });

  test('allows unauthenticated request (public endpoint for player registration)', async () => {
    const res = await request(app).get('/api/sport-templates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
  });
});

describe('POST /api/sport-templates', () => {
  const newTemplate = {
    name: 'Basketball', sport: 'basketball', icon: '🏀',
    playerRoles: ['Guard', 'Forward', 'Center'],
    currency: 'USD', currencySymbol: '$', currencyUnit: 'M',
    defaultPursePerTeam: 50, minSquadSize: 8, maxSquadSize: 15,
    bidIncrementTiers: [{ upToAmount: 999999999, increment: 1 }],
  };

  test('admin can create a new template', async () => {
    const res = await request(app).post('/api/sport-templates').set(adminHeader).send(newTemplate);
    expect(res.status).toBe(201);
    expect(res.body.template.sport).toBe('basketball');
    expect(res.body.template.isSeeded).toBe(false);
  });

  test('non-admin is rejected', async () => {
    const res = await request(app).post('/api/sport-templates').set(ownerHeader).send(newTemplate);
    expect(res.status).toBe(403);
  });

  test('duplicate sport slug is rejected with 409', async () => {
    const res = await request(app).post('/api/sport-templates').set(adminHeader).send({ ...newTemplate, sport: 'cricket' });
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/sport-templates/:id', () => {
  test('admin can update a template', async () => {
    const template = await SportTemplate.findOne({ sport: 'cricket' });
    const res = await request(app).patch(`/api/sport-templates/${template._id}`).set(adminHeader).send({ description: 'Updated desc' });
    expect(res.status).toBe(200);
    expect(res.body.template.description).toBe('Updated desc');
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/api/sport-templates/000000000000000000000000').set(adminHeader).send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/sport-templates/:id', () => {
  test('cannot delete a seeded (built-in) template', async () => {
    const template = await SportTemplate.findOne({ sport: 'cricket' });
    const res = await request(app).delete(`/api/sport-templates/${template._id}`).set(adminHeader);
    expect(res.status).toBe(403);
  });

  test('can delete a custom (non-seeded) template', async () => {
    const custom = await SportTemplate.create({ name: 'Custom', sport: 'custom', icon: '🎮', bidIncrementTiers: [{ upToAmount: 999999999, increment: 10 }] });
    const res = await request(app).delete(`/api/sport-templates/${custom._id}`).set(adminHeader);
    expect(res.status).toBe(200);
    expect(await SportTemplate.findById(custom._id)).toBeNull();
  });
});

describe('POST /api/sport-templates/:id/clone', () => {
  test('creates a copy with isSeeded=false', async () => {
    const template = await SportTemplate.findOne({ sport: 'cricket' });
    const res = await request(app).post(`/api/sport-templates/${template._id}/clone`).set(adminHeader);
    expect(res.status).toBe(201);
    expect(res.body.template.isSeeded).toBe(false);
    expect(res.body.template.name).toContain('copy');
    expect(res.body.template.sport).not.toBe('cricket'); // slug is different
  });
});
