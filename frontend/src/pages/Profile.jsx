import { useEffect, useState, useRef } from 'react';
import api, { API_BASE } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';


export default function Profile() {
  const { auth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const loadResumes = () => api.get('/profile/resume').then((res) => setResumes(res.data));

  useEffect(() => {
    if (!auth.token) { navigate('/login'); return; }
    api.get('/profile').then((res) => { setProfile(res.data); setForm(res.data); }).catch(() => navigate('/login'));
    if (auth.role === 'student') loadResumes();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    await api.put('/profile', form);
    setProfile(form);
    setEditing(false);
  };

  const uploadResume = async () => {
  if (!selectedFile) return alert('Choose a PDF file first');
  const formData = new FormData();
  formData.append('resume', selectedFile);
  try {
    await api.post('/profile/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadResumes();
  } catch (err) {
    alert(err.response?.data?.error || 'Upload failed');
  }
  };

  const deleteResume = async (resumeId) => {
  if (!confirm('Delete this resume?')) return;
  try {
    await api.delete(`/profile/resume/${resumeId}`);
    loadResumes();
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to delete resume');
  }
  };


  if (!profile) return <Layout title="Profile"><p>Loading…</p></Layout>;

  const fieldLabels = {
    student_id: 'Student ID', roll_no: 'Roll number', name: 'Name', branch: 'Branch', batch: 'Batch',
    cgpa: 'CGPA', backlogs: 'Active backlogs', email: 'Email', phone: 'Phone', placement_status: 'Placement status',
    company_id: 'Company ID', company_name: 'Company name', industry: 'Industry', recruiter_name: 'Recruiter name',
    recruiter_email: 'Recruiter email', recruiter_phone: 'Recruiter phone', verification_status: 'Verification status',
    admin_id: 'Admin ID',
  };

  return (
    <Layout title="Profile" description={`Account details for your ${auth.role} profile.`}>
      <div className="panel">
        {!editing ? (
          <>
            {Object.entries(profile).map(([key, val]) => (
              <div key={key} className="form-row">
                <label className="field-label">{fieldLabels[key] || key}</label>
                <div>{val?.toString() || '—'}</div>
              </div>
            ))}
            <button className="btn" style={{ marginTop: 16 }} onClick={() => setEditing(true)}>Edit profile</button>
          </>
        ) : (
          <>
            {Object.keys(form).map((key) => (
              key.includes('id') || key.includes('status') ? null : (
                <div key={key} className="form-row">
                  <label className="field-label">{fieldLabels[key] || key}</label>
                  <input name={key} value={form[key] || ''} onChange={handleChange} />
                </div>
              )
            ))}
            <button className="btn" style={{ marginTop: 16 }} onClick={handleSave}>Save changes</button>
          </>
        )}
      </div>

      {auth.role === 'student' && (
        <div className="panel">
          <h3>Resumes</h3>
          {resumes.length === 0 && <p className="empty-state">No resumes uploaded yet.</p>}
          {resumes.map((r) => (
            <div key={r.resume_id} className="record">
              <div className="record-title" style={{ fontSize: 14 }}>{r.original_name}</div>
              <div className="record-meta">
                Uploaded {r.upload_date?.slice(0, 10)} ·{' '}
                <a href={`${API_BASE}/api/profile/resume/${r.resume_id}/download`} target="_blank" rel="noreferrer">View</a>
              </div>
              <div className="record-actions">
                <button className="btn-danger btn btn-sm" onClick={() => deleteResume(r.resume_id)}>Delete</button>
              </div>
            </div>
          ))}
          <label className="field-label">Upload a new resume (PDF only)</label>
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
          <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={uploadResume}>Upload resume</button>
        </div>
      )}
    </Layout>
  );
}