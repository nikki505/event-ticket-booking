const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model. Covers requirement R1 (register with a role) and N2 (hash passwords).
// I only need two roles for this project, so I used an enum instead of a separate
// roles collection. That keeps the permission checks simple to test.

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      // unique index means the database rejects a duplicate even if two requests
      // arrive at the same moment. Checking in the controller alone would not.
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['ORGANISER', 'ATTENDEE'],
      required: [true, 'Role is required']
    }
  },
  { timestamps: true }
);

// Helper so the controller never has to touch bcrypt directly.
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

userSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// I never want the hash going out in a JSON response by accident, so I strip it here.
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    email: this.email,
    role: this.role
  };
};

module.exports = mongoose.model('User', userSchema);
