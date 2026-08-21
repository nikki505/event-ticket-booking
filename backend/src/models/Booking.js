const crypto = require('crypto');
const mongoose = require('mongoose');

// Booking model. Covers R10, R12 and R13.
//
// A booking only has two states. I thought about adding PENDING and PAID but there
// are no payments in this project, so those states could never actually happen and
// every extra state would need its own guard and its own test.

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    attendeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    status: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED'],
      default: 'CONFIRMED'
    }
  },
  { timestamps: true }
);

// Reference the attendee actually sees, like ETB-7Q4M-2XKD.
// I used crypto.randomBytes instead of Math.random because random bytes are far less
// likely to repeat, and the reference field has a unique index as a backstop anyway.
bookingSchema.statics.makeReference = function () {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0 or 1, they look alike
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i === 3) out += '-';
  }
  return 'ETB-' + out;
};

bookingSchema.methods.toJSONView = function () {
  return {
    id: this._id,
    reference: this.reference,
    eventId: this.eventId,
    attendeeId: this.attendeeId,
    quantity: this.quantity,
    status: this.status,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Booking', bookingSchema);
