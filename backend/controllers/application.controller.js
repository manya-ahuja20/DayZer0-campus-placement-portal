// student applies to drive, company views applicants, updates status
const { extractText, matchResume } = require('../services/matcher');
const { notify } = require('../services/notify');
const pool = require('../config/db');

// Student: apply to a drive
exports.applyToDrive = async (req, res) => {
  const { id, role } = req.user;
  const { driveId } = req.params;
  const { resume_id } = req.body;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can apply' });

  try {
    // 1. Drive must exist and be approved
    const driveRes = await pool.query('SELECT * FROM placement_drive WHERE drive_id=$1', [driveId]);
    if (!driveRes.rows.length) return res.status(404).json({ error: 'Drive not found' });
    const drive = driveRes.rows[0];
    if (drive.status !== 'approved') return res.status(403).json({ error: 'Drive not open for applications' });
    if (new Date(drive.deadline) < new Date()) return res.status(403).json({ error: 'Application deadline has passed' });

    // 2. Resume must belong to this student
    const resumeRes = await pool.query('SELECT * FROM resume WHERE resume_id=$1 AND student_id=$2', [resume_id, id]);
    if (!resumeRes.rows.length) return res.status(400).json({ error: 'Invalid resume selection' });

    // 3. Eligibility check
    const studentRes = await pool.query('SELECT cgpa, backlogs, branch FROM student WHERE student_id=$1', [id]);
    const student = studentRes.rows[0];
    const criteriaRes = await pool.query('SELECT * FROM eligibility_criteria WHERE drive_id=$1', [driveId]);
    if (criteriaRes.rows.length) {
      const c = criteriaRes.rows[0];
      const reasons = [];
      if (c.minimum_cgpa !== null && student.cgpa < c.minimum_cgpa) reasons.push('CGPA too low');
      if (c.maximum_backlogs !== null && student.backlogs > c.maximum_backlogs) reasons.push('Too many backlogs');
      if (c.eligible_branches) {
        const allowed = c.eligible_branches.split(',').map((b) => b.trim().toLowerCase());
        if (!allowed.includes(student.branch?.toLowerCase())) reasons.push('Branch not eligible');
      }
      if (reasons.length) return res.status(403).json({ error: 'Not eligible', reasons });
    }

    // 4. Insert (UNIQUE constraint on student_id+drive_id prevents duplicates)
    const { rows } = await pool.query(
      `INSERT INTO application (student_id, drive_id, resume_id) VALUES ($1,$2,$3) RETURNING *`,
      [id, driveId, resume_id]
    );
        try {
      const text = await extractText(resumeRes.rows[0].file_name);
      const m = matchResume(text, `${drive.job_title} ${drive.job_description || ''}`);
      await pool.query('UPDATE application SET resume_match_score=$1 WHERE application_id=$2', [m.score, rows[0].application_id]);
      await pool.query('INSERT INTO ai_resume_matcher (application_id, match_score, feedback) VALUES ($1,$2,$3)', [rows[0].application_id, m.score, m.feedback]);
    } catch (e) {
      console.error('Resume matching failed:', e.message);
    }
    notify(id, `Application submitted for ${drive.job_title}.`);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already applied to this drive' });
    res.status(400).json({ error: err.message });
  }
};

// Student: view own applications
exports.getMyApplications = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can view this' });

  const { rows } = await pool.query(`
  SELECT a.*, pd.job_title, pd.package, pd.location, pd.deadline, pd.status AS drive_status, m.feedback
  FROM application a
  JOIN placement_drive pd ON a.drive_id = pd.drive_id
  LEFT JOIN ai_resume_matcher m ON a.application_id = m.application_id
  WHERE a.student_id = $1
  ORDER BY a.application_date DESC
  `, [id]);
  res.json(rows);
};

// Student: withdraw application (only if still 'applied')
exports.withdrawApplication = async (req, res) => {
  const { id, role } = req.user;
  const { applicationId } = req.params;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can withdraw' });

  const { rows } = await pool.query(
    `DELETE FROM application WHERE application_id=$1 AND student_id=$2 AND status='applied' RETURNING *`,
    [applicationId, id]
  );
  if (!rows.length) return res.status(400).json({ error: 'Cannot withdraw (not found or already processed)' });
  res.json({ message: 'Application withdrawn' });
};

// Company: view applicants for own drive
exports.getApplicantsForDrive = async (req, res) => {
  const { id, role } = req.user;
  const { driveId } = req.params;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can view applicants' });

  const driveRes = await pool.query('SELECT * FROM placement_drive WHERE drive_id=$1 AND company_id=$2', [driveId, id]);
  if (!driveRes.rows.length) return res.status(404).json({ error: 'Drive not found or not yours' });

  const { rows } = await pool.query(`
    SELECT a.application_id, a.status, a.application_date, a.resume_match_score,
           s.student_id, s.name, s.branch, s.cgpa, s.email,
           r.resume_id, r.original_name AS resume_name
    FROM application a
    JOIN student s ON a.student_id = s.student_id
    JOIN resume r ON a.resume_id = r.resume_id
    WHERE a.drive_id = $1
    ORDER BY a.application_date
  `, [driveId]);
  res.json(rows);
};


// Company: update applicant status (shortlist/reject/select)
exports.updateApplicationStatus = async (req, res) => {
  const { id, role } = req.user;
  const { applicationId } = req.params;
  const { status } = req.body;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can update status' });

  const valid = ['applied', 'shortlisted', 'rejected', 'selected'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const check = await pool.query(`
    SELECT a.*, pd.job_title FROM application a
    JOIN placement_drive pd ON a.drive_id = pd.drive_id
    WHERE a.application_id=$1 AND pd.company_id=$2
  `, [applicationId, id]);
  if (!check.rows.length) return res.status(404).json({ error: 'Application not found or not yours' });

  const { rows } = await pool.query(
    'UPDATE application SET status=$1 WHERE application_id=$2 RETURNING *',
    [status, applicationId]
    
  );
  if (status !== 'applied') notify(check.rows[0].student_id, `Your application for ${check.rows[0].job_title} is now ${status}.`);

  // Recompute placement status based on ALL applications for this student
  const studentId = check.rows[0].student_id;
  const selectedCheck = await pool.query(
    `SELECT COUNT(*) FROM application WHERE student_id=$1 AND status='selected'`,
    [studentId]
  );
  const newPlacementStatus = parseInt(selectedCheck.rows[0].count) > 0 ? 'placed' : 'unplaced';
  await pool.query('UPDATE student SET placement_status=$1 WHERE student_id=$2', [newPlacementStatus, studentId]);

  res.json(rows[0]);
};