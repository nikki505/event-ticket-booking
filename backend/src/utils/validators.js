// All the input rules in one place so the same wording is used everywhere.
// These match the validation table in docs/01-problem-and-requirements.md section 1.10.
//
// Everything here runs on the SERVER (requirement N1). The React form checks the same
// things, but only so the user gets a fast answer. Anyone can call the API directly with
// something like Postman, so the browser check cannot be the one that counts.

// Each function returns an object of { field: message }. Empty object means it passed.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body) {
  const errors = {};
  const email = (body.email || '').trim();
  const password = body.password || '';
  const role = body.role || '';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';

  if (!role) errors.role = 'Select a role';
  else if (role !== 'ORGANISER' && role !== 'ATTENDEE') errors.role = 'Select a role';

  return errors;
}

function validateLogin(body) {
  const errors = {};
  if (!(body.email || '').trim()) errors.email = 'Email is required';
  if (!body.password) errors.password = 'Password is required';
  return errors;
}

function validateEvent(body) {
  const errors = {};
  const title = (body.title || '').trim();
  const venue = (body.venue || '').trim();

  if (!title) errors.title = 'Title is required';
  else if (title.length < 3 || title.length > 120) {
    errors.title = 'Title must be between 3 and 120 characters';
  }

  if (!venue) errors.venue = 'Venue is required';
  else if (venue.length < 3 || venue.length > 160) {
    errors.venue = 'Venue must be between 3 and 160 characters';
  }

  if (!body.startsAt) {
    errors.startsAt = 'Event date is required';
  } else {
    const when = new Date(body.startsAt);
    if (isNaN(when.getTime())) errors.startsAt = 'Enter a valid date and time';
    else if (when.getTime() <= Date.now()) errors.startsAt = 'Event date must be in the future';
  }

  // Number(...) on its own would accept "12abc" as NaN but also accept 12.5, so I check
  // for a whole number as well. Capacity of half a seat does not mean anything.
  const capacity = Number(body.capacity);
  if (body.capacity === undefined || body.capacity === '') {
    errors.capacity = 'Capacity is required';
  } else if (!Number.isInteger(capacity) || capacity < 1) {
    errors.capacity = 'Capacity must be a whole number of at least 1';
  } else if (capacity > 10000) {
    errors.capacity = 'Capacity cannot be more than 10000';
  }

  const price = Number(body.price);
  if (body.price === undefined || body.price === '') {
    errors.price = 'Price is required';
  } else if (isNaN(price)) {
    errors.price = 'Enter a valid price';
  } else if (price < 0) {
    errors.price = 'Price cannot be negative';
  } else if (Math.round(price * 100) !== price * 100) {
    errors.price = 'Price can have at most 2 decimal places';
  }

  return errors;
}

function validateBookingQuantity(body) {
  const errors = {};
  const quantity = Number(body.quantity);

  if (body.quantity === undefined || body.quantity === '') {
    errors.quantity = 'Quantity is required';
  } else if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    errors.quantity = 'You can book between 1 and 10 tickets';
  }

  return errors;
}

// Note there is one rule that is NOT in this file: "quantity must not be more than the
// seats left". I cannot check that here because it depends on what is in the database
// right now, and it could change between checking and saving. That rule lives inside the
// atomic update in bookingController instead.

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

module.exports = {
  validateRegister,
  validateLogin,
  validateEvent,
  validateBookingQuantity,
  hasErrors
};
