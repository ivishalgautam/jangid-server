const { pool } = require("../config/db");
const cron = require("node-cron");
const moment = require("moment-timezone");

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
    const d = new Date();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();

    for (const {
      worker_id,
      site_id,
      uid: session_id,
    } of loggedInWorkers.rows) {
      const workerRecord = await pool.query(
        "SELECT site_assigned FROM workers WHERE id = $1;",
        [worker_id]
      );

      const siteAssigned = await pool.query(
        "SELECT start_time, end_time FROM sites WHERE id = $1;",
        [site_id]
      );

      const timeToCheck = moment(
        `1970-01-01T${String(hours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      ).format();

      const startTime = moment(
        new Date(`1970-01-01T${siteAssigned.rows[0].start_time}`)
      ).format();

      const startTimeOneHourBefore = moment(
        new Date(`1970-01-01T${siteAssigned.rows[0].start_time}`)
      )
        .subtract(1, "hours")
        .format();
      // console.log({ startTimeOneHourBefore, startTime, timeToCheck });
      if (
        moment(timeToCheck).isAfter(startTimeOneHourBefore) &&
        moment(timeToCheck).isBefore(startTime)
      ) {
        await pool.query(
          `UPDATE workers SET is_present = false WHERE id = $1;`,
          [worker_id],
          async (err, result) => {
            if (!err) {
              await pool.query(`DELETE FROM check_in_out WHERE uid = $1;`, [
                session_id,
              ]);
              console.log("logged out");
              // console.log({ result });
            }
          }
        );
      }
    }

    // console.log(loggedInWorkers.rows);
  } catch (error) {
    console.log(error);
    res.status(500).message({ message: error.message });
  }
}

cron.schedule("*/2 * * * * *", checkWorkerLoggedOut);

module.exports = {
  createAttendance,
  getWorkerAttendanceById,
  getAllAttendances,
};
