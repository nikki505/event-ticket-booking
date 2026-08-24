const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const { startDb, stopDb, clearDb, makeUser, makeEvent } = require('./setup');

// US04 to US07 and US13. Mostly the validation rules from section 1.10, plus the
// capacity change rule which was the fiddly one.

let organiser;
let attendee;

beforeAll(async () => { await startDb(); });
afterAll(async () => { await stopDb(); });

beforeEach(async () => {
  await clearDb();
  organiser = await makeUser(app, 'org@test.com', 'ORGANISER');
  attendee = await makeUser(app, 'att@test.com', 'ATTENDEE');
});

function createEvent(token, body) {
  return request(app).post('/api/events').set('Authorization', `Bearer ${token}`).send(body);
}

const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

describe('creating an event, US04', () => {
  test('a valid event is created and seats remaining starts at capacity', async () => {
    const res = await createEvent(organiser.token, {
      title: 'Semester Welcome Night', venue: 'QUT Gardens Point',
      startsAt: futureDate(), capacity: 120, price: 15
    });

    expect(res.status).toBe(201);
    expect(res.body.event.seatsRemaining).toBe(120);
    expect(res.body.event.status).toBe('PUBLISHED');
  });

  test('a date in the past is refused', async () => {
    const res = await createEvent(organiser.token, {
      title: 'Last year party', venue: 'Somewhere',
      startsAt: new Date(Date.now() - 8.64e7).toISOString(), capacity: 10, price: 0
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.startsAt).toBe('Event date must be in the future');
  });

  test('capacity of zero, negative or a fraction is refused', async () => {
    const base = { title: 'Test Event', venue: 'Test Venue', startsAt: futureDate(), price: 0 };

    for (const bad of [0, -5, 2.5]) {
      const res = await createEvent(organiser.token, { ...base, capacity: bad });
      expect(res.status).toBe(400);
      expect(res.body.errors.capacity).toBe('Capacity must be a whole number of at least 1');
    }
  });

  test('a negative price is refused', async () => {
    const res = await createEvent(organiser.token, {
      title: 'Test Event', venue: 'Test Venue', startsAt: futureDate(), capacity: 10, price: -5
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.price).toBe('Price cannot be negative');
  });

  test('a title that is too short is refused', async () => {
    const res = await createEvent(organiser.token, {
      title: 'AB', venue: 'Test Venue', startsAt: futureDate(), capacity: 10, price: 0
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.title).toBe('Title must be between 3 and 120 characters');
  });
});

describe('the public listing, US08', () => {
  test('past and cancelled events do not show up', async () => {
    await makeEvent(app, organiser.token, { title: 'Future one' });

    const cancelled = await makeEvent(app, organiser.token, { title: 'Cancelled one' });
    await request(app).post(`/api/events/${cancelled.id}/cancel`)
      .set('Authorization', `Bearer ${organiser.token}`);

    // validation blocks a past event, so I insert one straight into the database
    await Event.create({
      organiserId: organiser.user.id, title: 'Past one', venue: 'Old Venue',
      startsAt: new Date(Date.now() - 8.64e7), capacity: 10, seatsRemaining: 10, price: 0
    });

    const res = await request(app).get('/api/events');

    const titles = res.body.events.map((e) => e.title);
    expect(titles).toContain('Future one');
    expect(titles).not.toContain('Cancelled one');
    expect(titles).not.toContain('Past one');
  });

  test('an event with no seats left is flagged as sold out', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 1 });
    await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ eventId: event.id, quantity: 1 });

    const res = await request(app).get('/api/events');
    const found = res.body.events.find((e) => e.id === event.id);

    expect(found.soldOut).toBe(true);
    expect(found.seatsRemaining).toBe(0);
  });
});

describe('updating an event, US06', () => {
  test('the venue can be changed', async () => {
    const event = await makeEvent(app, organiser.token);

    const res = await request(app).patch(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${organiser.token}`)
      .send({ venue: 'A Different Venue' });

    expect(res.status).toBe(200);
    expect(res.body.event.venue).toBe('A Different Venue');
  });

  // AC2. Capacity cannot drop below what is booked.
  test('capacity cannot be dropped below the seats already booked', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 10 });

    await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ eventId: event.id, quantity: 8 });

    const res = await request(app).patch(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${organiser.token}`)
      .send({ capacity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.errors.capacity).toBe('Capacity cannot be lower than the 8 seats already booked');
  });

  // AC4. I nearly got this wrong. Raising capacity adds the difference. If it
  // overwrote seatsRemaining the 8 bookings would just disappear.
  test('raising capacity adds the difference and keeps existing bookings', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 10 });

    await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ eventId: event.id, quantity: 8 });

    // 10 capacity, 8 booked, 2 free
    const res = await request(app).patch(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${organiser.token}`)
      .send({ capacity: 20 });

    expect(res.status).toBe(200);
    expect(res.body.event.capacity).toBe(20);
    // 20 minus 8 booked is 12. Overwriting would say 20.
    expect(res.body.event.seatsRemaining).toBe(12);
  });
});

describe('cancelling an event, US07', () => {
  test('cancelling sets the status and hides it from the public listing', async () => {
    const event = await makeEvent(app, organiser.token);

    const res = await request(app).post(`/api/events/${event.id}/cancel`)
      .set('Authorization', `Bearer ${organiser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.event.status).toBe('CANCELLED');

    // soft delete, the row is still there
    const stillInDb = await Event.findById(event.id);
    expect(stillInDb).not.toBeNull();

    const listing = await request(app).get('/api/events');
    expect(listing.body.events.find((e) => e.id === event.id)).toBeUndefined();
  });

  test('cancelling twice is refused', async () => {
    const event = await makeEvent(app, organiser.token);
    const url = `/api/events/${event.id}/cancel`;

    await request(app).post(url).set('Authorization', `Bearer ${organiser.token}`);
    const second = await request(app).post(url).set('Authorization', `Bearer ${organiser.token}`);

    expect(second.status).toBe(409);
  });
});

describe('the attendee list, US13', () => {
  // AC4. The two totals are worked out different ways, so if they disagree the stored
  // counter has drifted. Safety net for D004.
  test('the confirmed total matches capacity minus seats remaining', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 20 });

    await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ eventId: event.id, quantity: 3 });

    const res = await request(app).get(`/api/events/${event.id}/bookings`)
      .set('Authorization', `Bearer ${organiser.token}`);

    expect(res.status).toBe(200);
    expect(res.body.confirmedSeats).toBe(3);
    expect(res.body.crossCheck).toBe(3);
    expect(res.body.confirmedSeats).toBe(res.body.crossCheck);
  });

  test('a cancelled booking still shows but is left out of the confirmed total', async () => {
    const event = await makeEvent(app, organiser.token, { capacity: 20 });

    const booking = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${attendee.token}`)
      .send({ eventId: event.id, quantity: 4 });

    await request(app).post(`/api/bookings/${booking.body.booking.id}/cancel`)
      .set('Authorization', `Bearer ${attendee.token}`);

    const res = await request(app).get(`/api/events/${event.id}/bookings`)
      .set('Authorization', `Bearer ${organiser.token}`);

    expect(res.body.bookings).toHaveLength(1);
    expect(res.body.bookings[0].status).toBe('CANCELLED');
    expect(res.body.confirmedSeats).toBe(0);
    expect(res.body.crossCheck).toBe(0);
  });
});
