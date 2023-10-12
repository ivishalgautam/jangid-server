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
  const { check_out, session_id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE check_in_out set check_out = $1 WHERE id = $2 returning *`,
      [check_out, session_id]
    );
    console.log(rows);

    const check_in_time = rows[0].check_in;
    const check_out_time = rows[0].check_out;

    // Calculate the time difference in hours
    const timeDifferenceInMilliseconds =
      new Date(check_out_time) - new Date(check_in_time);
    const timeDifferenceInHours =
      timeDifferenceInMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours

    if (rowCount > 0) {
      await pool.query(
        `INSERT INTO attendences (worker_id, date, hours, check_in, check_out) VALUES ($1, $2, $3, $4, $5)`,
        [
          rows[0].worker_id,
          new Date().toLocaleDateString(),
          timeDifferenceInHours,
          check_in_time,
          check_out_time,
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
