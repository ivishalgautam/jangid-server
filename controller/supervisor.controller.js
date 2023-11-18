const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function createSupervisor(req, res) {
  const { fullname, email, phone, username, password, site_assigned } =
    req.body;
  const docs = req.files.map((file) => `/assets/images/${file.filename}`);

  const usernameRegex = new RegExp("^[a-zA-Z0-9_]{3,20}$");

  if (!usernameRegex.test(username.trim().toLowerCase())) {
    return res.status(400).json({ message: "username not valid" });
  }

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

    const supervisor = await pool.query(
      `INSERT INTO supervisors (fullname, email, phone, username, password, hpassword, docs, site_assigned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *;`,
      [
        fullname,
        email,
        phone,
        username.trim().toLowerCase(),
        password,
        hashedPassword,
        docs,
        site_assigned,
      ]
    );

    if (supervisor.rowCount > 0) {
      await pool.query(
        "INSERT INTO wallet (supervisor_id, amount) VALUES ($1, 0)",
        [supervisor.rows[0].id]
      );
    }

    res.json({
      message: "Created",
      status: 200,
      supervisor_id: supervisor.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSupervisorById(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);
  const { fullname, email, phone, site_assigned, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rowCount } = await pool.query(
      `UPDATE supervisors SET fullname = $1, email = $2, phone = $3, site_assigned = $4, password = $5, hpassword = $6 WHERE id = $7`,
      [
        fullname,
        email,
        phone,
        site_assigned,
        password,
        hashedPassword,
        supervisorId,
      ]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json({ message: "UPDATED" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateProfileImage(req, res) {
  const { supervisorId } = req.params;

  try {
    const { rows, rowCount } = await pool.query(
      "SELECT * FROM supervisors WHERE id = $1",
      [supervisorId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "supervisor not found!" });
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

    await pool.query("UPDATE supervisors SET profile_img = $1 WHERE id = $2", [
      `/assets/images/${req.file.filename}`,
      supervisorId,
    ]);

    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function uploadDocs(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);
  const docs = req.files.map((file) => `/assets/images/${file.filename}`);

  try {
    const record = await pool.query(
      `SELECT * FROM supervisors where id = $1;`,
      [supervisorId]
    );
    if (record.rowCount === 0) {
      return res.status(404).json({ message: "supervisor not found!" });
    }

    const { rowCount } = await pool.query(
      `UPDATE supervisors SET docs = $1 WHERE id = $2`,
      [
        record.rows[0]?.docs !== null
          ? [...record.rows[0]?.docs, ...docs]
          : [...docs],
        supervisorId,
      ]
    );

    res.json({ message: "UPDATED" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteSupervisorById(req, res) {
  const supervisorId = parseInt(req.body.supervisor_id);
  try {
    const { rows, rowCount } = await pool.query(
      `DELETE FROM supervisors WHERE id = $1 returning *`,
      [supervisorId]
    );

    const filesToDelete = rows?.[0]?.docs?.map((file) =>
      path.join(__dirname, "../", file)
    );

    filesToDelete?.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`file:${path.basename(file)} deleted`);
      } else {
        console.error(`file:${path.basename(file)} not found!`);
      }
    });

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    } else {
      await pool.query(`DELETE FROM wallet WHERE supervisor_id = $1;`, [
        supervisorId,
      ]);
    }

    res.json({ message: "DELETED" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getSupervisorbyId(req, res) {
  const { supervisor_id } = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `
      SELECT s.*, 
          w.amount as wallet_balance FROM supervisors s
          LEFT JOIN wallet w on s.id = w.supervisor_id 
          WHERE s.id = $1`,
      [supervisor_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllSupervisors(req, res) {
  try {
    const { rows } = await pool.query(`
        SELECT s.*, w.amount as wallet_balance FROM supervisors s
            LEFT JOIN wallet w on s.id = w.supervisor_id
            ORDER BY created_at DESC
        `);
    res.json({ message: "success", status: 200, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function siteAssign(req, res) {
  const { supervisor_id } = req.body;
  const site_id = req.params.siteId;
  // console.log(req.body, req.params);
  try {
    const site = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      parseInt(site_id),
    ]);

    if (site.rowCount === 0) {
      return res.status(404).json({ message: "Site not exist!" });
    }

    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [parseInt(supervisor_id)]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({ message: "Supervisor not exist!" });
    }

    await pool.query(
      `UPDATE supervisors SET site_assigned = null WHERE site_assigned = $1;`,
      [site_id]
    );

    await pool.query(
      `UPDATE supervisors SET site_assigned = $1 WHERE id = $2;`,
      [site_id, supervisor_id]
    );

    res.json({ message: "Site assigned." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createSupervisor,
  updateSupervisorById,
  deleteSupervisorById,
  getSupervisorbyId,
  getAllSupervisors,
  siteAssign,
  uploadDocs,
  updateProfileImage,
};
