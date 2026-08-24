import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

// R14. Figma frame R14 Attendee List.

export default function AttendeeList() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.eventBookings(id)
      .then(setData)
      .catch((err) => setMessage(err.message));
  }, [id]);

  if (message) return <div className="page"><div className="banner error">{message}</div></div>;
  if (!data) return <div className="loading">Loading attendees…</div>;

  // These two are worked out different ways. confirmedSeats adds up the bookings,
  // crossCheck is capacity minus the stored number. If they ever disagree the counter
  // has drifted. Safety net for D004.
  const numbersAgree = data.confirmedSeats === data.crossCheck;

  return (
    <div className="page">
      <h1>{data.event.title}</h1>
      <p className="sub">
        Confirmed seats: {data.confirmedSeats} of {data.event.capacity} ·
        {' '}Remaining: {data.event.seatsRemaining} ·
        {' '}Cross check: {data.crossCheck}
      </p>

      {!numbersAgree && (
        <div className="banner error">
          The confirmed seat total ({data.confirmedSeats}) does not match capacity minus
          seats remaining ({data.crossCheck}). The stored counter has drifted.
        </div>
      )}

      {data.bookings.length === 0 ? (
        <div className="empty">
          <h2>Nobody has booked yet</h2>
          <p>Bookings will appear here as attendees reserve their seats.</p>
          <Link to="/organiser"><button className="btn-primary">Back to my events</button></Link>
        </div>
      ) : (
        <>
          <table>
            <thead>
              <tr><th>Attendee</th><th>Qty</th><th>Reference</th><th>Status</th><th>Booked</th></tr>
            </thead>
            <tbody>
              {data.bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.attendeeEmail}</td>
                  <td>{b.quantity}</td>
                  <td className="muted">{b.reference}</td>
                  <td><span className={`badge ${b.status.toLowerCase()}`}>{b.status}</span></td>
                  <td className="muted">{new Date(b.createdAt).toLocaleDateString('en-AU')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="btn-row" style={{ marginTop: 20 }}>
            <Link to="/organiser"><button className="btn-secondary">Back to my events</button></Link>
          </div>
        </>
      )}
    </div>
  );
}
