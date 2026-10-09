import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const load = () => api.get('/applications/mine').then((res) => setApps(res.data));
  useEffect(() => { load(); }, []);

  const withdraw = async (applicationId) => {
    try { await api.delete(`/applications/${applicationId}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to withdraw'); }
  };

  return (
    <Layout title="My applications" description="Track the status of drives you've applied to.">
      {apps.length === 0 && <p className="empty-state">You haven't applied to any drives yet.</p>}
      {apps.map((a) => (
        <div key={a.application_id} className="record">
          <div className="record-title">{a.job_title}</div>
          <div className="record-meta">{a.package} LPA · {a.location} · Applied {a.application_date?.slice(0, 10)}</div>
          <span className={`status status-${a.status}`}>{a.status}</span>
          {a.resume_match_score !== null && (
            <div style={{ marginTop: 8, fontSize: 13.5 }}>
              <b>Resume match: {a.resume_match_score}%</b>
              <div className="record-meta" style={{ marginTop: 2 }}>{a.feedback}</div>
            </div>
          )}
          {a.status === 'applied' && (
            <div className="record-actions"><button className="btn-danger btn btn-sm" onClick={() => withdraw(a.application_id)}>Withdraw</button></div>
          )}
        </div>
      ))}
    </Layout>
  );
}