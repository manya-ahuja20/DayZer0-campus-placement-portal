import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function CompanyDrives() {
  const [drives, setDrives] = useState([]);
  const [form, setForm] = useState({ job_title: '', package: '', location: '', deadline: '', positions: '', job_description: '' });
  const [criteriaForm, setCriteriaForm] = useState({});
  const [editingCriteria, setEditingCriteria] = useState({});
  const isExpired = (deadline) => new Date(deadline) < new Date(new Date().toDateString());

  const loadDrives = () => api.get('/drives/mine').then((res) => setDrives(res.data));
  const loadCriteria = async (driveId) => {
    try {
      const { data } = await api.get(`/eligibility/${driveId}`);
      setCriteriaForm((prev) => ({ ...prev, [driveId]: data }));
    } catch { setCriteriaForm((prev) => ({ ...prev, [driveId]: null })); }
  };

  useEffect(() => { loadDrives(); }, []);
  useEffect(() => { drives.forEach((d) => loadCriteria(d.drive_id)); }, [drives]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/drives', form);
      setForm({ job_title: '', package: '', location: '', deadline: '', positions: '', job_description: '' });
      loadDrives();
    } catch (err) { alert(err.response?.data?.error || 'Failed to create drive'); }
  };

  const handleCriteriaChange = (driveId, field, value) =>
    setCriteriaForm({ ...criteriaForm, [driveId]: { ...criteriaForm[driveId], [field]: value } });

  const submitCriteria = async (driveId) => {
    try {
      const { data } = await api.post(`/eligibility/${driveId}`, criteriaForm[driveId]);
      setCriteriaForm((prev) => ({ ...prev, [driveId]: data }));
      setEditingCriteria((prev) => ({ ...prev, [driveId]: false }));
    } catch (err) { alert(err.response?.data?.error || 'Failed to save criteria'); }
  };

  return (
    <Layout title="My drives" description="Post new drives and manage eligibility criteria.">
      <div className="panel">
        <h3>Post a new drive</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div><label className="field-label">Job title</label><input name="job_title" value={form.job_title} onChange={handleChange} required /></div>
            <div><label className="field-label">Package (LPA)</label><input name="package" type="number" step="0.1" value={form.package} onChange={handleChange} required /></div>
            <div><label className="field-label">Location</label><input name="location" value={form.location} onChange={handleChange} /></div>
            <div><label className="field-label">Application deadline</label><input name="deadline" type="date" min={new Date().toISOString().split('T')[0]} value={form.deadline} onChange={handleChange} required /></div>
            <div><label className="field-label">Open positions</label><input name="positions" type="number" value={form.positions} onChange={handleChange} required /></div>
          </div>
          <label className="field-label">Job description</label>
          <textarea name="job_description" rows="4" value={form.job_description} onChange={handleChange} required />
          <button type="submit" className="btn" style={{ marginTop: 16 }}>Post drive</button>
        </form>
      </div>

      {drives.length === 0 && <p className="empty-state">No drives posted yet.</p>}
      {drives.map((d) => (
        <div key={d.drive_id} className="record">
          <div className="record-title">{d.job_title} <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--ink-soft)' }}>#{d.drive_id}</span></div>
          <div className="record-meta">{d.package} LPA · {d.location} · Deadline {d.deadline?.slice(0, 10)} · {d.positions} positions</div>
          <span className={`status status-${isExpired(d.deadline) ? 'rejected' : d.status}`}>{isExpired(d.deadline) ? 'Expired' : d.status}</span>

          <div className="record-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <label className="field-label">Eligibility criteria</label>
            {criteriaForm[d.drive_id] && !editingCriteria[d.drive_id] ? (
              <>
                <p style={{ fontSize: 13.5 }}>
                  Minimum CGPA: {criteriaForm[d.drive_id].minimum_cgpa ?? 'Not set'} · Max backlogs: {criteriaForm[d.drive_id].maximum_backlogs ?? 'Not set'} · Branches: {criteriaForm[d.drive_id].eligible_branches ?? 'All'}
                </p>
                <button className="btn-outline btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setEditingCriteria((p) => ({ ...p, [d.drive_id]: true }))}>Edit criteria</button>
              </>
            ) : (
              <>
                <div className="form-grid">
                  <input placeholder="Minimum CGPA" type="number" step="0.1" value={criteriaForm[d.drive_id]?.minimum_cgpa || ''} onChange={(e) => handleCriteriaChange(d.drive_id, 'minimum_cgpa', e.target.value)} />
                  <input placeholder="Maximum backlogs" type="number" value={criteriaForm[d.drive_id]?.maximum_backlogs || ''} onChange={(e) => handleCriteriaChange(d.drive_id, 'maximum_backlogs', e.target.value)} />
                </div>
                <input placeholder="Eligible branches, comma separated" style={{ marginTop: 8 }} value={criteriaForm[d.drive_id]?.eligible_branches || ''} onChange={(e) => handleCriteriaChange(d.drive_id, 'eligible_branches', e.target.value)} />
                <button className="btn btn-sm" style={{ marginTop: 10, alignSelf: 'flex-start' }} onClick={() => submitCriteria(d.drive_id)}>Save criteria</button>
              </>
            )}
          </div>

          <div className="record-actions">
            <Link className="btn btn-outline btn-sm" to={`/company/applicants?driveId=${d.drive_id}`}>View applicants</Link>
          </div>
        </div>
      ))}
    </Layout>
  );
}