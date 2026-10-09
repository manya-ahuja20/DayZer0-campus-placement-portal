import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function StudentInterviews() {
  const [rounds, setRounds] = useState([]);
  const load = () => api.get('/interviews/mine').then((r) => setRounds(r.data));
  useEffect(() => { load(); }, []);

  const act = async (fn) => {
    try { await fn(); load(); }
    catch (err) { alert(err.response?.data?.error || 'Action failed'); }
  };

  return (
    <Layout title="Interviews" description="Book a slot for rounds of drives you are shortlisted in.">
      {rounds.length === 0 && <p className="empty-state">No rounds yet. They appear once you are shortlisted and the company schedules one.</p>}
      {rounds.map((r) => {
        const full = r.booked >= r.capacity;
        const canBook = !r.is_booked && !r.past && !full;
        const canCancel = r.is_booked && !r.past;
        return (
          <div key={r.round_id} className="record">
            <div className="record-title">{r.job_title} — {r.round_name}</div>
            <div className="record-meta">{r.round_date} · {r.round_time} · {r.location || 'Location TBA'} · {r.booked}/{r.capacity} booked</div>
            {r.is_booked ? <span className="status status-approved">Booked</span>
              : r.past ? <span className="status status-rejected">Closed</span>
              : full ? <span className="status status-rejected">Full</span>
              : <span className="status status-pending">Open</span>}
            {(canBook || canCancel) && (
              <div className="record-actions">
                {canBook && <button className="btn btn-sm" onClick={() => act(() => api.post(`/interviews/${r.round_id}/book`))}>Book slot</button>}
                {canCancel && <button className="btn-danger btn btn-sm" onClick={() => act(() => api.delete(`/interviews/${r.round_id}/book`))}>Cancel booking</button>}
              </div>
            )}
          </div>
        );
      })}
    </Layout>
  );
}