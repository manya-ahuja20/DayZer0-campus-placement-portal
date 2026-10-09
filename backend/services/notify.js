const pool = require('../config/db');

exports.notify = (studentId, message) =>
  pool.query('INSERT INTO notification (student_id, message) VALUES ($1,$2)', [studentId, message])
    .catch((e) => console.error('Notify failed:', e.message));