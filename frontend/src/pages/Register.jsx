import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { role, ...form });
      alert('Registered. You can now sign in.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-box" style={{ width: 440 }}>
        <div className="auth-brand">Create an account</div>
        <div className="auth-sub">Register as a student, company or admin</div>
        <label className="field-label">Account type</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="company">Company</option>
          <option value="admin">Admin</option>
        </select>
        <form onSubmit={handleSubmit}>
          {role === 'student' && (
            <div className="form-grid">
              <div><label className="field-label">Roll number</label><input name="roll_no" onChange={handleChange} required /></div>
              <div><label className="field-label">Full name</label><input name="name" onChange={handleChange} required /></div>
              <div><label className="field-label">Branch</label><input name="branch" onChange={handleChange} /></div>
              <div><label className="field-label">Batch</label><input name="batch" onChange={handleChange} /></div>
              <div><label className="field-label">CGPA</label><input name="cgpa" type="number" step="0.01" onChange={handleChange} /></div>
              <div><label className="field-label">Active backlogs</label><input name="backlogs" type="number" onChange={handleChange} /></div>
              <div><label className="field-label">Email</label><input name="email" type="email" onChange={handleChange} required /></div>
              <div><label className="field-label">Phone</label><input name="phone" onChange={handleChange} /></div>
            </div>
          )}
          {role === 'company' && (
            <div className="form-grid">
              <div><label className="field-label">Company name</label><input name="company_name" onChange={handleChange} required /></div>
              <div><label className="field-label">Industry</label><input name="industry" onChange={handleChange} /></div>
              <div><label className="field-label">Recruiter name</label><input name="recruiter_name" onChange={handleChange} /></div>
              <div><label className="field-label">Recruiter email</label><input name="recruiter_email" type="email" onChange={handleChange} required /></div>
              <div><label className="field-label">Recruiter phone</label><input name="recruiter_phone" onChange={handleChange} /></div>
            </div>
          )}
          {role === 'admin' && (
            <div className="form-grid">
              <div><label className="field-label">Name</label><input name="name" onChange={handleChange} required /></div>
              <div><label className="field-label">Email</label><input name="email" type="email" onChange={handleChange} required /></div>
              <div><label className="field-label">Phone</label><input name="phone" onChange={handleChange} /></div>
            </div>
          )}
          <label className="field-label">Password</label>
          <input name="password" type="password" onChange={handleChange} required />
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 20 }}>Register</button>
        </form>
        <div className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}