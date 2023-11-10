const { pool } = require("../config/db");

async function createAttendance(req, res) {
  const { worker_id, date, hours, check_in, check_out } = req.body;
  try {
    await pool.query(
      `INSERT INTO attendances (worker_id, date, hours, check_in, check_out) VALUES ($1, $2, $3, $4, $5)`,
      [worker_id, date, hours, check_in, check_out]
    );
    res.json({ message: "Attendance marked" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getWorkerAttendanceById(req, res) {
  const { worker_id } = req.body;
  try {
    if (!worker_id) {
      return res.status(404).json({ message: `'worker_id' not found!` });
    }
    const { rows } = await pool.query(
      `SELECT * FROM attendances WHERE worker_id = $1 ORDER BY created_at DESC`,
      [worker_id]
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllAttendances(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM attendances ORDER BY created_at DESC;`
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createAttendance,
  getWorkerAttendanceById,
  getAllAttendances,
};
