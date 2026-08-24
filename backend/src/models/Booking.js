const crypto = require('crypto');
const mongoose = require('mongoose');

// Booking model. R10, R12, R13.
//
// Two states only. I thought about PENDING and PAID but there are no payments, so
// they could never happen and each one would need its own guard and test.

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

// the code the attendee sees, like ETB-7Q4M-2XKD.
// crypto.randomBytes not Math.random because it is far less likely to repeat, and
// the field has a unique index as a backup.
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
