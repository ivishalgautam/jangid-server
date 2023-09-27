const { validationResult } = require("express-validator");
const { pool } = require("../config/db");
const path = require("path");
const fs = require("fs");

async function createWorker(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, phone, site_assigned } = req.body;
  try {
    const docs = req.files.map((file) => `/assets/${file.filename}`);
    const profile_img = req.file ? `/assets/${req.file.filename}` : null;

    await pool.query(
      `INSERT INTO workers (fullname, phone, docs, site_assigned, password, profile_img) VALUES ($1, $2, $3, $4, $5, $6)`,
      [fullname, phone, docs, site_assigned, password, profile_img]
    );

    res.json({ message: "CREATED" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateWorkerById(req, res) {
  const workerId = parseInt(req.params.workerId);
  const { fullname, email, phone } = req.body;

  try {
    const { rowCount } = await pool.query(
      `UPDATE workers SET fullname = $1, email = $2, phone = $3 WHERE id = $4`,
      [fullname, email, phone, workerId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json({ message: "UPDATED" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteWorkerById(req, res) {
  const workerId = parseInt(req.params.workerId);
  try {
    const { rowCount } = await pool.query(`DELETE FROM workers WHERE id = $1`, [
      workerId,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json({ message: "DELETED" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getWorkerById(req, res) {
  const workerId = parseInt(req.params.workerId);
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM workers WHERE id = $1`,
      [workerId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllWorkers(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM workers;`);

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createWorker,
  updateWorkerById,
  deleteWorkerById,
  getWorkerById,
  getAllWorkers,
};
