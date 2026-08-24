const jwt = require('jsonwebtoken');
const User = require('../models/User');

// R3 and R4. Two checks, kept separate on purpose:
//   protect      are you signed in at all
//   requireRole  are you the right kind of user
//
// Is it actually yours is a third check, but that needs the record from the database
// so it happens in the controller.
//
// protect has to run first. There is no role until I know who you are.

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

    // look the user up again instead of trusting the role in the token, because the
    // token would still say the old role if it changed
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'You need to sign in to do that' });
    }

    req.user = user;
    next();
  } catch (err) {
    // expired or tampered, same answer either way
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
