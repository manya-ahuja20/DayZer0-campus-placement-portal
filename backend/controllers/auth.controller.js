// register and login controller and password hashing and JWT token generation
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const TABLES = { student: 'student', company: 'company', admin: 'admin' };
const ID_COL = { student: 'student_id', company: 'company_id', admin: 'admin_id' };
const EMAIL_COL = { student: 'email', company: 'recruiter_email', admin: 'email' };

exports.register = async (req, res) => {
  const { role, password, ...fields } = req.body;
  if (!TABLES[role]) return res.status(400).json({ error: 'Invalid role' });

  try {
    const password_hash = await bcrypt.hash(password, 10);

    if (role === 'student') {
      const { roll_no, name, branch, batch, cgpa, backlogs, email, phone } = fields;
      const { rows } = await pool.query(
        `INSERT INTO student (roll_no, name, branch, batch, cgpa, backlogs, email, password_hash, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING student_id`,
        [roll_no, name, branch, batch, cgpa, backlogs || 0, email, password_hash, phone]
      );
      return res.status(201).json({ id: rows[0].student_id, role });
    }

    if (role === 'company') {
      const { company_name, industry, recruiter_name, recruiter_email, recruiter_phone } = fields;
      const { rows } = await pool.query(
        `INSERT INTO company (company_name, industry, recruiter_name, recruiter_email, password_hash, recruiter_phone)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING company_id`,
        [company_name, industry, recruiter_name, recruiter_email, password_hash, recruiter_phone]
      );
      return res.status(201).json({ id: rows[0].company_id, role });
    }

    if (role === 'admin') {
      const { name, email, phone } = fields;
      const { rows } = await pool.query(
        `INSERT INTO admin (name, email, password_hash, phone) VALUES ($1,$2,$3,$4) RETURNING admin_id`,
        [name, email, password_hash, phone]
      );
      return res.status(201).json({ id: rows[0].admin_id, role });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!TABLES[role]) return res.status(400).json({ error: 'Invalid role' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM ${TABLES[role]} WHERE ${EMAIL_COL[role]} = $1`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const id = user[ID_COL[role]];
    const token = jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};