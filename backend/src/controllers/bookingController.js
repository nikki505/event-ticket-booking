const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { validateBookingQuantity, hasErrors } = require('../utils/validators');

// R10 book tickets, and R11 never let the event be oversold.
//
// This is the most important function in my project so I want to explain the thinking.
//
// The obvious way to write it would be:
//     1. read the event
//     2. if (event.seatsRemaining >= quantity)
//     3. event.seatsRemaining = event.seatsRemaining - quantity
//     4. save
//
// That looks fine and it passes every test I can do by hand. But it is broken. Between
// step 2 and step 4 the server can start handling somebody else's request. If two people
// both ask for the last seat at the same time, they can BOTH read seatsRemaining as 1,
// both decide there is room, and both save. The event is now oversold and the counter
// can even go negative.
//
// So instead I do the check and the subtraction as ONE database operation. The filter
// says "find this event, but only if it still has enough seats" and the update says
// "take the seats". MongoDB does that atomically on a single document, so whichever
// request gets there second simply does not match, and gets null back.
//
// This is requirement R11.1 in my design, which I derived from R11 and R13.

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

    // The atomic bit. Notice seatsRemaining: { $gte: quantity } is in the FILTER, not in
    // an if statement above. That is the whole point.
    const claimed = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'PUBLISHED',
        seatsRemaining: { $gte: quantity }
      },
      { $inc: { seatsRemaining: -quantity } },
      { new: true }
    );

    // No document matched, which means the seats went while this request was in flight.
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

    // The seats are mine now, so write the booking row.
    let booking;
    try {
      booking = await Booking.create({
        reference: Booking.makeReference(),
        eventId: claimed._id,
        attendeeId: req.user._id,
        quantity: quantity
      });
    } catch (createErr) {
      // If saving the booking fails I have already taken the seats, so I have to give
      // them back. Otherwise those seats would be lost forever and the event would look
      // fuller than it really is. This is the compensating action from decision D009.
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

    // Same idea as booking, just the other way round.
    //
    // If I only guarded the seat maths, two cancel requests for the same booking could
    // both run and the seats would be added back TWICE. Then the event would think it
    // has more room than it does and could oversell later.
    //
    // So the thing I make atomic is the STATUS CHANGE. "Set this to CANCELLED, but only
    // if it is still CONFIRMED." Only one request can win that, and only the winner is
    // allowed to hand the seats back.
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
