import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Field from '../components/Field';

// R10 and R11. Matches the Figma frames "R10 Book Tickets", "R10 Booking Success" and
// "R11 Sold Out / Capacity Conflict".

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [fieldError, setFieldError] = useState('');
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState('error');
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getEvent(id)
      .then((data) => setEvent(data.event))
      .catch((err) => setMessage(err.message));
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setFieldError('');

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      setFieldError('You can book between 1 and 10 tickets');
      return;
    }

    // Not signed in, so send them to log in first and come straight back here.
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    setBusy(true);
    try {
      const data = await api.book({ eventId: id, quantity: qty });
      setBooking(data.booking);
      setEvent({ ...event, seatsRemaining: data.seatsRemaining });
    } catch (err) {
      // A 409 means the seats went while this request was on its way. The server tells me
      // how many are actually left, so I update the page to show the truth.
      setMessage(err.message);
      setMessageKind('error');
      if (err.errors?.quantity) setFieldError(err.errors.quantity);
      if (typeof err.seatsRemaining === 'number') {
        setEvent({ ...event, seatsRemaining: err.seatsRemaining });
      }
    } finally {
      setBusy(false);
    }
  }

  if (!event) {
    return (
      <div className="page">
        {message ? <div className="banner error">{message}</div> : <div className="loading">Loading…</div>}
      </div>
    );
  }

  // Success state, after a booking goes through
  if (booking) {
    return (
      <div className="page">
        <h1>Booking confirmed</h1>
        <div className="banner success">
          Your booking reference is <span className="reference">{booking.reference}</span>
        </div>
        <p className="sub">
          {event.title} · {booking.quantity} {booking.quantity === 1 ? 'ticket' : 'tickets'} ·
          {' '}{event.venue}
        </p>
        <div className="btn-row">
          <Link to="/bookings"><button className="btn-primary">View my bookings</button></Link>
          <Link to="/events"><button className="btn-secondary">Browse more events</button></Link>
        </div>
      </div>
    );
  }

  const when = new Date(event.startsAt).toLocaleString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="page">
      <h1>{event.title}</h1>
      <p className="sub">
        {event.venue} · {when} · {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)} per ticket`}
      </p>

      {message && <div className={`banner ${messageKind}`}>{message}</div>}

      {/* Only show the low seat warning when there is no error on screen. If a booking was
          just rejected the error banner already says how many seats are left, and showing
          the warning as well repeated the same sentence twice in two different colours. */}
      {!message && (
        event.seatsRemaining === 0 ? (
          <div className="banner warn">This event is sold out.</div>
        ) : event.seatsRemaining <= 10 ? (
          <div className="banner warn">
            Only {event.seatsRemaining} {event.seatsRemaining === 1 ? 'seat remains' : 'seats remain'} for this event.
          </div>
        ) : null
      )}

      {event.status === 'CANCELLED' ? (
        <div className="banner error">This event has been cancelled.</div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <Field label="Quantity (1 to 10)" name="quantity" type="number" min="1" max="10"
            value={quantity} onChange={(e) => setQuantity(e.target.value)} error={fieldError} />

          <div className="btn-row">
            <button className="btn-primary" type="submit"
              disabled={busy || event.seatsRemaining === 0}>
              {busy ? 'Booking…' : 'Book tickets'}
            </button>
            <Link to="/events">Back to events</Link>
          </div>
        </form>
      )}
    </div>
  );
}
