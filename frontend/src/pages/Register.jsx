import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Field from '../components/Field';

// R1. Matches the Figma frames "R1 Register" and "R1 Register (validation errors)".

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', role: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // The same rules also run on the server. I check here as well only so the user gets an
  // answer straight away instead of waiting for a round trip.
  function checkBeforeSending() {
    const found = {};
    if (!form.email.trim()) found.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) found.email = 'Enter a valid email address';
    if (!form.password) found.password = 'Password is required';
    else if (form.password.length < 8) found.password = 'Password must be at least 8 characters';
    if (!form.role) found.role = 'Select a role';
    return found;
  }

  async function submit(e) {
    e.preventDefault();
    setMessage('');

    const clientErrors = checkBeforeSending();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setMessage('Please correct the highlighted fields.');
      return;
    }

    setBusy(true);
    setErrors({});

    try {
      const user = await register(form.email, form.password, form.role);
      navigate(user.role === 'ORGANISER' ? '/organiser' : '/events', { replace: true });
    } catch (err) {
      setMessage(err.message);
      setErrors(err.errors || {});
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Create your account</h1>
      <p className="sub">
        Choose the role you need. Organisers publish events, attendees book tickets.
      </p>

      {message && <div className="banner error">{message}</div>}

      <form className="form" onSubmit={submit}>
        <Field label="Email" name="email" type="email" value={form.email}
          onChange={change} error={errors.email} autoComplete="email" />

        <Field label="Password" name="password" type="password" value={form.password}
          onChange={change} error={errors.password} autoComplete="new-password" />

        <Field label="Role" name="role" error={errors.role}>
          <select id="role" name="role" value={form.role} onChange={change}>
            <option value="">Select a role…</option>
            <option value="ATTENDEE">Attendee, I want to book tickets</option>
            <option value="ORGANISER">Organiser, I want to publish events</option>
          </select>
        </Field>

        <div className="btn-row">
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
          <Link to="/login">Sign in instead</Link>
        </div>
      </form>
    </div>
  );
}
