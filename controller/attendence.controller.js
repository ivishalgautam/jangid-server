const { pool } = require("../config/db");

async function createAttendence(req, res) {
  const { worker_id, date, hours, check_in, check_out } = req.body;
  try {
    await pool.query(
      `INSERT INTO attendences (worker_id, date, hours, check_in, check_out) VALUES ($1, $2, $3, $4, $5)`,
      [worker_id, date, hours, check_in, check_out]
    );
    res.json({ message: "Attendence marked" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getWorkerAttendenceById(req, res) {
  const { worker_id } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM attendences WHERE worker_id = $1`,
      [worker_id]
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createAttendence,
  getWorkerAttendenceById,
};
