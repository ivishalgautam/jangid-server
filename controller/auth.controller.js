const { validationResult } = require("express-validator");
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwtGenerator = require("../utils/jwtGenerator");
const { v4: uuidv4 } = require("uuid");
const { haversine } = require("../helper/haversine");

async function supervisorLogin(req, res) {
  const { username, password } = req.body;
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const supervisor = await pool.query(
      `SELECT id, fullname, email, phone, role, hpassword FROM supervisors WHERE username = $1`,
      [username]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({
        message: `Supervisor with this username: '${username}' not exist!`,
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      supervisor.rows[0].hpassword
    );

    if (!validPassword) {
      return res.status(401).json({ message: "INVALID CREDENTIALS!" });
    }

    const { hpassword, ...data } = supervisor.rows[0];
    console.log(data);
    const jwtToken = jwtGenerator({
      ...data,
    });

    res.json({ supervisor: data, token: jwtToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function adminLogin(req, res) {
  const { username, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const supervisor = await pool.query(
      `SELECT id, fullname, email, role, hpassword FROM admin WHERE username = $1`,
      [username]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({
        message: `Admin with this username: '${username}' not exist!`,
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      supervisor.rows[0].hpassword
    );

    if (!validPassword) {
      return res.status(401).json({ message: "INVALID CREDENTIALS!" });
    }

    const { hpassword, ...data } = supervisor.rows[0];
    console.log(data);
    const jwtToken = jwtGenerator({
      ...data,
    });

    res.json({ admin: data, token: jwtToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function workerlogin(req, res) {
  const { username, password, lat, long } = req.body;
  try {
    const worker = await pool.query(
      `SELECT * FROM workers WHERE username = $1;`,
      [username]
    );

    if (worker.rowCount === 0) {
      return res.status(500).json({
        message: `Worker not exist with this '${username}' username!`,
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      worker.rows[0].hpassword
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const updateLatLong = await pool.query(
      `UPDATE workers SET lat = $1, long = $2 WHERE $3 returning *`,
      [lat, long, worker.rows[0].id]
    );

    const siteAssigned = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      worker.rows[0].site_assigned,
    ]);

    if (siteAssigned.rowCount === 0) {
      return res
        .status(500)
        .json({ message: "You are not assigned to any site!" });
    }

    // Coordinates of the center point (latitude and longitude)
    const centerLat = siteAssigned.rows[0].lat;
    const centerLon = siteAssigned.rows[0].long;

    // Coordinates of the point to check (latitude and longitude)
    const checkLat = updateLatLong.rows[0].lat;
    const checkLon = updateLatLong.rows[0].long;

    const radius = siteAssigned.rows[0].radius;
    const distance = haversine(centerLat, centerLon, checkLat, checkLon);

    if (distance <= radius) {
      const { rows } = await pool.query(
        `INSERT INTO check_in_out (uid, check_in, worker_id, date) VALUES ($1, CURRENT_TIMESTAMP, $2, CURRENT_DATE) returning *`,
        [uuidv4(), worker.rows[0].id],
        async (error, result) => {
          if (error) {
            return res.status(500).json({ message: error.message });
          } else {
            await pool.query(
              `UPDATE workers SET is_present = true WHERE id = $1;`,
              [worker.rows[0].id]
            );
          }
        }
      );
      res.json({ session_id: rows[0].uid });
    } else {
      console.error(`The point is outside ${radius} kilometers of the center.`);
      return res.status(400).json({ message: "You are out of radius!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function workerLogout(req, res) {
  const { session_id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE check_in_out set check_out = CURRENT_TIMESTAMP WHERE uid = $1 returning *`,
      [session_id]
    );
    console.log(rows);
    if (rowCount === 0) {
      return res.status(400).json({ message: "Session expired!" });
    }

    const check_in_time = rows[0].check_in;
    const check_out_time = rows[0].check_out;

    // Calculate the time difference in hours
    const timeDifferenceInMilliseconds =
      new Date(check_out_time) - new Date(check_in_time);
    const timeDifferenceInHours =
      timeDifferenceInMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours

    if (rowCount > 0) {
      await pool.query(
        `INSERT INTO attendances (worker_id, date, hours, check_in, check_out) VALUES ($1, $2, $3, $4, $5)`,
        [
          rows[0].worker_id,
          new Date().toLocaleDateString(),
          timeDifferenceInHours,
          check_in_time,
          check_out_time,
        ],
        async (err, result) => {
          if (err) {
            console.error(err);
            req.status(500).json({ message: err.message });
          } else {
            await pool.query(`DELETE FROM check_in_out WHERE uid = $1`, [
              rows[0].uid,
            ]);
          }
        }
      );
    }

    res.json({ message: "Logged out" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { supervisorLogin, adminLogin, workerlogin, workerLogout };
