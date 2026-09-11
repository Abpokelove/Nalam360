const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('health endpoint responds ok', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('protected doctors endpoint rejects anonymous requests', async () => {
  const response = await request(app).get('/api/doctors');
  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Authentication required.');
});

test('unknown API routes return JSON 404 responses', async () => {
  const response = await request(app).get('/api/does-not-exist');
  assert.equal(response.status, 404);
  assert.equal(response.body.message, 'Route not found.');
});
