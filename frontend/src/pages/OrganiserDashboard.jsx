import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

// R6 and R8. Figma frames R6 Organiser Dashboard and R8 Cancel Event Confirm.

export default function OrganiserDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState('error');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api.myEvents();
      setEvents(data.events);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function doCancel() {
    setBusy(true);
    try {
      await api.cancelEvent(confirming.id);
      setMessageKind('success');
      setMessage(`${confirming.title} has been cancelled and removed from the public listing.`);
      setConfirming(null);
      await load();
    } catch (err) {
      setMessageKind('error');
      setMessage(err.message);
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading">Loading your events…</div>;

  return (
    <div className="page">
      <h1>My events</h1>
      <p className="sub">Only events you created appear here.</p>

      {message && <div className={`banner ${messageKind}`}>{message}</div>}

      {events.length === 0 ? (
        <div className="empty">
          <h2>You have not published an event yet</h2>
          <p>Create your first event and it will appear here and in the public listing.</p>
          <Link to="/organiser/events/new"><button className="btn-primary">Create event</button></Link>
        </div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Event</th><th>Date</th><th>Seats remaining</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <strong>{event.title}</strong>
                    <div className="muted">{event.venue}</div>
                  </td>
                  <td>{new Date(event.startsAt).toLocaleDateString('en-AU', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}</td>
                  <td>{event.seatsRemaining} of {event.capacity}</td>
                  <td>
                    <span className={`badge ${event.status.toLowerCase()}`}>{event.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/organiser/events/${event.id}/attendees`}>
                        <button className="btn-secondary">Attendees</button>
                      </Link>
                      {/* a cancelled event cannot be edited or cancelled again */}
                      {event.status === 'PUBLISHED' && (
                        <>
                          <Link to={`/organiser/events/${event.id}/edit`}>
                            <button className="btn-secondary">Edit</button>
                          </Link>
                          <button className="btn-secondary" onClick={() => setConfirming(event)}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="btn-row" style={{ marginTop: 20 }}>
            <Link to="/organiser/events/new"><button className="btn-primary">Create event</button></Link>
          </div>
        </>
      )}

      {confirming && (
        <div className="modal-backdrop" onClick={() => !busy && setConfirming(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Cancel this event?</h2>
            <p>
              It will stop accepting bookings and disappear from the public listing.
              Existing bookings are kept so attendees can still see their history.
            </p>
            <div className="btn-row">
              <button className="btn-danger" onClick={doCancel} disabled={busy}>
                {busy ? 'Cancelling…' : 'Yes, cancel event'}
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
