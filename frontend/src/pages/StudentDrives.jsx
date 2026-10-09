import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function StudentDrives() {
  const [drives, setDrives] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState({});
  const [appliedMap, setAppliedMap] = useState({});

  const loadDrives = () => api.get('/eligibility/student/drives').then((res) => setDrives(res.data));
  const loadResumes = () => api.get('/profile/resume').then((res) => setResumes(res.data));
  const loadApplied = () => api.get('/applications/mine').then((res) => {
    const map = {};
    res.data.forEach((a) => { map[a.drive_id] = a.status; });
    setAppliedMap(map);
  });

  useEffect(() => { loadDrives(); loadResumes(); loadApplied(); }, []);

  const apply = async (driveId) => {
    const resumeId = selectedResume[driveId];
    if (!resumeId) return alert('Select a resume first');
    try {
      await api.post(`/applications/${driveId}`, { resume_id: resumeId });
      loadDrives();
      loadApplied();
    } catch (err) { alert(err.response?.data?.error || 'Failed to apply'); }
  };

  const isExpired = (deadline) => new Date(deadline) < new Date(new Date().toDateString());

  return (
    <Layout title="Available drives" description="Drives approved by the placement office, filtered by your eligibility.">
      {drives.length === 0 && <p className="empty-state">No drives available right now.</p>}
      {drives.map((d) => {
        const expired = isExpired(d.deadline);
        const applied = appliedMap[d.drive_id];
        return (
          <div key={d.drive_id} className="record">
            <div className="record-title">{d.job_title}</div>
            <div className="record-meta">{d.package} LPA · {d.location} · Deadline {d.deadline?.slice(0, 10)} · {d.positions} positions</div>

            {expired ? (
              <span className="status status-rejected">Expired</span>
            ) : d.eligible ? (
              <span className="status status-approved">Eligible</span>
            ) : (
              <span className="status status-rejected">Not eligible — {d.reasons.join(', ')}</span>
            )}

            {!expired && d.eligible && (
              <div className="record-actions">
                {applied ? (
                  <span className={`status status-${applied}`}>{applied === 'applied' ? 'Applied' : applied}</span>
                ) : (
                  <>
                    <select value={selectedResume[d.drive_id] || ''} onChange={(e) => setSelectedResume({ ...selectedResume, [d.drive_id]: e.target.value })} style={{ width: 'auto' }}>
                      <option value="">Select resume</option>
                      {resumes.map((r) => <option key={r.resume_id} value={r.resume_id}>{r.original_name}</option>)}
                    </select>
                    <button className="btn btn-sm" onClick={() => apply(d.drive_id)}>Apply</button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </Layout>
  );
}