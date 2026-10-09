import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

const blank = { round_name: '', round_date: '', round_time: '', location: '', capacity: 1 };
const FIELDS = [
  ['round_name', 'Round name', 'text'],
  ['round_date', 'Date', 'date'],
  ['round_time', 'Time', 'time'],
  ['location', 'Location', 'text'],
  ['capacity', 'Slots available', 'number'],
];

export default function CompanyInterviews() {
  const [drives, setDrives] = useState([]);
  const [driveId, setDriveId] = useState('');
  const [rounds, setRounds] = useState([]);
  const [form, setForm] = useState(blank);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { api.get('/drives/mine').then((r) => setDrives(r.data)); }, []);

  const load = (id = driveId) => id && api.get(`/interviews/drive/${id}`).then((r) => setRounds(r.data));

  const pick = (id) => { setDriveId(id); setRounds([]); load(id); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/interviews/drive/${driveId}`, form);
      setForm(blank);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed to create round'); }
  };

  const remove = async (roundId) => {
    if (!confirm('Delete this round?')) return;
    await api.delete(`/interviews/${roundId}`);
    load();
  };

  return (
    <Layout title="Interview rounds" description="Schedule rounds for your drives. Shortlisted students book a slot.">
      <div className="panel">
        <label className="field-label">Drive</label>
        <select value={driveId} onChange={(e) => pick(e.target.value)}>
          <option value="">Choose a drive</option>
          {drives.map((d) => <option key={d.drive_id} value={d.drive_id}>{d.job_title} — #{d.drive_id}</option>)}
        </select>
      </div>

      {driveId && (
        <>
          <div className="panel">
            <h3>Add a round</h3>
            <form onSubmit={submit}>
              <div className="form-grid">
                {FIELDS.map(([k, label, type]) => (
                  <div key={k}>
                    <label className="field-label">{label}</label>
                    <input
                      type={type} value={form[k]} required={k !== 'location'}
                      min={k === 'round_date' ? today : k === 'capacity' ? 1 : undefined}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn" style={{ marginTop: 16 }}>Add round</button>
            </form>
          </div>

          {rounds.length === 0 && <p className="empty-state">No rounds scheduled.</p>}
          {rounds.map((r) => (
            <div key={r.round_id} className="record">
              <div className="record-title">{r.round_name}</div>
              <div className="record-meta">{r.round_date} · {r.round_time} · {r.location || 'Location TBA'} · {r.booked}/{r.capacity} booked</div>
              {r.students.length > 0 && <p style={{ fontSize: 13.5 }}>Booked: {r.students.join(', ')}</p>}
              <div className="record-actions">
                <button className="btn-danger btn btn-sm" onClick={() => remove(r.round_id)}>Delete</button>
              </div>
            </div>
          ))}
        </>
      )}
    </Layout>
  );
}