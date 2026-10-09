import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const NAV_LINKS = {
  student: [
    { to: '/student/drives', label: 'Drives' },
    { to: '/student/applications', label: 'My Applications' },
    { to: '/student/interviews', label: 'Interviews' },
    { to: '/student/notifications', label: 'Notifications' },
    { to: '/profile', label: 'Profile' },
  ],
  company: [
    { to: '/drives', label: 'My Drives' },
    { to: '/company/applicants', label: 'Applicants' },
    { to: '/company/interviews', label: 'Interviews' },
    { to: '/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin/companies', label: 'Companies' },
    { to: '/admin/drives', label: 'Review Drives' },
    { to: '/profile', label: 'Profile' },
    ],
};

export default function Layout({ title, description, children }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV_LINKS[auth.role] || [];
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (auth.role !== 'student') return;
    const load = () =>
      api.get('/notifications')
        .then((r) => setUnread(r.data.filter((n) => n.status === 'unread').length))
        .catch(() => {});
    load();
    window.addEventListener('notifs-changed', load);
    return () => window.removeEventListener('notifs-changed', load);
  }, [auth.role]);

  return (
    <div>
      <div className="app-topbar">
        <div className="app-brand">DayZer0<span>Campus Placement Portal</span></div>
        <div className="app-user">
          <span>Signed in as <b>{auth.role}</b></span>
          <button className="btn btn-outline-dark btn-sm" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </div>
      </div>
      <div className="app-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>{l.label}{l.to === '/student/notifications' && unread > 0 ? ` (${unread})` : ''}</NavLink>
        ))}
      </div>
      <div className="app-main">
        {(title || description) && (
          <div className="page-head">
            {title && <h1>{title}</h1>}
            {description && <p>{description}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}