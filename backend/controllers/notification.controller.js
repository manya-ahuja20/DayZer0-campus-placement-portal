const pool = require('../config/db');

exports.list = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'student') return res.json([]);
  const { rows } = await pool.query('SELECT * FROM notification WHERE student_id=$1 ORDER BY notification_id DESC', [id]);
  res.json(rows);
};

exports.markRead = async (req, res) => {
  await pool.query(`UPDATE notification SET status='read' WHERE notification_id=$1 AND student_id=$2`, [req.params.id, req.user.id]);
  res.json({ message: 'Marked read' });
};

exports.markAllRead = async (req, res) => {
  await pool.query(`UPDATE notification SET status='read' WHERE student_id=$1`, [req.user.id]);
  res.json({ message: 'All marked read' });
};