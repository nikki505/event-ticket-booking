const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { validateBookingQuantity, hasErrors } = require('../utils/validators');

// R10 book tickets. R11 never oversell.
//
// I got this wrong the first time. I read the event, checked the seats, subtracted,
// then saved. It passed every test I did by hand.
//
// It is still broken. If two people book the last seat at the same moment they can
// both read seatsRemaining as 1, both think there is room, and both save. Now the
// event is oversold.
//
// So I do the check and the subtract in one query. Whoever gets there second matches
// nothing and gets null. That is R11.1 in my design.

async function create(req, res, next) {
  try {
    const errors = validateBookingQuantity(req.body);
    if (hasErrors(errors)) {
      return res.status(400).json({ message: 'Please correct the highlighted fields', errors });
    }

    const quantity = Number(req.body.quantity);
    const eventId = req.body.eventId;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'That event does not exist' });

    if (event.status === 'CANCELLED') {
      return res.status(409).json({ message: 'This event has been cancelled' });
    }

    if (event.startsAt.getTime() <= Date.now()) {
      return res.status(409).json({ message: 'This event has already started' });
    }

    // The $gte is in the filter, not in an if above. That is the bit that matters.
    const claimed = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'PUBLISHED',
        seatsRemaining: { $gte: quantity }
      },
      { $inc: { seatsRemaining: -quantity } },
      { new: true }
    );

    // Nothing matched, so someone took the seats first.
    if (!claimed) {
      const latest = await Event.findById(eventId);
      const left = latest ? latest.seatsRemaining : 0;
      return res.status(409).json({
        message: left === 0
          ? 'This event is now sold out'
          : `Only ${left} ${left === 1 ? 'seat remains' : 'seats remain'} for this event`,
        seatsRemaining: left
      });
    }

    // Seats are mine, save the booking.
    let booking;
    try {
      booking = await Booking.create({
        reference: Booking.makeReference(),
        eventId: claimed._id,
        attendeeId: req.user._id,
        quantity: quantity
      });
    } catch (createErr) {
      // I already took the seats, so if the save fails I have to put them back.
      // Otherwise they are lost and the event looks fuller than it is. D009.
      await Event.updateOne({ _id: claimed._id }, { $inc: { seatsRemaining: quantity } });
      throw createErr;
    }

    return res.status(201).json({
      booking: booking.toJSONView(),
      seatsRemaining: claimed.seatsRemaining
    });
  } catch (err) {
    next(err);
  }
}

// R12 my own bookings
async function listMine(req, res, next) {
  try {
    const bookings = await Booking.find({ attendeeId: req.user._id })
      .populate('eventId', 'title venue startsAt price status')
      .sort({ createdAt: -1 });

    return res.json({
      bookings: bookings.map((b) => ({
        id: b._id,
        reference: b.reference,
        quantity: b.quantity,
        status: b.status,
        createdAt: b.createdAt,
        event: b.eventId
          ? {
              id: b.eventId._id,
              title: b.eventId.title,
              venue: b.eventId.venue,
              startsAt: b.eventId.startsAt,
              price: b.eventId.price,
              status: b.eventId.status
            }
          : null
      }))
    });
  } catch (err) {
    next(err);
  }
}

// R13 cancel my booking and give the seats back
async function cancel(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'That booking does not exist' });

    if (booking.attendeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    // Same problem backwards. Two cancels of one booking would add the seats back
    // twice, and then the event thinks it has more room than it does.
    //
    // So I make the status change the atomic bit, not the maths. Only one request can
    // flip CONFIRMED to CANCELLED, and only that one gives the seats back.
    const cancelled = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'CONFIRMED' },
      { $set: { status: 'CANCELLED' } },
      { new: true }
    );

    if (!cancelled) {
      return res.status(409).json({ message: 'That booking is already cancelled' });
    }

    await Event.updateOne(
      { _id: cancelled.eventId },
      { $inc: { seatsRemaining: cancelled.quantity } }
    );

    return res.json({ booking: cancelled.toJSONView() });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, cancel };
