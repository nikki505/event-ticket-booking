const mongoose = require('mongoose');

// Event model. R5 to R8.
//
// seatsRemaining is stored here instead of counted from the bookings. That is D004.
// I need to check for room and take the room in one query, and I can only do that
// with a number I can update directly.
//
// Downside is it could drift if I make a mistake. So the attendee list shows a total
// worked out the other way, and the two have to match.

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

// the public listing always filters on these two, so index them together
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
