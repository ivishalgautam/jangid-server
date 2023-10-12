const { pool } = require("../config/db");

async function createCheckIn(req, res) {
  const { check_in, worker_id, date } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO check_in_out (check_in, worker_id, date) VALUES ($1, $2, $3) returning *`,
      [check_in, worker_id, date]
    );
    res.json({ session_id: rows[0].id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function createCheckOut(req, res) {
  const { session_id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE check_in_out set check_out = $1 WHERE id = $1 returning *`,
      [session_id]
    );

    const check_in = rows[0].check_in;
    const check_out = rows[0].check_out;

    // Calculate the time difference in hours
    const timeDifferenceInMilliseconds =
      new Date(check_out) - new Date(check_in);
    const timeDifferenceInHours =
      timeDifferenceInMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours

    if (rowCount > 0) {
      await pool.query(
        `INSERT INTO attendences (worker_id, date, hours, check_in, check_out) VALUES ($1, $2, $3, $4, $5)`,
        [
          rows[0].worker_id,
          new Date().toLocaleDateString(),
          timeDifferenceInHours,
          check_in,
          check_out,
        ]
      );
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

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
  createCheckIn,
  createCheckOut,
};
