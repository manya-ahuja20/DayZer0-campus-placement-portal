// drive CRUD, drive approval, company verification
const pool = require('../config/db');

// Company: create a drive
exports.createDrive = async (req, res) => {
  const { id, role } = req.user;

  if (role !== 'company') return res.status(403).json({ error: 'Only companies can post drives' });
  const { job_title, package: pkg, location, deadline, positions, job_description } = req.body;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (new Date(deadline) < today) return res.status(400).json({ error: 'Deadline cannot be in the past' });

  try {
    const companyRes = await pool.query('SELECT verification_status FROM company WHERE company_id=$1', [id]);
    if (companyRes.rows[0].verification_status !== 'verified') {
      return res.status(403).json({ error: 'Company not yet verified by admin' });
    }
    const { rows } = await pool.query(
      `INSERT INTO placement_drive (company_id, job_title, package, location, deadline, positions, job_description)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, job_title, pkg, location, deadline, positions, job_description]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Company: view own drives
exports.getMyDrives = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can view this' });

  const { rows } = await pool.query('SELECT * FROM placement_drive WHERE company_id=$1 ORDER BY deadline', [id]);
  res.json(rows);
};

// Company: update own drive
exports.updateDrive = async (req, res) => {
  const { id, role } = req.user;
  const { driveId } = req.params;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can update drives' });

  const { job_title, package: pkg, location, deadline, positions } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE placement_drive SET job_title=$1, package=$2, location=$3, deadline=$4, positions=$5
       WHERE drive_id=$6 AND company_id=$7 RETURNING *`,
      [job_title, pkg, location, deadline, positions, driveId, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Drive not found or not yours' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Admin: view all drives (optionally filter by status)
exports.getAllDrives = async (req, res) => {
  const { role } = req.user;
  if (role !== 'admin') return res.status(403).json({ error: 'Only admin can view all drives' });

  const { status } = req.query;
  const base = `
    SELECT pd.*, c.company_name, c.verification_status,
           ec.minimum_cgpa, ec.maximum_backlogs, ec.eligible_branches
    FROM placement_drive pd
    JOIN company c ON pd.company_id = c.company_id
    LEFT JOIN eligibility_criteria ec ON pd.drive_id = ec.drive_id
  `;
  const query = status ? { text: base + ' WHERE pd.status=$1', values: [status] } : { text: base };
  const { rows } = await pool.query(query);
  res.json(rows);
};

// Admin: approve/reject a drive
exports.reviewDrive = async (req, res) => {
  const { role } = req.user;
  const { driveId } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'
  if (role !== 'admin') return res.status(403).json({ error: 'Only admin can review drives' });
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { rows } = await pool.query(
    'UPDATE placement_drive SET status=$1 WHERE drive_id=$2 RETURNING *',
    [status, driveId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Drive not found' });
  res.json(rows[0]);
};

// Admin: verify/reject a company
exports.reviewCompany = async (req, res) => {
  const { role } = req.user;
  const { companyId } = req.params;
  const { status } = req.body; // 'verified' | 'rejected'
  if (role !== 'admin') return res.status(403).json({ error: 'Only admin can verify companies' });
  if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { rows } = await pool.query(
    'UPDATE company SET verification_status=$1 WHERE company_id=$2 RETURNING *',
    [status, companyId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Company not found' });
  res.json(rows[0]);
};

// Student: view approved drives only
exports.getApprovedDrives = async (req, res) => {
  const { role } = req.user;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can view this' });

  const { rows } = await pool.query(`SELECT * FROM placement_drive WHERE status='approved' ORDER BY deadline`);
  res.json(rows);
};

exports.getPendingCompanies = async (req, res) => {
  const { role } = req.user;
  if (role !== 'admin') return res.status(403).json({ error: 'Only admin can view this' });

  const { rows } = await pool.query(
    `SELECT company_id, company_name, industry, recruiter_name, recruiter_email, verification_status FROM company ORDER BY company_id`
  );
  res.json(rows);
};