import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import { useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import MyBookings from './pages/MyBookings';
import OrganiserDashboard from './pages/OrganiserDashboard';
import EventForm from './pages/EventForm';
import AttendeeList from './pages/AttendeeList';

// Stops the wrong role reaching a page. This is about not showing someone a broken
// screen. The server does the real enforcing, so deleting this would be untidy but
// still safe.
function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading">Loading…</div>;

  // remember where they were going so they land back there after signing in. R10 AC4.
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (role && user.role !== role) {
    return (
      <div className="page">
        <div className="banner error">
          That page is for {role === 'ORGANISER' ? 'organisers' : 'attendees'} only.
        </div>
      </div>
    );
  }

  return children;
}

// sends a signed in user to the right home page for their role
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading…</div>;
  if (!user) return <Navigate to="/events" replace />;
  return <Navigate to={user.role === 'ORGANISER' ? '/organiser' : '/events'} replace />;
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* anyone can browse, you only need an account to book */}
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />

        <Route path="/bookings" element={
          <RequireRole role="ATTENDEE"><MyBookings /></RequireRole>
        } />

        <Route path="/organiser" element={
          <RequireRole role="ORGANISER"><OrganiserDashboard /></RequireRole>
        } />
        <Route path="/organiser/events/new" element={
          <RequireRole role="ORGANISER"><EventForm /></RequireRole>
        } />
        <Route path="/organiser/events/:id/edit" element={
          <RequireRole role="ORGANISER"><EventForm /></RequireRole>
        } />
        <Route path="/organiser/events/:id/attendees" element={
          <RequireRole role="ORGANISER"><AttendeeList /></RequireRole>
        } />

        <Route path="*" element={
          <div className="page"><h1>Page not found</h1></div>
        } />
      </Routes>
    </>
  );
}
