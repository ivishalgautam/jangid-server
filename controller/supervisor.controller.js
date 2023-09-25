const { validationResult } = require("express-validator");
const { pool } = require("../config/db");

async function createSupervisor(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, phone } = req.body;
  try {
    await pool.query(
      `INSERT INTO supervisors (fullname, email, phone) VALUES($1, $2, $3)`,
      [fullname, email, phone]
    );

    res.json({ message: "Created" });
  } catch (error) {
    console.log(error);
    req.status(500).json({ message: error.message });
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
    console.log(error);
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
    console.log(error);
    req.status(500).json({ message: error.message });
  }
}

async function getSupervisorbyId(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [supervisorId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    req.status(500).json({ message: error.message });
  }
}

async function getAllSupervisors(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM supervisors;`);
    res.json(rows);
  } catch (error) {
    console.log(error);
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
