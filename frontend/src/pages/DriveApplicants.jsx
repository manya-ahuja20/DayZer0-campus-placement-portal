import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function DriveApplicants() {
  const [searchParams] = useSearchParams();
  const [myDrives, setMyDrives] = useState([]);
  const [driveId, setDriveId] = useState(searchParams.get('driveId') || '');
  const [applicants, setApplicants] = useState([]);

  useEffect(() => { api.get('/drives/mine').then((res) => setMyDrives(res.data)); }, []);

  const load = async (id = driveId) => {
    if (!id) return;
    try { const { data } = await api.get(`/applications/drive/${id}`); setApplicants(data); }
    catch (err) { alert(err.response?.data?.error || 'Failed to load applicants'); }
  };

  useEffect(() => {
    const id = searchParams.get('driveId');
    if (id) { setDriveId(id); load(id); }
  }, []);

  const updateStatus = async (applicationId, status) => { await api.patch(`/applications/${applicationId}/status`, { status }); load(); };

  return (
    <Layout title="Applicants" description="Review students who applied and update their status.">
      <div className="panel" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label className="field-label">Select drive</label>
          <select value={driveId} onChange={(e) => setDriveId(e.target.value)}>
            <option value="">Choose a drive</option>
            {myDrives.map((d) => <option key={d.drive_id} value={d.drive_id}>{d.job_title} — #{d.drive_id}</option>)}
          </select>
        </div>
        <button className="btn" onClick={() => load()}>Load</button>
      </div>
      {applicants.length === 0 && <p className="empty-state">No applicants loaded.</p>}
      {applicants.map((a) => (
        <div key={a.application_id} className="record">
          <div className="record-title">{a.name}</div>
          <div className="record-meta">
            {a.branch} · CGPA {a.cgpa} · {a.email} ·{' '} · Match: {a.resume_match_score !== null ? `${a.resume_match_score}%` : 'N/A'}
            <a href={`http://localhost:5000/api/profile/resume/${a.resume_id}/download`} target="_blank" rel="noreferrer">{a.resume_name || 'View resume'}</a>
          </div>
          <span className={`status status-${a.status}`}>{a.status}</span>
          <div className="record-actions">
            <button className="btn btn-sm" onClick={() => updateStatus(a.application_id, 'shortlisted')}>Shortlist</button>
            <button className="btn-danger btn btn-sm" onClick={() => updateStatus(a.application_id, 'rejected')}>Reject</button>
            <button className="btn-outline btn btn-sm" onClick={() => updateStatus(a.application_id, 'selected')}>Select</button>
          </div>
        </div>
      ))}
    </Layout>
  );
}