const mongoose = require('mongoose');

// Event model. Covers R5 to R8.
//
// The important field here is seatsRemaining. I decided to STORE it rather than
// work it out by counting bookings every time (decision D004 in my decision log).
//
// Reason: to stop overbooking I need to check "is there room?" and "take the room"
// without anything happening in between. With a stored number I can do that in one
// query. If I counted bookings first and then saved a new total, two people booking
// the last seat at the same time could both pass the check.
//
// The downside is the number could drift away from reality if I had a bug, so on the
// attendee list screen I show a total that has to equal capacity minus seatsRemaining.
// If those two ever disagree I know something is wrong.

const eventSchema = new mongoose.Schema(
  {
    organiserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    venue: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    seatsRemaining: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PUBLISHED', 'CANCELLED'],
      default: 'PUBLISHED'
    }
  },
  { timestamps: true }
);

// The public listing always asks for the same thing: published events in the future.
// Indexing those two fields together keeps that query fast as the collection grows.
eventSchema.index({ status: 1, startsAt: 1 });

eventSchema.methods.toJSONView = function () {
  return {
    id: this._id,
    organiserId: this.organiserId,
    title: this.title,
    description: this.description,
    venue: this.venue,
    startsAt: this.startsAt,
    capacity: this.capacity,
    seatsRemaining: this.seatsRemaining,
    price: this.price,
    status: this.status,
    soldOut: this.seatsRemaining === 0
  };
};

module.exports = mongoose.model('Event', eventSchema);
