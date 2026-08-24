const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

// Test helpers.
//
// These run against an in memory MongoDB, not my real one. That way they cannot wreck
// my dev data and every test starts from a clean database.

process.env.JWT_SECRET = 'test-secret-only-used-by-jest';
process.env.JWT_EXPIRES_IN = '1h';

let mongod;

async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function stopDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearDb() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

// makes an account and returns the token so tests do not repeat this
async function makeUser(app, email, role) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: email, password: 'password123', role: role });

  return { token: res.body.token, user: res.body.user };
}

// 20 seats unless the test asks for something else
async function makeEvent(app, token, overrides = {}) {
  const tomorrow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const res = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Event',
      venue: 'Test Venue',
      startsAt: tomorrow.toISOString(),
      capacity: 20,
      price: 10,
      ...overrides
    });

  return res.body.event;
}

module.exports = { startDb, stopDb, clearDb, makeUser, makeEvent };
