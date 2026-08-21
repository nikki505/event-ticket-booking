const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const Booking = require('../src/models/Booking');
const { startDb, stopDb, clearDb, makeUser, makeEvent } = require('./setup');

// Tests for US11 and US12, which is workflow W2.
//
// Cancelling is the mirror image of booking. Booking must never let the seats go below
// zero, and cancelling must never let them go above capacity. Both problems come from
// the same place, which is why I derived one shared requirement (R11.1) for them.

let organiser;
let attendee;
let otherAttendee;

beforeAll(async () => { await startDb(); });
afterAll(async () => { await stopDb(); });

beforeEach(async () => {
  await clearDb();
  organiser = await makeUser(app, 'org@test.com', 'ORGANISER');
  attendee = await makeUser(app, 'att1@test.com', 'ATTENDEE');
  otherAttendee = await makeUser(app, 'att2@test.com', 'ATTENDEE');
});

async function bookSeats(token, eventId, quantity) {
  const res = await request(app).post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ eventId: eventId, quantity: quantity });
  return res.body.booking;
}

function cancelBooking(token, bookingId) {
  return request(app).post(`/api/bookings/${bookingId}/cancel`)
    .set('Authorization', `Bearer ${token}`);
}

describe('my bookings, US11', () => {
  test('I only see my own bookings', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 20 });
    await bookSeats(attendee.token, event.id, 2);
    await bookSeats(otherAttendee.token, event.id, 3);

    const res = await request(app).get('/api/bookings/mine')
      .set('Authorization', `Bearer ${attendee.token}`);

    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].quantity).toBe(2);
  });

  test('a cancelled booking stays in my list marked cancelled', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 20 });
    const booking = await bookSeats(attendee.token, event.id, 2);
    await cancelBooking(attendee.token, booking.id);

    const res = await request(app).get('/api/bookings/mine')
      .set('Authorization', `Bearer ${attendee.token}`);

    // It should still be listed, not hidden. Hiding it would make the seat maths
    // impossible to check later.
    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].status).toBe('CANCELLED');
  });
});

describe('cancelling a booking, US12', () => {
  // AC1
  test('cancelling gives back exactly the seats that were booked', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 10 });

    const booking = await bookSeats(attendee.token, event.id, 3);

    let current = await Event.findById(event.id);
    expect(current.seatsRemaining).toBe(7);

    const res = await cancelBooking(attendee.token, booking.id);

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('CANCELLED');

    current = await Event.findById(event.id);
    // Back to 10. Not 9, and importantly not 11.
    expect(current.seatsRemaining).toBe(10);
  });

  // AC2. This is the important one.
  test('cancelling the same booking twice does not give the seats back twice', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 10 });
    const booking = await bookSeats(attendee.token, event.id, 3);

    const first = await cancelBooking(attendee.token, booking.id);
    const second = await cancelBooking(attendee.token, booking.id);

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);

    const current = await Event.findById(event.id);
    // If the second cancel had gone through, this would say 13, which is more seats
    // than the venue has. The event would then be able to oversell.
    expect(current.seatsRemaining).toBe(10);
    expect(current.seatsRemaining).toBeLessThanOrEqual(current.capacity);
  });

  // Same problem but with both requests arriving together.
  test('two cancel requests at the same moment only release the seats once', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 10 });
    const booking = await bookSeats(attendee.token, event.id, 4);

    const [one, two] = await Promise.all([
      cancelBooking(attendee.token, booking.id),
      cancelBooking(attendee.token, booking.id)
    ]);

    const codes = [one.status, two.status].sort();
    expect(codes).toEqual([200, 409]);

    const current = await Event.findById(event.id);
    expect(current.seatsRemaining).toBe(10);
  });

  // AC3
  test('I cannot cancel somebody else booking', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 10 });
    const booking = await bookSeats(attendee.token, event.id, 2);

    const res = await cancelBooking(otherAttendee.token, booking.id);

    expect(res.status).toBe(403);

    const stillConfirmed = await Booking.findById(booking.id);
    expect(stillConfirmed.status).toBe('CONFIRMED');
  });
});

describe('W2 end to end', () => {
  test('book, cancel, and the organiser sees the seats come back', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 100 });

    const booking = await bookSeats(attendee.token, event.id, 5);

    let organiserView = await request(app).get(`/api/events/${event.id}/bookings`)
      .set('Authorization', `Bearer ${organiser.token}`);
    expect(organiserView.body.confirmedSeats).toBe(5);
    expect(organiserView.body.event.seatsRemaining).toBe(95);

    await cancelBooking(attendee.token, booking.id);

    organiserView = await request(app).get(`/api/events/${event.id}/bookings`)
      .set('Authorization', `Bearer ${organiser.token}`);

    expect(organiserView.body.confirmedSeats).toBe(0);
    expect(organiserView.body.event.seatsRemaining).toBe(100);
    // the cross check still lines up after the round trip
    expect(organiserView.body.confirmedSeats).toBe(organiserView.body.crossCheck);
  });

  test('seats freed by a cancellation can be booked by somebody else', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 1 });

    const booking = await bookSeats(attendee.token, event.id, 1);

    // sold out now
    const blocked = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${otherAttendee.token}`)
      .send({ eventId: event.id, quantity: 1 });
    expect(blocked.status).toBe(409);

    await cancelBooking(attendee.token, booking.id);

    const nowAllowed = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${otherAttendee.token}`)
      .send({ eventId: event.id, quantity: 1 });

    expect(nowAllowed.status).toBe(201);
  });
});
