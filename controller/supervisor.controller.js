const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

async function createSupervisor(req, res) {
  const { fullname, email, phone, username, password } = req.body;
  const profile_img = `/assets/images/${req.file.filename}`;
  // console.log(req.body, profile_img);

  try {
    const emailExist = await pool.query(
      `SELECT email FROM supervisors WHERE email = $1;`,
      [email]
    );
    if (emailExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "supervisor exist with this email!" });
    }

    const phoneExist = await pool.query(
      `SELECT phone FROM supervisors WHERE phone = $1;`,
      [phone]
    );
    if (phoneExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "supervisor exist with this phone!" });
    }

    const usernameExist = await pool.query(
      `SELECT username FROM supervisors WHERE username = $1`,
      [username]
    );
    if (usernameExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "supervisor exist with this username!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO supervisors (fullname, email, phone, username, password, hpassword, profile_img) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [fullname, email, phone, username, password, hashedPassword, profile_img]
    );

    res.json({ message: "Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSupervisorById(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);
  const { fullname, email, phone } = req.body;
  try {
    const { rowCount } = await pool.query(
      `UPDATE supervisors SET fullname = $1, email = $2, phone = $3 WHERE id = $4`,
      [fullname, email, phone, supervisorId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json({ message: "UPDATED" });
  } catch (error) {
    console.error(error);
    req.status(500).json({ message: error.message });
  }
}

async function deleteSupervisorById(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM supervisors WHERE id = $1`,
      [supervisorId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json({ message: "DELETED" });
  } catch (error) {
    console.error(error);
    req.status(500).json({ message: error.message });
  }
}

async function getSupervisorbyId(req, res) {
  const { supervisor_id } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [supervisor_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    req.status(500).json({ message: error.message });
  }
}

async function getAllSupervisors(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM supervisors;`);
    res.json({ message: "success", status: 200, data: rows });
  } catch (error) {
    console.error(error);
    req.status(500).json({ message: error.message });
  }
}

module.exports = {
  createSupervisor,
  updateSupervisorById,
  deleteSupervisorById,
  getSupervisorbyId,
  getAllSupervisors,
};
