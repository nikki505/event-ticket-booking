const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Booking = require('../src/models/Booking');
const { startDb, stopDb, clearDb, makeUser, makeEvent } = require('./setup');

// US10, the no overbooking story. This file is what proves the design works.

let organiser;
let attendee;
let attendeeTwo;

beforeAll(async () => { await startDb(); });
afterAll(async () => { await stopDb(); });

beforeEach(async () => {
  await clearDb();
  organiser = await makeUser(app, 'organiser@test.com', 'ORGANISER');
  attendee = await makeUser(app, 'attendee@test.com', 'ATTENDEE');
  attendeeTwo = await makeUser(app, 'attendee2@test.com', 'ATTENDEE');
});

function book(token, eventId, quantity) {
  return request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ eventId: eventId, quantity: quantity });
}

// AC1
test('booking more than the seats left is rejected with 409', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 2 });

  const res = await book(attendee.token, event.id, 3);

  expect(res.status).toBe(409);
  expect(res.body.message).toContain('Only 2 seats remain');

  // nothing should have been written
  expect(await Booking.countDocuments()).toBe(0);
  const after = await Event.findById(event.id);
  expect(after.seatsRemaining).toBe(2);
});

// AC2
test('booking exactly the seats left works and leaves zero', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 2 });

  const res = await book(attendee.token, event.id, 2);

  expect(res.status).toBe(201);
  expect(res.body.booking.status).toBe('CONFIRMED');

  const after = await Event.findById(event.id);
  expect(after.seatsRemaining).toBe(0);
});

// AC3
test('booking a sold out event is rejected', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 1 });
  await book(attendee.token, event.id, 1);

  const res = await book(attendeeTwo.token, event.id, 1);

  expect(res.status).toBe(409);
  expect(res.body.message).toContain('sold out');
  expect(await Booking.countDocuments()).toBe(1);
});

// AC2 of US09, the counter has to move by exactly the amount booked
test('seats remaining goes down by exactly the quantity booked', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 20 });

  await book(attendee.token, event.id, 3);

  const after = await Event.findById(event.id);
  expect(after.seatsRemaining).toBe(17);
});

// AC4. This is the one that matters.
//
// If I had written it as read, compare, save, this test would fail. Both requests
// would read 1 seat, both would think there was room, and I would get 2 bookings for
// 1 seat. Because the check and the subtract are one query, only one can match.
test('two people booking the last seat at the same time, only one succeeds', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 1 });

  // no await in between, so they are really in flight together
  const [first, second] = await Promise.all([
    book(attendee.token, event.id, 1),
    book(attendeeTwo.token, event.id, 1)
  ]);

  const codes = [first.status, second.status].sort();
  expect(codes).toEqual([201, 409]);

  const after = await Event.findById(event.id);
  expect(after.seatsRemaining).toBe(0);
  expect(after.seatsRemaining).toBeGreaterThanOrEqual(0); // never negative
  expect(await Booking.countDocuments({ status: 'CONFIRMED' })).toBe(1);
});

// more requests, to check two was not just luck
test('ten people racing for three seats, exactly three succeed', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 3 });

  const attempts = [];
  for (let i = 0; i < 10; i++) {
    // either account is fine, nothing limits bookings per person
    const token = i % 2 === 0 ? attendee.token : attendeeTwo.token;
    attempts.push(book(token, event.id, 1));
  }

  const results = await Promise.all(attempts);
  const created = results.filter((r) => r.status === 201).length;
  const rejected = results.filter((r) => r.status === 409).length;

  expect(created).toBe(3);
  expect(rejected).toBe(7);

  const after = await Event.findById(event.id);
  expect(after.seatsRemaining).toBe(0);
});

// AC5
test('a rejected booking leaves nothing behind in the database', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 1 });

  await book(attendee.token, event.id, 5);

  expect(await Booking.countDocuments()).toBe(0);
  const after = await Event.findById(event.id);
  expect(after.seatsRemaining).toBe(1);
});

test('quantity outside 1 to 10 is rejected before touching the database', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 50 });

  const zero = await book(attendee.token, event.id, 0);
  const eleven = await book(attendee.token, event.id, 11);

  expect(zero.status).toBe(400);
  expect(zero.body.errors.quantity).toBe('You can book between 1 and 10 tickets');
  expect(eleven.status).toBe(400);

  const after = await Event.findById(event.id);
  expect(after.seatsRemaining).toBe(50);
});

test('booking references are unique', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 20 });

  const one = await book(attendee.token, event.id, 1);
  const two = await book(attendeeTwo.token, event.id, 1);

  expect(one.body.booking.reference).not.toBe(two.body.booking.reference);
  expect(one.body.booking.reference).toMatch(/^ETB-/);
});

test('a cancelled event cannot be booked', async () => {
  const event = await makeEvent(app, organiser.token, { capacity: 10 });

  await request(app)
    .post(`/api/events/${event.id}/cancel`)
    .set('Authorization', `Bearer ${organiser.token}`);

  const res = await book(attendee.token, event.id, 1);

  expect(res.status).toBe(409);
  expect(res.body.message).toBe('This event has been cancelled');
});
