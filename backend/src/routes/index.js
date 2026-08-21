const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const auth = require('../controllers/authController');
const events = require('../controllers/eventController');
const bookings = require('../controllers/bookingController');

const router = express.Router();

// All the routes in one file so the whole permission picture is visible at once.
// This matches the API table in docs/06-system-design.md section 6.11.
//
// Reading down the middleware on each line tells you who can call it:
//   nothing            anyone, even logged out
//   protect            any signed in user
//   requireRole(...)   only that kind of user
// Ownership is checked inside the controller because it needs the database record.

// health check, handy for testing the EC2 box is actually up
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.me);

// events that anyone can look at
router.get('/events', events.listPublic);

// organiser only. NOTE this has to be declared before /events/:id or express would
// treat the word "mine" as an id and try to look up an event called mine.
router.get('/events/mine', protect, requireRole('ORGANISER'), events.listMine);

router.get('/events/:id', events.getOne);
router.post('/events', protect, requireRole('ORGANISER'), events.create);
router.patch('/events/:id', protect, requireRole('ORGANISER'), events.update);
router.post('/events/:id/cancel', protect, requireRole('ORGANISER'), events.cancel);
router.get('/events/:id/bookings', protect, requireRole('ORGANISER'), events.listBookings);

// attendee only
router.post('/bookings', protect, requireRole('ATTENDEE'), bookings.create);
router.get('/bookings/mine', protect, requireRole('ATTENDEE'), bookings.listMine);
router.post('/bookings/:id/cancel', protect, requireRole('ATTENDEE'), bookings.cancel);

module.exports = router;
