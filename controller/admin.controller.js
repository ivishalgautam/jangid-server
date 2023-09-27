const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

async function createAdmin(req, res) {
  const { fullname, email, username, password } = req.body;

  try {
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
