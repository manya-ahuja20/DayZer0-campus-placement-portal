const pool = require('../config/db');
const { notify } = require('../services/notify');

const FMT = `to_char(r.round_date,'YYYY-MM-DD') AS round_date, to_char(r.round_time,'HH24:MI') AS round_time`;

exports.createRound = async (req, res) => {
  const { id, role } = req.user;
  const { driveId } = req.params;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can create rounds' });
  const { round_name, round_date, round_time, location, capacity } = req.body;
  try {
    const d = await pool.query('SELECT job_title FROM placement_drive WHERE drive_id=$1 AND company_id=$2', [driveId, id]);
    if (!d.rows.length) return res.status(404).json({ error: 'Drive not found or not yours' });

    const past = await pool.query('SELECT $1::date < CURRENT_DATE AS past', [round_date]);
    if (past.rows[0].past) return res.status(400).json({ error: 'Round date cannot be in the past' });

    const { rows } = await pool.query(
      `INSERT INTO interview_round (drive_id, round_name, round_date, round_time, location, capacity)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING round_id`,
      [driveId, round_name, round_date, round_time, location, capacity || 1]
    );

    const s = await pool.query(`SELECT student_id FROM application WHERE drive_id=$1 AND status='shortlisted'`, [driveId]);
    s.rows.forEach((r) =>
      notify(r.student_id, `New interview round for ${d.rows[0].job_title}: ${round_name} on ${round_date} at ${round_time}. Book your slot.`)
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRoundsForDrive = async (req, res) => {
  const { id, role } = req.user;
  const { driveId } = req.params;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can view this' });
  const own = await pool.query('SELECT 1 FROM placement_drive WHERE drive_id=$1 AND company_id=$2', [driveId, id]);
  if (!own.rows.length) return res.status(404).json({ error: 'Drive not found or not yours' });

  const { rows } = await pool.query(`
    SELECT r.round_id, r.round_name, r.location, r.capacity, ${FMT},
           COUNT(b.booking_id)::int AS booked,
           COALESCE(json_agg(s.name) FILTER (WHERE s.name IS NOT NULL), '[]') AS students
    FROM interview_round r
    LEFT JOIN interview_booking b ON b.round_id = r.round_id
    LEFT JOIN student s ON s.student_id = b.student_id
    WHERE r.drive_id = $1
    GROUP BY r.round_id
    ORDER BY r.round_date, r.round_time
  `, [driveId]);
  res.json(rows);
};

exports.deleteRound = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'company') return res.status(403).json({ error: 'Only companies can delete rounds' });
  const { rows } = await pool.query(
    `DELETE FROM interview_round WHERE round_id=$1
     AND drive_id IN (SELECT drive_id FROM placement_drive WHERE company_id=$2) RETURNING round_id`,
    [req.params.roundId, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Round not found or not yours' });
  res.json({ message: 'Round deleted' });
};

exports.getMyRounds = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can view this' });
  const { rows } = await pool.query(`
    SELECT r.round_id, r.round_name, r.location, r.capacity, ${FMT},
           pd.job_title, pd.drive_id,
           r.round_date < CURRENT_DATE AS past,
           (SELECT COUNT(*) FROM interview_booking WHERE round_id = r.round_id)::int AS booked,
           EXISTS (SELECT 1 FROM interview_booking WHERE round_id = r.round_id AND student_id = $1) AS is_booked
    FROM interview_round r
    JOIN placement_drive pd ON r.drive_id = pd.drive_id
    JOIN application a ON a.drive_id = pd.drive_id AND a.student_id = $1 AND a.status IN ('shortlisted','selected')
    ORDER BY r.round_date, r.round_time
  `, [id]);
  res.json(rows);
};

exports.bookRound = async (req, res) => {
  const { id, role } = req.user;
  const { roundId } = req.params;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can book' });
  try {
    const r = await pool.query(`
      SELECT r.round_id, r.drive_id, r.round_name, ${FMT}, pd.job_title,
             r.round_date < CURRENT_DATE AS past
      FROM interview_round r JOIN placement_drive pd ON r.drive_id = pd.drive_id
      WHERE r.round_id = $1`, [roundId]);
    if (!r.rows.length) return res.status(404).json({ error: 'Round not found' });
    const round = r.rows[0];
    if (round.past) return res.status(400).json({ error: 'This round has already passed' });

    const app = await pool.query(
      `SELECT 1 FROM application WHERE student_id=$1 AND drive_id=$2 AND status='shortlisted'`, [id, round.drive_id]);
    if (!app.rows.length) return res.status(403).json({ error: 'Only shortlisted students can book' });

    const ins = await pool.query(
      `INSERT INTO interview_booking (round_id, student_id)
       SELECT $1::int, $2::int
       WHERE (SELECT COUNT(*) FROM interview_booking WHERE round_id = $1::int)
           < (SELECT capacity FROM interview_round WHERE round_id = $1::int)
       RETURNING booking_id`, [roundId, id]);
    if (!ins.rows.length) return res.status(409).json({ error: 'This round is full' });

    notify(id, `Interview booked: ${round.job_title}, ${round.round_name} on ${round.round_date} at ${round.round_time}.`);
    res.status(201).json(ins.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already booked' });
    res.status(400).json({ error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  const { id, role } = req.user;
  if (role !== 'student') return res.status(403).json({ error: 'Only students can cancel' });
  const { rows } = await pool.query(
    'DELETE FROM interview_booking WHERE round_id=$1 AND student_id=$2 RETURNING booking_id', [req.params.roundId, id]);
  if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
  res.json({ message: 'Booking cancelled' });
};