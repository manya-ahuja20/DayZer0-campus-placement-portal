// set/check eligibility criteria
const pool = require('../config/db');

// Company: set/update eligibility criteria for own drive
exports.setCriteria = async (req, res) => {
  const { id, role } = req.user;
  const { driveId } = req.params;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can set criteria' });

  const { minimum_cgpa, maximum_backlogs, eligible_branches } = req.body;
  try {
    // confirm drive belongs to this company
    const driveRes = await pool.query('SELECT * FROM placement_drive WHERE drive_id=$1 AND company_id=$2', [driveId, id]);
    if (!driveRes.rows.length) return res.status(404).json({ error: 'Drive not found or not yours' });

    // upsert: check if criteria already exists
    const existing = await pool.query('SELECT * FROM eligibility_criteria WHERE drive_id=$1', [driveId]);
    let result;
    if (existing.rows.length) {
      result = await pool.query(
        `UPDATE eligibility_criteria SET minimum_cgpa=$1, maximum_backlogs=$2, eligible_branches=$3 WHERE drive_id=$4 RETURNING *`,
        [minimum_cgpa, maximum_backlogs, eligible_branches, driveId]
      );
    } else {
      result = await pool.query(
        `INSERT INTO eligibility_criteria (drive_id, minimum_cgpa, maximum_backlogs, eligible_branches) VALUES ($1,$2,$3,$4) RETURNING *`,
        [driveId, minimum_cgpa, maximum_backlogs, eligible_branches]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Anyone: view criteria for a drive
exports.getCriteria = async (req, res) => {
  const { driveId } = req.params;
  const { rows } = await pool.query('SELECT * FROM eligibility_criteria WHERE drive_id=$1', [driveId]);
  if (!rows.length) return res.status(404).json({ error: 'No criteria set for this drive' });
  res.json(rows[0]);
};

// Student: check own eligibility for a drive
exports.checkEligibility = async (req, res) => {
  const { id, role } = req.user;
  const { driveId } = req.params;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can check eligibility' });

  try {
    const studentRes = await pool.query('SELECT cgpa, backlogs, branch FROM student WHERE student_id=$1', [id]);
    const criteriaRes = await pool.query('SELECT * FROM eligibility_criteria WHERE drive_id=$1', [driveId]);

    if (!criteriaRes.rows.length) return res.json({ eligible: true, reason: 'No criteria set — open to all' });

    const student = studentRes.rows[0];
    const criteria = criteriaRes.rows[0];
    const reasons = [];

    if (criteria.minimum_cgpa !== null && student.cgpa < criteria.minimum_cgpa) {
      reasons.push(`CGPA below required ${criteria.minimum_cgpa}`);
    }
    if (criteria.maximum_backlogs !== null && student.backlogs > criteria.maximum_backlogs) {
      reasons.push(`Backlogs exceed allowed ${criteria.maximum_backlogs}`);
    }
    if (criteria.eligible_branches) {
      const allowed = criteria.eligible_branches.split(',').map((b) => b.trim().toLowerCase());
      if (!allowed.includes(student.branch?.toLowerCase())) {
        reasons.push(`Branch ${student.branch} not eligible`);
      }
    }

    res.json({ eligible: reasons.length === 0, reasons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Student: get approved drives WITH eligibility flag 
exports.getApprovedDrivesWithEligibility = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can view this' });

  try {
    const studentRes = await pool.query('SELECT cgpa, backlogs, branch FROM student WHERE student_id=$1', [id]);
    const student = studentRes.rows[0];

    const drivesRes = await pool.query(`
      SELECT pd.*, ec.minimum_cgpa, ec.maximum_backlogs, ec.eligible_branches
      FROM placement_drive pd
      LEFT JOIN eligibility_criteria ec ON pd.drive_id = ec.drive_id
      WHERE pd.status = 'approved'
      ORDER BY pd.deadline
    `);

    const drivesWithEligibility = drivesRes.rows.map((d) => {
      const reasons = [];
      if (d.minimum_cgpa !== null && student.cgpa < d.minimum_cgpa) reasons.push(`CGPA below ${d.minimum_cgpa}`);
      if (d.maximum_backlogs !== null && student.backlogs > d.maximum_backlogs) reasons.push(`Backlogs exceed ${d.maximum_backlogs}`);
      if (d.eligible_branches) {
        const allowed = d.eligible_branches.split(',').map((b) => b.trim().toLowerCase());
        if (!allowed.includes(student.branch?.toLowerCase())) reasons.push(`Branch not eligible`);
      }
      return { ...d, eligible: reasons.length === 0, reasons };
    });

    res.json(drivesWithEligibility);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};