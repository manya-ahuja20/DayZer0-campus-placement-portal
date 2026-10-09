import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function AdminDrives() {
  const [drives, setDrives] = useState([]);
  const loadDrives = () => api.get('/drives/all').then((res) => setDrives(res.data));
  useEffect(() => { loadDrives(); }, []);

  const review = async (driveId, status) => { await api.patch(`/drives/${driveId}/review`, { status }); loadDrives(); };
  const verifyCompany = async (companyId) => { await api.patch(`/drives/company/${companyId}/verify`, { status: 'verified' }); loadDrives(); };

  return (
    <Layout title="Review drives" description="Approve or reject drives posted by companies, and verify recruiters.">
      {drives.length === 0 && <p className="empty-state">No drives to review.</p>}
      {drives.map((d) => (
        <div key={d.drive_id} className="record">
          <div className="record-title">{d.job_title} <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--ink-soft)' }}>#{d.drive_id}</span></div>
          <div className="record-meta">{d.company_name} · {d.package} LPA · {d.location} · Deadline {d.deadline?.slice(0, 10)}</div>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
            Eligibility — Min CGPA: {d.minimum_cgpa ?? 'Not set'} · Max backlogs: {d.maximum_backlogs ?? 'Not set'} · Branches: {d.eligible_branches ?? 'All'}
          </p>
          <span className={`status status-${d.status}`}>{d.status}</span>
          <div className="record-meta" style={{ marginTop: 4 }}>
            Company verification: <span className={`status status-${d.verification_status}`}>{d.verification_status}</span>
          </div>
          <div className="record-actions">
            <button className="btn btn-sm" onClick={() => review(d.drive_id, 'approved')}>Approve</button>
            <button className="btn-danger btn btn-sm" onClick={() => review(d.drive_id, 'rejected')}>Reject</button>
            {d.verification_status !== 'verified' && (
              <button className="btn-outline btn btn-sm" onClick={() => verifyCompany(d.company_id)}>Verify company</button>
            )}
          </div>
        </div>
      ))}
    </Layout>
  );
}