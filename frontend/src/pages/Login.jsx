import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/profile');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-box">
        <div className="auth-brand">DayZer0</div>
        <div className="auth-sub">Sign in to the campus placement portal</div>
        <form onSubmit={handleSubmit}>
          <label className="field-label">I am signing in as</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>
          <label className="field-label">Email</label>
          <input name="email" type="email" onChange={handleChange} required />
          <label className="field-label">Password</label>
          <input name="password" type="password" onChange={handleChange} required />
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 20 }}>Sign in</button>
        </form>
        <div className="auth-switch">New here? <Link to="/register">Create an account</Link></div>
      </div>
    </div>
  );
}