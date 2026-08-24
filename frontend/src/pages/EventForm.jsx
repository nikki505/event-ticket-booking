import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Field from '../components/Field';

// R5 and R7. One form for create and edit, the fields are the same and duplicating it
// would mean fixing every message twice. Figma frames R5 Create Event and R7 Edit Event.

// datetime-local wants YYYY-MM-DDTHH:mm and rejects a full ISO string, so trim it
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
        // shown while editing, capacity cannot go below this
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

    // the browser is not validating any more, so an empty date reaches here and
    // new Date('').toISOString() throws. Send the raw value and let the server answer.
    const when = new Date(form.startsAt);
    const startsAt = isNaN(when.getTime()) ? form.startsAt : when.toISOString();

    const payload = {
      title: form.title,
      venue: form.venue,
      description: form.description,
      startsAt: startsAt,
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

      <form className="form" onSubmit={submit} noValidate>
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
