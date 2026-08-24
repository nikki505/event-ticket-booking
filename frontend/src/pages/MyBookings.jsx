import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

// R12 and R13. Figma frames R12 My Bookings and R13 Cancel Booking Confirm.

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState('error');
  const [confirming, setConfirming] = useState(null); // booking waiting on the dialog
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api.myBookings();
      setBookings(data.bookings);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function doCancel() {
    setBusy(true);
    setMessage('');
    try {
      await api.cancelBooking(confirming.id);
      setMessageKind('success');
      setMessage(`Booking ${confirming.reference} cancelled and ${confirming.quantity} ${confirming.quantity === 1 ? 'seat has' : 'seats have'} been released.`);
      setConfirming(null);
      await load(); // reload so the badge updates
    } catch (err) {
      setMessageKind('error');
      setMessage(err.message);
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading">Loading your bookings…</div>;

  return (
    <div className="page">
      <h1>My bookings</h1>
      <p className="sub">Cancelled bookings stay listed so you can still see your history.</p>

      {message && <div className={`banner ${messageKind}`}>{message}</div>}

      {bookings.length === 0 ? (
        <div className="empty">
          <h2>No bookings yet</h2>
          <p>Once you book tickets your reference will appear here.</p>
          <Link to="/events"><button className="btn-primary">Browse events</button></Link>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Event</th><th>Qty</th><th>Reference</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.event ? b.event.title : 'Event removed'}</strong>
                  <div className="muted">
                    {b.event && `${b.event.venue} · ${new Date(b.event.startsAt).toLocaleDateString('en-AU')}`}
                  </div>
                </td>
                <td>{b.quantity}</td>
                <td className="muted">{b.reference}</td>
                <td>
                  <span className={`badge ${b.status.toLowerCase()}`}>{b.status}</span>
                </td>
                <td>
                  {/* only confirmed bookings can be cancelled, and the server refuses
                      a second cancel anyway */}
                  {b.status === 'CONFIRMED' && (
                    <button className="btn-secondary" onClick={() => setConfirming(b)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* R13 AC4, nothing changes unless they confirm */}
      {confirming && (
        <div className="modal-backdrop" onClick={() => !busy && setConfirming(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Cancel this booking?</h2>
            <p>
              Your {confirming.quantity} {confirming.quantity === 1 ? 'seat' : 'seats'} will be
              released back to the event straight away. This cannot be undone.
            </p>
            <div className="btn-row">
              <button className="btn-danger" onClick={doCancel} disabled={busy}>
                {busy ? 'Cancelling…' : 'Yes, cancel booking'}
              </button>
              <button className="btn-secondary" onClick={() => setConfirming(null)} disabled={busy}>
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
