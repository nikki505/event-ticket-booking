import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

// R9. Figma frames R9 Event Listing and R9 Event Listing (empty state).

function formatWhen(iso) {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

function formatPrice(price) {
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
}

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.listEvents()
      .then((data) => setEvents(data.events))
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading events…</div>;

  return (
    <div className="page">
      <h1>Upcoming events</h1>
      <p className="sub">Events that have already happened or been cancelled are not shown.</p>

      {message && <div className="banner error">{message}</div>}

      {/* empty state, otherwise the page looks broken */}
      {events.length === 0 ? (
        <div className="empty">
          <h2>No upcoming events just yet</h2>
          <p>When an organiser publishes an event it will appear here.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      ) : (
        <div className="grid">
          {events.map((event) => (
            <div className="card event-card" key={event.id}>
              <h3>{event.title}</h3>
              <div className="meta">{event.venue} · {formatWhen(event.startsAt)}</div>
              <div className="price">{formatPrice(event.price)}</div>

              {/* sold out events stay in the grid but cannot be booked */}
              <div className={`seats${event.seatsRemaining > 0 && event.seatsRemaining <= 10 ? ' low' : ''}`}>
                {event.soldOut
                  ? 'Sold out'
                  : `${event.seatsRemaining} of ${event.capacity} seats left`}
              </div>

              {event.soldOut ? (
                <button className="btn-secondary" disabled style={{ width: '100%' }}>Sold out</button>
              ) : (
                <Link to={`/events/${event.id}`}>
                  <button className="btn-primary" style={{ width: '100%' }}>Book tickets</button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
