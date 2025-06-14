const { validationResult } = require("express-validator");
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwtGenerator = require("../utils/jwtGenerator");
const { v4: uuidv4 } = require("uuid");
const { haversine } = require("../helper/haversine");
const {
  getCurrentTimeFormatted,
  getFormattedTimeInTimezone,
} = require("../helper/time");
const jwt = require("jsonwebtoken");
const {
  convertMillisecondsToTime,
} = require("../utils/convertMillisecondsToTime");
const moment = require("moment-timezone");

async function supervisorLogin(req, res) {
  const { username, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const supervisor = await pool.query(
      `SELECT id, fullname, email, phone, role, hpassword FROM supervisors WHERE LOWER(username) = $1`,
      [String(username).toLowerCase()]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({
        message: `supervisor not found!`,
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      supervisor.rows[0].hpassword
    );

    if (!validPassword) {
      return res.status(401).json({ message: "invalid credentials!" });
    }

    const { hpassword, ...data } = supervisor.rows[0];

    const jwtToken = jwtGenerator({ ...data }, "2d");

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
    const admin = await pool.query(
      `SELECT id, fullname, email, role, hpassword FROM admin WHERE LOWER(username) = $1`,
      [String(username).toLowerCase()]
    );

    if (admin.rowCount === 0) {
      return res.status(404).json({
        message: `Admin with this username: '${username}' not exist!`,
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      admin.rows[0].hpassword
    );

    if (!validPassword) {
      return res.status(401).json({ message: "invalid credentials!" });
    }

    const { hpassword, ...data } = admin.rows[0];

    const jwtToken = jwtGenerator({ ...data }, "2d");

    res.json({ admin: data, token: jwtToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function workerLogin(req, res) {
  const { username, password } = req.body;

  try {
    const record = await pool.query(
      `SELECT * FROM workers WHERE LOWER(username) = $1;`,
      [String(username).toLowerCase()]
    );

    if (record.rowCount === 0) {
      return res.status(404).json({
        message: `Worker not found!`,
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      record.rows[0].hpassword
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const { password: p, hpassword, ...data } = record?.rows[0];
    const token = jwt.sign(data, process.env.JWT_SEC, null);

    res.json({
      message: "success",
      status: 200,
      data: { worker: { ...data }, token },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function supervisorCheckIn(req, res) {
  const { lat, long } = req.body;
  const supervisor_id = req.user.id;

  try {
    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1;`,
      [supervisor_id]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({
        message: `supervisor not found!`,
      });
    }

    const sites =
      (
        await pool.query(
          `SELECT 
            st.* 
          from sites st 
          ORDER BY st.created_at DESC;`,
          []
        )
      )?.rows ?? [];
    // console.log({ sites });
    const siteToLogin = sites.find((site) => {
      const centerLat = site.lat;
      const centerLon = site.long;

      const checkLat = lat;
      const checkLon = long;

      const radius = site.radius;
      const distance = haversine(centerLat, centerLon, checkLat, checkLon);
      console.log({ distance });
      return distance <= radius;
    });

    if (!siteToLogin)
      return res.status(400).json({
        message: "You are not within the radius of any assigned site.",
      });

    const currentTime = new Date(
      `1970-01-01T${getFormattedTimeInTimezone("Asia/Kolkata")}`
    );

    const siteStartTime = new Date(`1970-01-01T${siteToLogin.start_time}`);
    const siteEndTime = new Date(`1970-01-01T${siteToLogin.end_time}`);
    console.log({ siteToLogin });
    if (currentTime < siteStartTime) {
      return res.status(400).json({
        message: `Site will open on ${siteToLogin.start_time}`,
      });
    }

    const data = await pool.query(
      `INSERT INTO supervisor_check_in_out (uid, check_in, supervisor_id, date, site_id) VALUES ($1, CURRENT_TIMESTAMP, $2, CURRENT_DATE, $3) returning *`,
      [uuidv4(), supervisor_id, siteToLogin.id]
    );

    await pool.query(
      `UPDATE supervisors SET is_present = true WHERE id = $1;`,
      [supervisor_id]
    );

    return res.json({
      message: "success",
      status: 200,
      session_id: data.rows[0].uid,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function supervisorCheckOut(req, res) {
  const { session_id, lat, long, punch_out_time } = req.body;
  let extraHours;
  let dailyWage;
  let data;

  try {
    const sessionRecord = await pool.query(
      "SELECT * FROM supervisor_check_in_out WHERE uid = $1;",
      [session_id]
    );
    if (sessionRecord.rowCount === 0) {
      return res.status(400).json({ message: "session expired!" });
    }

    const { supervisor_id, site_id } = sessionRecord.rows[0];

    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1;`,
      [supervisor_id]
    );

    if (supervisor.rowCount === 0) {
      return res.status(400).json({ message: "supervisor not found!" });
    }

    const siteAssigned = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (siteAssigned.rowCount === 0) {
      return res.status(400).json({ message: "site not found!" });
    }
    // Coordinates of the center point (latitude and longitude)
    const centerLat = siteAssigned.rows[0].lat;
    const centerLon = siteAssigned.rows[0].long;

    // Coordinates of the point to check (latitude and longitude)
    const checkLat = req.user.role === "admin" ? centerLat : lat;
    const checkLon = req.user.role === "admin" ? centerLon : long;

    const radius = siteAssigned.rows[0].radius;
    const distance = haversine(centerLat, centerLon, checkLat, checkLon);

    if (distance > radius) {
      return res.status(400).json({ message: "You are out of radius!" });
    }

    if (req.user.role === "admin") {
      data = await pool.query(
        `UPDATE supervisor_check_in_out set check_out = $1 WHERE uid = $2 returning *`,
        [
          new Date(punch_out_time).toISOString().slice(0, 19).replace("T", " "),
          session_id,
        ]
      );
    } else {
      data = await pool.query(
        `UPDATE supervisor_check_in_out set check_out = CURRENT_TIMESTAMP WHERE uid = $1 returning *`,
        [session_id]
      );
    }

    const { rows, rowCount } = data;
    if (rowCount === 0) {
      return res.status(400).json({ message: "Session expired!" });
    }

    const check_in_time = rows[0].check_in;
    const check_out_time =
      req.user.role === "admin"
        ? moment(punch_out_time).tz("Asia/Kolkata").format()
        : rows[0].check_out;

    // Calculate the time difference in hours
    const timeDifferenceInMilliseconds =
      new Date(check_out_time) - new Date(check_in_time);

    const timeDifferenceInHours =
      timeDifferenceInMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours

    const siteHours = await pool.query(
      `SELECT 
          EXTRACT(HOUR FROM end_time - start_time) AS hours
          FROM sites where id = $1;
          `,
      [site_id]
    );

    const time_diff = convertMillisecondsToTime(timeDifferenceInMilliseconds);

    const check_in = moment(check_in_time).tz("Asia/Kolkata");
    const check_out = moment(check_out_time).tz("Asia/Kolkata");

    await pool.query(
      `INSERT INTO supervisor_attendances (supervisor_id, hours, check_in, check_out, site_id, time_diff) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        supervisor_id,
        timeDifferenceInHours,
        check_in.format(),
        check_out.format(),
        site_id,
        time_diff,
      ],
      async (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: err.message });
        } else {
          await pool.query(
            `DELETE FROM supervisor_check_in_out WHERE uid = $1`,
            [rows[0].uid]
          );
          await pool.query(
            `UPDATE supervisors SET is_present = false WHERE id = $1;`,
            [rows[0].supervisor_id]
          );
          res.json({ message: "Logged out" });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function workerCheckIn(req, res) {
  const { lat, long } = req.body;
  const worker_id = req.user.id;

  try {
    const worker = await pool.query(`SELECT * FROM workers WHERE id = $1;`, [
      worker_id,
    ]);

    if (worker.rowCount === 0) {
      return res.status(404).json({
        message: `Worker not found!`,
      });
    }

    if (!worker.rows[0].site_assigned) {
      return res
        .status(400)
        .json({ message: "You are not assigned to any site!" });
    }

    const updateLatLong = await pool.query(
      `UPDATE workers SET lat = $1, long = $2 WHERE id = $3 returning *`,
      [lat, long, worker_id]
    );

    const siteAssigned = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      worker.rows[0].site_assigned,
    ]);

    if (siteAssigned.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "You are not assigned to any site!" });
    }

    // const supervisor = await pool.query(
    //   `select supervisor_id from site_supervisor_map where site_id = $1`,
    //   [siteAssigned.rows[0].id]
    // );

    // if (!supervisor.rowCount)
    //   return res
    //     .status(409)
    //     .json({ message: "Supervisor not assigned to site!" });

    console.log(siteAssigned.rows[0]);
    const currentTime = new Date(
      `1970-01-01T${getFormattedTimeInTimezone("Asia/Kolkata")}`
    );

    const siteStartTime = new Date(
      `1970-01-01T${siteAssigned.rows[0].start_time}`
    );

    const siteEndTime = new Date(`1970-01-01T${siteAssigned.rows[0].end_time}`);

    console.log({ currentTime, siteStartTime });

    if (currentTime < siteStartTime) {
      return res.status(400).json({
        message: `Site will open on ${siteAssigned.rows[0].start_time}`,
      });
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
      const { rows, rowCount } = await pool.query(
        `INSERT INTO check_in_out (uid, check_in, worker_id, date, site_id) VALUES ($1, CURRENT_TIMESTAMP, $2, CURRENT_DATE, $3) returning *`,
        [uuidv4(), worker.rows[0].id, worker.rows[0].site_assigned]
      );

      if (rowCount > 0) {
        await pool.query(
          `UPDATE workers SET is_present = true WHERE id = $1;`,
          [worker.rows[0].id]
        );
        const checkInRecord = await pool.query(
          `SELECT * FROM expenses WHERE worker_id = $1 AND created_at::date = CURRENT_DATE`,
          [worker_id]
        );
        console.log({ checkInRecord });
        if (checkInRecord.rowCount === 0) {
          console.log("First time check in today");
          await pool.query(
            `INSERT INTO expenses (amount, purpose, site_id, worker_id, type) VALUES ($1, $2, $3, $4, $5)`,
            [60, "worker", worker.rows[0].site_assigned, worker_id, "food"]
          );
          // const supervisorWallet = await pool.query(
          //   `SELECT * FROM wallet WHERE supervisor_id = $1`,
          //   [supervisor.rows[0].supervisor_id]
          // );
        } else {
          console.log("Checked in before once");
        }
      }

      return res.json({
        message: "success",
        status: 200,
        session_id: rows[0].uid,
      });
    } else {
      console.error(`The point is outside ${radius} meters of the center.`);
      return res.status(400).json({ message: "You are out of radius!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function workerCheckOut(req, res) {
  const { session_id, lat, long, punch_out_time } = req.body;
  console.log(req.body);

  let extraHours;
  let dailyWage;
  let data;

  try {
    const sessionRecord = await pool.query(
      "SELECT * FROM check_in_out WHERE uid = $1;",
      [session_id]
    );

    if (sessionRecord.rowCount === 0) {
      return res.status(400).json({ message: "session expired!" });
    }

    const worker = await pool.query(`SELECT * FROM workers WHERE id = $1;`, [
      sessionRecord.rows[0].worker_id,
    ]);

    if (worker.rowCount === 0) {
      return res.status(400).json({ message: "worker not found!" });
    }

    const siteAssigned = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      worker.rows[0].site_assigned,
    ]);

    if (siteAssigned.rowCount === 0) {
      return res.status(400).json({ message: "site not found!" });
    }
    // Coordinates of the center point (latitude and longitude)
    const centerLat = siteAssigned.rows[0].lat;
    const centerLon = siteAssigned.rows[0].long;

    // Coordinates of the point to check (latitude and longitude)
    const checkLat = req.user.role === "admin" ? centerLat : lat;
    const checkLon = req.user.role === "admin" ? centerLon : long;

    const radius = siteAssigned.rows[0].radius;
    const distance = haversine(centerLat, centerLon, checkLat, checkLon);

    if (distance > radius) {
      return res.status(400).json({ message: "You are out of radius!" });
    }

    if (req.user.role === "admin") {
      data = await pool.query(
        `UPDATE check_in_out set check_out = $1 WHERE uid = $2 returning *`,
        [
          new Date(punch_out_time).toISOString().slice(0, 19).replace("T", " "),
          session_id,
        ]
      );
    } else {
      data = await pool.query(
        `UPDATE check_in_out set check_out = CURRENT_TIMESTAMP WHERE uid = $1 returning *`,
        [session_id]
      );
    }

    const { rows, rowCount } = data;
    console.log({
      db: rows[0].check_out,
    });
    // console.log(rows);
    if (rowCount === 0) {
      return res.status(400).json({ message: "Session expired!" });
    }

    dailyWage = worker.rows[0].daily_wage_salary;

    const check_in_time = rows[0].check_in;
    const check_out_time =
      req.user.role === "admin"
        ? moment(punch_out_time).tz("Asia/Kolkata").format()
        : rows[0].check_out;

    console.log({ check_in_time, check_out_time });
    // Calculate the time difference in hours
    const timeDifferenceInMilliseconds =
      new Date(check_out_time) - new Date(check_in_time);

    const timeDifferenceInHours =
      timeDifferenceInMilliseconds / (1000 * 60 * 60); // Convert milliseconds to hours

    const siteHours = await pool.query(
      `SELECT 
            EXTRACT(HOUR FROM end_time - start_time) AS hours
            FROM sites where id = $1;
            `,
      [worker.rows[0].site_assigned]
    );

    extraHours = timeDifferenceInHours - siteHours.rows[0].hours;

    console.log({
      timeDifferenceInHours,
      siteHours: siteHours.rows[0].hours,
      extraHours: Math.floor(extraHours),
    });

    let earned = dailyWage;

    for (let i = 3; i <= 60; i += 3) {
      if (Math.round(extraHours) <= 0) {
        earned = Math.round(
          (dailyWage / siteHours.rows[0].hours) * timeDifferenceInHours
        );
        break;
      }

      if (extraHours >= i) {
        earned = Math.round((i / 3) * dailyWage);
        break;
      }
    }
    console.log({ earned });
    const time_diff = convertMillisecondsToTime(timeDifferenceInMilliseconds);

    const check_in = moment(check_in_time).tz("Asia/Kolkata");
    const check_out = moment(check_out_time).tz("Asia/Kolkata");

    if (rowCount > 0) {
      await pool.query(
        `INSERT INTO attendances (worker_id, hours, check_in, check_out, earned, site_id, time_diff) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          rows[0].worker_id,
          timeDifferenceInHours,
          check_in.format(),
          check_out.format(),
          earned,
          worker.rows[0].site_assigned,
          time_diff,
        ],
        async (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: err.message });
          } else {
            await pool.query(`DELETE FROM check_in_out WHERE uid = $1`, [
              rows[0].uid,
            ]);
            await pool.query(
              `UPDATE workers SET is_present = false WHERE id = $1;`,
              [rows[0].worker_id]
            );
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

module.exports = {
  supervisorLogin,
  adminLogin,
  workerCheckIn,
  workerCheckOut,
  workerLogin,
  supervisorCheckIn,
  supervisorCheckOut,
};
