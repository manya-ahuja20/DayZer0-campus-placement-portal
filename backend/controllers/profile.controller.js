// get/update profile, resume CRUD
const pool = require('../config/db');

const TABLES = { student: 'student', company: 'company', admin: 'admin' };
const ID_COL = { student: 'student_id', company: 'company_id', admin: 'admin_id' };

exports.getProfile = async (req, res) => {
  const { id, role } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES[role]} WHERE ${ID_COL[role]} = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    const { password_hash, ...safe } = rows[0];
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { id, role } = req.user;
  try {
    if (role === 'student') {
      const { name, branch, batch, cgpa, backlogs, phone } = req.body;
      await pool.query(
        `UPDATE student SET name=$1, branch=$2, batch=$3, cgpa=$4, backlogs=$5, phone=$6 WHERE student_id=$7`,
        [name, branch, batch, cgpa, backlogs, phone, id]
      );
    } else if (role === 'company') {
      const { company_name, industry, recruiter_name, recruiter_phone } = req.body;
      await pool.query(
        `UPDATE company SET company_name=$1, industry=$2, recruiter_name=$3, recruiter_phone=$4 WHERE company_id=$5`,
        [company_name, industry, recruiter_name, recruiter_phone, id]
      );
    } else if (role === 'admin') {
      const { name, phone } = req.body;
      await pool.query(`UPDATE admin SET name=$1, phone=$2 WHERE admin_id=$3`, [name, phone, id]);
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.uploadResume = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can upload resumes' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded or invalid file type' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO resume (student_id, file_name, original_name, file_data)
       VALUES ($1,$2,$3,$4)
       RETURNING resume_id, student_id, file_name, original_name, upload_date, version`,
      [id, `${id}_${Date.now()}.pdf`, req.file.originalname, req.file.buffer]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listResumes = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'student') return res.status(403).json({ error: 'Only students have resumes' });
  const { rows } = await pool.query(
    `SELECT resume_id, student_id, file_name, original_name, upload_date, version
     FROM resume WHERE student_id=$1 ORDER BY upload_date DESC`, [id]
  );
  res.json(rows);
};

exports.deleteResume = async (req, res) => {
  const { id, role } = req.user;
  const { resumeId } = req.params;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can delete resumes' });

  try {
    const { rows } = await pool.query(
      'DELETE FROM resume WHERE resume_id=$1 AND student_id=$2 RETURNING resume_id',
      [resumeId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Resume not found' });
    res.json({ message: 'Resume deleted' });
  } catch (err) {
    if (err.code === '23503') return res.status(409).json({ error: 'Cannot delete a resume already used in an application' });
    res.status(400).json({ error: err.message });
  }
};

exports.downloadResume = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT original_name, file_data FROM resume WHERE resume_id=$1', [req.params.resumeId]
  );
  if (!rows.length || !rows[0].file_data) return res.status(404).json({ error: 'Resume not found' });
  const name = (rows[0].original_name || 'resume.pdf').replace(/[^\w.\- ]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${name}"`);
  res.send(rows[0].file_data);
};