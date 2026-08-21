import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// The links change depending on the role.
//
// Worth being clear about this: hiding a link is only to keep the interface tidy. It is
// NOT the security. An attendee who typed the organiser URL by hand would still get a
// 403 from the server, because that is where the real check is.

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="nav">
      <Link to="/" className="brand">EventTix</Link>

      {user?.role === 'ATTENDEE' && (
        <>
          <NavLink to="/events">Browse Events</NavLink>
          <NavLink to="/bookings">My Bookings</NavLink>
        </>
      )}

      {user?.role === 'ORGANISER' && (
        <>
          <NavLink to="/organiser">My Events</NavLink>
          <NavLink to="/organiser/events/new">Create Event</NavLink>
        </>
      )}

      {!user && <NavLink to="/events">Browse Events</NavLink>}

      <div className="spacer" />

      {user ? (
        <>
          <span className="who">
            {user.email} ({user.role === 'ORGANISER' ? 'Organiser' : 'Attendee'})
          </span>
          <button className="btn-secondary" onClick={handleLogout}>Sign out</button>
        </>
      ) : (
        <>
          <NavLink to="/login">Sign in</NavLink>
          <NavLink to="/register">Register</NavLink>
        </>
      )}
    </nav>
  );
}
