const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { startDb, stopDb, clearDb, makeUser, makeEvent } = require('./setup');

// US01, US02, US03. Covers SC4 wrong role and SC5 wrong owner.
//
// These call the API directly instead of going through React. Hiding a button does not
// stop anyone using Postman, so the server has to be the one that says no.

let organiser;
let otherOrganiser;
let attendee;

beforeAll(async () => { await startDb(); });
afterAll(async () => { await stopDb(); });

beforeEach(async () => {
  await clearDb();
  organiser = await makeUser(app, 'org1@test.com', 'ORGANISER');
  otherOrganiser = await makeUser(app, 'org2@test.com', 'ORGANISER');
  attendee = await makeUser(app, 'att1@test.com', 'ATTENDEE');
});

describe('registration', () => {
  test('creates the account with the role that was chosen', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'password123', role: 'ATTENDEE' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('ATTENDEE');
    expect(res.body.token).toBeTruthy();
  });

  test('the password is stored hashed and never comes back in the response', async () => {
    await request(app).post('/api/auth/register')
      .send({ email: 'hash@test.com', password: 'password123', role: 'ATTENDEE' });

    const saved = await User.findOne({ email: 'hash@test.com' });

    expect(saved.passwordHash).not.toBe('password123');
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hashes look like this
    expect(JSON.stringify(saved.toSafeJSON())).not.toContain('password');
  });

  test('a duplicate email is refused', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'org1@test.com', password: 'password123', role: 'ATTENDEE' });

    expect(res.status).toBe(409);
    expect(res.body.errors.email).toBe('That email is already registered');
  });

  test('a short password is refused', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'short@test.com', password: 'abc', role: 'ATTENDEE' });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBe('Password must be at least 8 characters');
  });

  test('a missing role is refused', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'norole@test.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.errors.role).toBe('Select a role');
  });
});

describe('login', () => {
  test('correct details give back a token', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'org1@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  // D006
  test('a wrong password and an unknown email give the exact same message', async () => {
    const wrongPassword = await request(app).post('/api/auth/login')
      .send({ email: 'org1@test.com', password: 'notthepassword' });

    const noSuchUser = await request(app).post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(wrongPassword.status).toBe(401);
    expect(noSuchUser.status).toBe(401);
    // if these differed you could work out which emails are registered
    expect(wrongPassword.body.message).toBe(noSuchUser.body.message);
    expect(wrongPassword.body.message).toBe('Email or password is incorrect');
  });
});

describe('no token', () => {
  test('a protected route refuses a request with no token', async () => {
    const res = await request(app).get('/api/events/mine');
    expect(res.status).toBe(401);
  });

  test('a protected route refuses a made up token', async () => {
    const res = await request(app).get('/api/events/mine')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

describe('wrong role, SC4', () => {
  test('an attendee cannot create an event', async () => {
    const res = await request(app).post('/api/events')
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ title: 'Sneaky', venue: 'Somewhere', startsAt: new Date(Date.now() + 8.64e7), capacity: 5, price: 0 });

    expect(res.status).toBe(403);
  });

  test('an attendee cannot list organiser events', async () => {
    const res = await request(app).get('/api/events/mine')
      .set('Authorization', `Bearer ${attendee.token}`);

    expect(res.status).toBe(403);
  });

  test('an organiser cannot book tickets', async () => {
    const event = await makeEvent(app, organiser.token);

    const res = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${organiser.token}`)
      .send({ eventId: event.id, quantity: 1 });

    expect(res.status).toBe(403);
  });
});

describe('wrong owner, SC5', () => {
  test('an organiser cannot edit another organiser event', async () => {
    const event = await makeEvent(app, organiser.token);

    const res = await request(app).patch(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${otherOrganiser.token}`)
      .send({ venue: 'Hijacked' });

    expect(res.status).toBe(403);
  });

  test('an organiser cannot cancel another organiser event', async () => {
    const event = await makeEvent(app, organiser.token);

    const res = await request(app).post(`/api/events/${event.id}/cancel`)
      .set('Authorization', `Bearer ${otherOrganiser.token}`);

    expect(res.status).toBe(403);
  });

  test('an organiser cannot see the attendee list of another organiser event', async () => {
    const event = await makeEvent(app, organiser.token);

    const res = await request(app).get(`/api/events/${event.id}/bookings`)
      .set('Authorization', `Bearer ${otherOrganiser.token}`);

    expect(res.status).toBe(403);
  });

  test('my events only shows my own events', async () => {
    await makeEvent(app, organiser.token, { title: 'Mine' });
    await makeEvent(app, otherOrganiser.token, { title: 'Theirs' });

    const res = await request(app).get('/api/events/mine')
      .set('Authorization', `Bearer ${organiser.token}`);

    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].title).toBe('Mine');
  });

  test('sending someone else organiserId in the body does not change the owner', async () => {
    // the controller takes the owner from the token, so this is ignored
    const res = await request(app).post('/api/events')
      .set('Authorization', `Bearer ${organiser.token}`)
      .send({
        organiserId: otherOrganiser.user.id,
        title: 'Ownership test',
        venue: 'Test Venue',
        startsAt: new Date(Date.now() + 8.64e7).toISOString(),
        capacity: 5,
        price: 0
      });

    expect(res.status).toBe(201);
    expect(res.body.event.organiserId).toBe(organiser.user.id);
  });
});
