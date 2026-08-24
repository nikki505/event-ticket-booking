const express = require('express');
const { protect, requireRole } = require('../middleware/auth');
const auth = require('../controllers/authController');
const events = require('../controllers/eventController');
const bookings = require('../controllers/bookingController');

const router = express.Router();

// All routes in one file so I can see the whole permission picture at once.
//
// The middleware on each line says who can call it:
//   nothing            anyone
//   protect            any signed in user
//   requireRole(...)   only that kind of user
// Is it yours is checked in the controller, it needs the record first.

// health check, handy for testing the EC2 box is up
router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', protect, auth.me);

// events that anyone can look at
router.get('/events', events.listPublic);

// has to come before /events/:id or express reads "mine" as an id
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
