import { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function StudentNotifications() {
  const [items, setItems] = useState([]);
  const load = () => api.get('/notifications').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const read = async (id) => {
  await api.patch(`/notifications/${id}/read`);
  load();
  window.dispatchEvent(new Event('notifs-changed'));
};
    const readAll = async () => {
    await api.patch('/notifications/read-all');
    load();
    window.dispatchEvent(new Event('notifs-changed'));
    };

  return (
    <Layout title="Notifications" description="Updates on applications and interviews.">
      {items.some((n) => n.status === 'unread') && (
        <button className="btn btn-outline btn-sm" style={{ marginBottom: 16 }} onClick={readAll}>Mark all as read</button>
      )}
      {items.length === 0 && <p className="empty-state">No notifications yet.</p>}
      {items.map((n) => (
        <div key={n.notification_id} className="record">
          <div style={{ fontWeight: n.status === 'unread' ? 600 : 400 }}>{n.message}</div>
          <div className="record-meta" style={{ marginTop: 6, marginBottom: 0 }}>
            {new Date(n.date).toLocaleString()} ·{' '}
            <span className={`status ${n.status === 'unread' ? 'status-pending' : 'status-applied'}`}>{n.status}</span>
            {n.status === 'unread' && (
              <button className="btn-outline btn btn-sm" style={{ marginLeft: 10 }} onClick={() => read(n.notification_id)}>Mark read</button>
            )}
          </div>
        </div>
      ))}
    </Layout>
  );
}