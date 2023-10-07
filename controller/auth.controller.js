const { validationResult } = require("express-validator");
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwtGenerator = require("../utils/jwtGenerator");

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

module.exports = { supervisorLogin, adminLogin };
