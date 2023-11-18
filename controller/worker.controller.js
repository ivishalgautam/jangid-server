const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

async function createWorker(req, res) {
  const {
    fullname,
    phone,
    site_assigned,
    daily_wage_salary,
    username,
    password,
    lat,
    long,
    address,
  } = req.body;

  let record;
  try {
    record = await pool.query(`SELECT * FROM workers WHERE phone = $1;`, [
      phone,
    ]);

    if (record.rowCount > 0) {
      return res.status(409).json({
        message: `phone already exist!`,
      });
    }

    record = await pool.query(`SELECT * FROM workers WHERE username = $1;`, [
      username,
    ]);

    if (record.rowCount > 0) {
      return res.status(409).json({
        message: `username already exist!`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const docs = req.files.map((file) => `/assets/images/${file.filename}`);

    const { rows } = await pool.query(
      `INSERT INTO workers (fullname, phone, docs, site_assigned, password, daily_wage_salary, username, hpassword, lat, long, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [
        fullname,
        phone,
        docs,
        site_assigned,
        password,
        daily_wage_salary,
        username.trim(),
        hashedPassword,
        lat,
        long,
        address,
      ]
    );

    res.json({ message: "CREATED", status: 200, worker_id: rows[0].id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateProfileImage(req, res) {
  const { worker_id } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      "SELECT * FROM workers WHERE id = $1;",
      [worker_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "worker not exist!" });
    }

    const file =
      rows[0]?.profile_img !== null && rows[0]?.profile_img !== ""
        ? path.join(__dirname, "../", rows[0]?.profile_img)
        : "";

    if (fs.existsSync(file)) {
      fs.unlink(file, (err) => {
        if (err) {
          console.log(`error deleting file:${file}`);
        } else {
          console.log("prev profile removed");
        }
      });
    }

    await pool.query(
      "UPDATE workers SET profile_img = $1 WHERE id = $2 returning *;",
      [`/assets/images/${req.file.filename}`, worker_id]
    );

    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function uploadDocs(req, res) {
  const workerId = parseInt(req.params.workerId);
  // return console.log(req.files);
  const docs = req?.files?.map((file) => `/assets/images/${file.filename}`);
  // console.log({ file: req.files, docs });

  try {
    const record = await pool.query(`SELECT * FROM workers where id = $1;`, [
      workerId,
    ]);

    if (record.rowCount === 0) {
      return res.status(404).json({ message: "worker not found!" });
    }

    const { rowCount } = await pool.query(
      `UPDATE workers SET docs = $1 WHERE id = $2`,
      [
        record.rows[0]?.docs !== null
          ? [...record.rows[0]?.docs, ...docs]
          : [...docs],
        workerId,
      ]
    );

    res.json({ message: "UPDATED" });
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
    password,
  } = req.body;

  if (!worker_id) {
    return res.status(400).json({ message: "worker_id not found!" });
  }

  const docs = req.files.map((file) => `/assets/${file.filename}`);
  const profile_img = req.file ? `/assets/${req.file.filename}` : null;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rowCount } = await pool.query(
      `UPDATE workers SET fullname = $1, phone = $2, site_assigned = $3, daily_wage_salary = $4, username = $5, password = $6, hpassword = $7 WHERE id = $8;`,
      [
        fullname,
        phone,
        site_assigned,
        daily_wage_salary,
        username,
        password,
        hashedPassword,
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
    const { rows, rowCount } = await pool.query(
      `DELETE FROM workers WHERE id = $1`,
      [worker_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    } else {
      await pool.query(
        `DELETE FROM check_in_out WHERE worker_id = $1;`,
        [worker_id],
        (err, result) => {
          if (err) {
            console.error("error deleting sessions");
          }
        }
      );

      const filesToDelete = rows[0]?.docs.map((file) =>
        path.join(__dirname, "../", file)
      );

      filesToDelete?.forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlink(file);
          console.log(`file:${path.basename(file)} deleted`);
        } else {
          console.error(`file:${path.basename(file)} not found!`);
        }
      });

      await pool.query(
        `DELETE FROM attendances WHERE worker_id = $1;`,
        [worker_id],
        (err, result) => {
          if (err) {
            console.error("error deleting attendances");
          }
        }
      );
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

    res.json({ status: 200, message: "success", worker: rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllWorkers(req, res) {
  const { present } = req.query;
  let data = [];

  try {
    switch (present) {
      case "true":
        data = await pool.query(
          `SELECT * FROM workers WHERE is_present = true ORDER BY created_at DESC;`
        );
        break;

      case "false":
        data = await pool.query(
          `SELECT * FROM workers WHERE is_present = false ORDER BY created_at DESC;`
        );
        break;

      default:
        data = await pool.query(
          `SELECT * FROM workers ORDER BY created_at DESC;`
        );
        break;
    }

    res.json({
      message: "success",
      status: 200,
      data: data.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function punchedInWorkers(req, res) {
  try {
    const { rows } = await pool.query(
      `
        SELECT 
            cio.*,
            w.username as worker_username,
            w.fullname as worker_fullname
        FROM check_in_out cio 
        LEFT JOIN workers w on w.id = cio.worker_id 
        ;`
    );

    res.json({ message: "success", status: 200, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function deletePunchedIn(req, res) {
  try {
    const record = await pool.query(
      `
        DELETE FROM check_in_out WHERE uid = $1 returning *;
        ;`,
      [req.params.sessionId]
    );

    if (record.rowCount === 0) {
      return res.status(404).json({ message: "not found!" });
    }

    console.log({ worker_id: record.rows[0].worker_id });

    await pool.query(`UPDATE workers SET is_present = false WHERE id = $1;`, [
      record.rows[0].worker_id,
    ]);

    // console.log({ deleted: record.rows });

    res.json({ message: "success", status: 200, data: "deleted" });
  } catch (error) {
    console.error(error);
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
  uploadDocs,
  punchedInWorkers,
  deletePunchedIn,
};
