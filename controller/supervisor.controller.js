const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

async function createSupervisor(req, res) {
  const { fullname, email, phone, username, password, site_assigned } =
    req.body;
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
      `INSERT INTO supervisors (fullname, email, phone, username, password, hpassword, profile_img, site_assigned) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [
        fullname,
        email,
        phone,
        username,
        password,
        hashedPassword,
        profile_img,
        site_assigned,
      ]
    );

    res.json({ message: "Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSupervisorById(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);
  const { fullname, email, phone, site_assigned } = req.body;
  try {
    const { rowCount } = await pool.query(
      `UPDATE supervisors SET fullname = $1, email = $2, phone = $3, site_assigned = $4 WHERE id = $5`,
      [fullname, email, phone, site_assigned, supervisorId]
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

async function deleteSupervisorById(req, res) {
  const supervisorId = parseInt(req.body.supervisor_id);
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
}

async function getAllSupervisors(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM supervisors;`);
    res.json({ message: "success", status: 200, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function siteAssign(req, res) {
  const { supervisor_id } = req.body;
  const site_id = req.params.siteId;
  console.log(req.body, req.params);
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
};
