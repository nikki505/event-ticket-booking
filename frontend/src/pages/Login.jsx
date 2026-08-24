import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Field from '../components/Field';

// R2. Figma frames R2 Login and R2 Login (error).

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setErrors({});

    try {
      const user = await login(form.email, form.password);

      // put them back where they came from, or their role home page
      const wanted = location.state?.from;
      if (wanted) navigate(wanted, { replace: true });
      else navigate(user.role === 'ORGANISER' ? '/organiser' : '/events', { replace: true });
    } catch (err) {
      setMessage(err.message);
      setErrors(err.errors || {});
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Sign in</h1>
      <p className="sub">One sign in for both organisers and attendees.</p>

      {message && <div className="banner error">{message}</div>}

      <form className="form" onSubmit={submit} noValidate>
        <Field label="Email" name="email" type="email" value={form.email}
          onChange={change} error={errors.email} autoComplete="email" />

        <Field label="Password" name="password" type="password" value={form.password}
          onChange={change} error={errors.password} autoComplete="current-password" />

        <div className="btn-row">
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <Link to="/register">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
