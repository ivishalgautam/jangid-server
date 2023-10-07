const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

async function createAdmin(req, res) {
  const { fullname, email, username, password } = req.body;

  try {
    const emailExist = await pool.query(
      `SELECT * FROM admin WHERE email = $1`,
      [email]
    );

    if (emailExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: `Admin already exist with this '${email}' email!` });
    }

    const usernameExist = await pool.query(
      `SELECT * FROM admin WHERE username = $1`,
      [username]
    );

    if (usernameExist.rowCount > 0) {
      return res.status(400).json({
        message: `Admin already exist with this '${username}' username!`,
      });
    }

    const hpassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO admin (fullname, email, username, password, hpassword) VALUES ($1, $2, $3, $4, $5)`,
      [fullname, email, username, password, hpassword]
    );

    res.json({ message: "Admin created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { createAdmin };
