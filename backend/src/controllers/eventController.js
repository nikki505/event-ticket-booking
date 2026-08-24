const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { validateEvent, hasErrors } = require('../utils/validators');

// R5 create an event
async function create(req, res, next) {
  try {
    const errors = validateEvent(req.body);
    if (hasErrors(errors)) {
      return res.status(400).json({ message: 'Please correct the highlighted fields', errors });
    }

    const capacity = Number(req.body.capacity);

    const event = await Event.create({
      // owner comes from the token, never the body, or someone could post an
      // organiserId and make an event owned by someone else
      organiserId: req.user._id,
      title: req.body.title.trim(),
      description: (req.body.description || '').trim(),
      venue: req.body.venue.trim(),
      startsAt: new Date(req.body.startsAt),
      capacity: capacity,
      seatsRemaining: capacity, // new event, nothing booked yet
      price: Number(req.body.price)
    });

    return res.status(201).json({ event: event.toJSONView() });
  } catch (err) {
    next(err);
  }
}

// R9 public listing. No login needed for this one.
async function listPublic(req, res, next) {
  try {
    const events = await Event.find({
      status: 'PUBLISHED',
      startsAt: { $gt: new Date() } // hide events that already happened
    }).sort({ startsAt: 1 });

    return res.json({ events: events.map((e) => e.toJSONView()) });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'That event does not exist' });
    return res.json({ event: event.toJSONView() });
  } catch (err) {
    next(err);
  }
}

// R6 the organiser's own events
async function listMine(req, res, next) {
  try {
    // filtering by the signed in user is what stops one organiser seeing another's
    // events. A filter, not a check afterwards, so nothing extra can leak.
    const events = await Event.find({ organiserId: req.user._id }).sort({ startsAt: 1 });
    return res.json({ events: events.map((e) => e.toJSONView()) });
  } catch (err) {
    next(err);
  }
}

// R7 update an event
async function update(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'That event does not exist' });

    // 403 not 404, because the event does exist, they just cannot touch it
    if (event.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own events' });
    }

    const merged = {
      title: req.body.title !== undefined ? req.body.title : event.title,
      description: req.body.description !== undefined ? req.body.description : event.description,
      venue: req.body.venue !== undefined ? req.body.venue : event.venue,
      startsAt: req.body.startsAt !== undefined ? req.body.startsAt : event.startsAt,
      capacity: req.body.capacity !== undefined ? req.body.capacity : event.capacity,
      price: req.body.price !== undefined ? req.body.price : event.price
    };

    const errors = validateEvent(merged);

    // only check the future rule if the date is actually being changed
    if (req.body.startsAt === undefined) delete errors.startsAt;

    const newCapacity = Number(merged.capacity);
    const seatsTaken = event.capacity - event.seatsRemaining;

    // capacity cannot go below what is already booked, or those bookings have
    // nowhere to sit
    if (!errors.capacity && newCapacity < seatsTaken) {
      errors.capacity = `Capacity cannot be lower than the ${seatsTaken} seats already booked`;
    }

    if (hasErrors(errors)) {
      return res.status(400).json({ message: 'Please correct the highlighted fields', errors });
    }

    // move seatsRemaining by the difference, do not just set it. 10 to 20 with 8
    // booked has to leave 12 free, not 20.
    const capacityChange = newCapacity - event.capacity;

    event.title = merged.title.trim();
    event.description = (merged.description || '').trim();
    event.venue = merged.venue.trim();
    event.startsAt = new Date(merged.startsAt);
    event.capacity = newCapacity;
    event.seatsRemaining = event.seatsRemaining + capacityChange;
    event.price = Number(merged.price);

    await event.save();
    return res.json({ event: event.toJSONView() });
  } catch (err) {
    next(err);
  }
}

// R8 cancel an event
async function cancel(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'That event does not exist' });

    if (event.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own events' });
    }

    if (event.status === 'CANCELLED') {
      return res.status(409).json({ message: 'That event is already cancelled' });
    }

    // soft delete, D005. Only the status changes. Deleting the row would leave every
    // booking pointing at nothing.
    event.status = 'CANCELLED';
    await event.save();

    return res.json({ event: event.toJSONView() });
  } catch (err) {
    next(err);
  }
}

// R14 who has booked my event
async function listBookings(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'That event does not exist' });

    if (event.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only view attendees for your own events' });
    }

    const bookings = await Booking.find({ eventId: event._id })
      .populate('attendeeId', 'email')
      .sort({ createdAt: -1 });

    const confirmedSeats = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((total, b) => total + b.quantity, 0);

    return res.json({
      event: event.toJSONView(),
      confirmedSeats: confirmedSeats,
      // cross check. One number comes from adding up bookings, the other from the
      // stored counter. If they disagree, seatsRemaining has drifted.
      crossCheck: event.capacity - event.seatsRemaining,
      bookings: bookings.map((b) => ({
        id: b._id,
        reference: b.reference,
        attendeeEmail: b.attendeeId ? b.attendeeId.email : 'unknown',
        quantity: b.quantity,
        status: b.status,
        createdAt: b.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listPublic, getOne, listMine, update, cancel, listBookings };
