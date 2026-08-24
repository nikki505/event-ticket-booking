const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model. R1 register with a role, N2 hash the password.
// Only two roles, so an enum is enough. A roles table would be overkill here.

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      // unique index so the database blocks duplicates too, not just my code
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

// keeps bcrypt out of the controller
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

userSchema.methods.checkPassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// strips the hash so it cannot end up in a response by accident
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    email: this.email,
    role: this.role
  };
};

module.exports = mongoose.model('User', userSchema);
