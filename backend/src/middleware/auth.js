const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authorisation middleware. Covers R3 and R4.
//
// There are two separate checks and I kept them apart on purpose:
//   protect      is this a real logged in user at all?
//   requireRole  is this user the right KIND of user?
//
// Ownership ("is this actually YOUR event?") is a third check, but that one needs the
// database record, so it happens in the controller once the record is loaded.
//
// The order matters. protect has to run before requireRole because there is no role
// until I know who the user is.

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function protect(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'You need to sign in to do that' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // I look the user up again rather than trusting the role inside the token.
    // If someone's role changed, or their account was removed, the token would still
    // say the old thing until it expired.
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'You need to sign in to do that' });
    }

    req.user = user;
    next();
  } catch (err) {
    // Covers an expired token and a tampered one. Same answer either way, because
    // telling the caller which one it was does not help them do anything useful.
    return res.status(401).json({ message: 'Your session has expired, please sign in again' });
  }
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'You need to sign in to do that' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Your account type cannot do that' });
    }
    next();
  };
}

module.exports = { protect, requireRole, signToken };
