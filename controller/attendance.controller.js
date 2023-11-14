const { pool } = require("../config/db");
const cron = require("node-cron");

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

    const workerRecord = await pool.query(
      `SELECT * FROM workers WHERE id = $1;`,
      [worker_id]
    );

    if (workerRecord.rowCount === 0) {
      return res.status(404).json({ message: `worker not found!` });
    }

    const { rows } = await pool.query(
      `SELECT a.*, s.site_name FROM attendances a 
       LEFT JOIN sites s ON s.id = a.site_id
       WHERE worker_id = $1 
       ORDER BY created_at DESC`,
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

async function checkWorkerLoggedOut(req, res) {
  try {
    const loggedInWorkers = await pool.query("SELECT * FROM check_in_out;");
    console.log(loggedInWorkers.rows);
  } catch (error) {
    console.log(error);
    res.status(500).message({ message: error.message });
  }
}

// cron.schedule("*/10 * * * * *", checkWorkerLoggedOut);

module.exports = {
  createAttendance,
  getWorkerAttendanceById,
  getAllAttendances,
};
