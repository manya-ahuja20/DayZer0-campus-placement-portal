import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const load = () => api.get('/drives/companies').then((res) => setCompanies(res.data));
  useEffect(() => { load(); }, []);

  const verify = async (companyId, status) => {
    await api.patch(`/drives/company/${companyId}/verify`, { status });
    load();
  };

  return (
    <Layout title="Companies" description="Verify recruiters before they can post drives.">
      {companies.map((c) => (
        <div key={c.company_id} className="record">
          <div className="record-title">{c.company_name}</div>
          <div className="record-meta">{c.industry} · {c.recruiter_name} · {c.recruiter_email}</div>
          <span className={`status status-${c.verification_status}`}>{c.verification_status}</span>
          {c.verification_status !== 'verified' && (
            <div className="record-actions">
              <button className="btn btn-sm" onClick={() => verify(c.company_id, 'verified')}>Verify</button>
              <button className="btn-danger btn btn-sm" onClick={() => verify(c.company_id, 'rejected')}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </Layout>
  );
}