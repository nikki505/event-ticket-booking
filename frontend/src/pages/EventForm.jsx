import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Field from '../components/Field';

// R5 and R7. One form does both create and edit, because the fields are the same and
// duplicating it would mean fixing every validation message twice.
// Matches the Figma frames "R5 Create Event", "R5 Create Event (validation errors)"
// and "R7 Edit Event".

// The datetime-local input wants "YYYY-MM-DDTHH:mm" and will not accept an ISO string
// with the seconds and timezone on the end, so I trim it here.
function toInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [form, setForm] = useState({
    title: '', venue: '', description: '', startsAt: '', capacity: '', price: ''
  });
  const [seatsInfo, setSeatsInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;

    api.getEvent(id)
      .then((data) => {
        const e = data.event;
        setForm({
          title: e.title, venue: e.venue, description: e.description || '',
          startsAt: toInputValue(e.startsAt),
          capacity: String(e.capacity), price: String(e.price)
        });
        // Useful to show while editing, because capacity cannot go below this number
        setSeatsInfo({ booked: e.capacity - e.seatsRemaining, capacity: e.capacity });
      })
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setErrors({});

    const payload = {
      title: form.title,
      venue: form.venue,
      description: form.description,
      startsAt: new Date(form.startsAt).toISOString(),
      capacity: Number(form.capacity),
      price: Number(form.price)
    };

    try {
      if (editing) await api.updateEvent(id, payload);
      else await api.createEvent(payload);
      navigate('/organiser');
    } catch (err) {
      setMessage(err.message);
      setErrors(err.errors || {});
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading">Loading event…</div>;

  return (
    <div className="page">
      <h1>{editing ? 'Edit event' : 'Create event'}</h1>

      {seatsInfo && (
        <p className="sub">
          {seatsInfo.booked} of {seatsInfo.capacity} seats already booked.
          {seatsInfo.booked > 0 && ' Capacity cannot be set below that number.'}
        </p>
      )}

      {message && <div className="banner error">{message}</div>}

      <form className="form" onSubmit={submit}>
        <Field label="Title" name="title" value={form.title} onChange={change} error={errors.title} />
        <Field label="Venue" name="venue" value={form.venue} onChange={change} error={errors.venue} />

        <Field label="Description (optional)" name="description" error={errors.description}>
          <textarea id="description" name="description" rows="3"
            value={form.description} onChange={change} />
        </Field>

        <Field label="Date and time" name="startsAt" type="datetime-local"
          value={form.startsAt} onChange={change} error={errors.startsAt} />

        <Field label="Capacity" name="capacity" type="number" min="1"
          value={form.capacity} onChange={change} error={errors.capacity} />

        <Field label="Price (AUD)" name="price" type="number" min="0" step="0.01"
          value={form.price} onChange={change} error={errors.price} />

        <div className="btn-row">
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish event'}
          </button>
          <Link to="/organiser">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
