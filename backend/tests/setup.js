const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

// Test helpers.
//
// I run the tests against an in memory MongoDB rather than my real one. That way the
// tests cannot wreck my development data, and they start from a clean database every
// time so one test cannot affect the next one.

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

// Makes an account and gives back the token, so tests do not repeat this every time.
async function makeUser(app, email, role) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: email, password: 'password123', role: role });

  return { token: res.body.token, user: res.body.user };
}

// Default event is 20 seats unless a test asks for something different.
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
