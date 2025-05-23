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

  const usernameRegex = new RegExp("^[a-zA-Z0-9_]{3,20}$");

  if (!usernameRegex.test(username.trim().toLowerCase())) {
    return res.status(400).json({ message: "username not valid" });
  }

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
    const docs = req.files.map((file) => `/assets/${file.filename}`);

    const { rows } = await pool.query(
      `INSERT INTO workers (fullname, phone, docs, site_assigned, password, daily_wage_salary, username, hpassword, lat, long, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [
        fullname,
        phone,
        docs,
        site_assigned,
        password,
        daily_wage_salary,
        username.trim().toLowerCase(),
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

async function updateWorkerById(req, res) {
  const {
    worker_id,
    fullname,
    phone,
    site_assigned,
    daily_wage_salary,
    username,
    password,
    docs,
  } = req.body;
  console.log(req.body);
  console.log({ docs });
  if (!worker_id) {
    return res.status(400).json({ message: "worker_id not found!" });
  }
  const newDocs = !req.files
    ? []
    : req.files.map((file) => `/assets/${file.filename}`);

  try {
    const record = await pool.query(`SELECT * FROM workers WHERE id = $1`, [
      parseInt(worker_id),
    ]);

    if (record.rowCount === 0) {
      return res.status(404).json({ message: "WORKER NOT FOUND!" });
    }

    const storedDocs = record.rows[0].docs ?? [];
    const docsToDelete = docs
      ? storedDocs.filter((doc) => !JSON.parse(docs).includes(doc))
      : [];
    docsToDelete.forEach((doc) => {
      const filepath = path.join(__dirname, "../", doc);
      if (fs.existsSync(filepath)) {
        fs.unlink(filepath, (err) => {
          if (err) {
            console.log(`error deleting filepath:${filepath}`);
          } else {
            console.log(`filepath:'${filepath}' removed`);
          }
        });
      }
    });
    const updatedDocs = [...newDocs, ...JSON.parse(docs ?? [])];
    console.log({ storedDocs, docsToDelete, updatedDocs });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rowCount } = await pool.query(
      `UPDATE workers SET fullname = $1, phone = $2,  daily_wage_salary = $3, username = $4, docs = $5, password = $6, hpassword = $7 WHERE id = $8;`,
      [
        fullname,
        phone,
        daily_wage_salary,
        username,
        updatedDocs,
        password,
        hashedPassword,
        parseInt(worker_id),
      ]
    );

    res.json({ message: "UPDATED" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateProfileImage(req, res) {
  const { worker_id } = req.params;

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
      [`/assets/${req.file.filename}`, worker_id]
    );

    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updatePassword(req, res) {
  const { id } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      "SELECT * FROM workers WHERE id = $1;",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "worker not exist!" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await pool.query(
      "UPDATE workers SET hpassword = $1, password = $2 WHERE id = $3 returning *;",
      [hashedPassword, req.body.password, id]
    );

    res.json({ message: "Password updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function uploadDocs(req, res) {
  const workerId = parseInt(req.params.workerId);
  // return console.log(req.files);
  const docs = req?.files?.map((file) => `/assets/${file.filename}`);
  // console.log({ file: req.files, docs });

  try {
    const record = await pool.query(`SELECT * FROM workers where id = $1;`, [
      workerId,
    ]);

    if (record.rowCount === 0) {
      return res.status(404).json({ message: "worker not found!" });
    }
    const stroredDocs = record.rows[0]?.docs;

    const { rowCount } = await pool.query(
      `UPDATE workers SET docs = $1 WHERE id = $2`,
      [
        stroredDocs !== null ? [...record.rows[0]?.docs, ...docs] : [...docs],
        workerId,
      ]
    );

    res.json({ message: "UPDATED" });
  } catch (error) {
    console.error(error);
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
    // const { rows, rowCount } = await pool.query(
    //   `SELECT
    //       wk.*
    //     FROM workers wk
    //     WHERE wk.id = $1
    //     `,
    //   [worker_id]
    // );

    const { rows, rowCount } = await pool.query(
      `SELECT
          wk.*,
          ROUND((
            SELECT COALESCE(SUM(at.hours::numeric), 0)
            FROM attendances at
            WHERE at.worker_id = wk.id
          ), 2) AS total_working_hours,
          ROUND((
            SELECT COALESCE(SUM(at.earned::numeric), 0)
            FROM attendances at
            WHERE at.worker_id = wk.id
          ), 2) AS total_payout,
          ROUND((
            SELECT COALESCE(SUM(wp.amount::numeric), 0)
            FROM worker_payouts wp
            WHERE wp.worker_id = wk.id
          ), 2) AS total_paid,
          ROUND((
            (SELECT COALESCE(SUM(at.earned::numeric), 0)
            FROM attendances at
            WHERE at.worker_id = wk.id)
            -
            (SELECT COALESCE(SUM(wp.amount::numeric), 0)
            FROM worker_payouts wp
            WHERE wp.worker_id = wk.id)
          ), 2) AS pending_payout
        FROM workers wk
        WHERE wk.id = $1;
        `,
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
            w.fullname as worker_fullname,
            w.profile_img
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
  updatePassword,
};
