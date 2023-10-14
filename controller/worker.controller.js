const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

async function createWorker(req, res) {
  // console.log(req.files);
  // console.log(req.headers);

  const {
    fullname,
    phone,
    site_assigned,
    daily_wage_salary,
    username,
    password,
    lat,
    long,
  } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const docs = req.files.map((file) => `/assets/images/${file.filename}`);
    // `/assets/categories/banners/${req.file.filename}`

    await pool.query(
      `INSERT INTO workers (fullname, phone, docs, site_assigned, password, daily_wage_salary, username, hpassword, lat, long) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        fullname,
        phone,
        docs,
        site_assigned,
        password,
        daily_wage_salary,
        username,
        hashedPassword,
        lat,
        long,
      ]
    );

    res.json({ message: "CREATED" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateProfileImage(req, res) {
  const { worker_id } = req.body;

  try {
    await pool.query("UPDATE workers SET profile_img = $1 WHERE id = $2", [
      `/assets/images/${req.file.filename}`,
      worker_id,
    ]);
    res.json({ message: "Profile image added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateWorkerById(req, res) {
  const {
    worker_id,
    fullname,
    phone,
    site_assigned,
    daily_wage_salary,
    username,
  } = req.body;

  const docs = req.files.map((file) => `/assets/${file.filename}`);
  const profile_img = req.file ? `/assets/${req.file.filename}` : null;

  try {
    const { rowCount } = await pool.query(
      `UPDATE workers SET fullname = $1, phone = $2, site_assigned = $4, password = $5, daily_wage_salary = $7, username = $8 WHERE id = $9;`,
      [
        fullname,
        phone,
        site_assigned,
        password,
        daily_wage_salary,
        username,
        parseInt(worker_id),
      ]
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

async function siteAssign(req, res) {
  const { site_id, worker_id } = req.body;
  try {
    const site = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (site.rowCount === 0) {
      return res.status(404).json({ message: "Site not exist!" });
    }

    const worker = await pool.query(`SELECT * FROM workers WHERE id = $1`, [
      worker_id,
    ]);

    if (worker.rowCount === 0) {
      return res.status(404).json({ message: "Worker not exist!" });
    }

    await pool.query(`UPDATE workers SET site_assigned = $1 WHERE id = $2;`, [
      site_id,
      worker_id,
    ]);

    res.json({ message: "Site assigned." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteWorkerById(req, res) {
  const { worker_id } = req.body;
  try {
    const { rowCount } = await pool.query(`DELETE FROM workers WHERE id = $1`, [
      worker_id,
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
  const { worker_id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM workers WHERE id = $1`,
      [worker_id]
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
  siteAssign,
  updateProfileImage,
};
