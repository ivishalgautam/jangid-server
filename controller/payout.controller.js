const { pool } = require("../config/db");

async function addWorkerPayout(req, res) {
  const { amount, worker_id, supervisor_id } = req.body;
  try {
    const worker = await pool.query(`SELECT * FROM workers WHERE id = $1`, [
      worker_id,
    ]);
    console.log(
      amount,
      "payout",
      worker.rows[0].site_assigned,
      worker_id,
      supervisor_id
    );
    if (worker.rowCount === 0) {
      return res.status(404).json({ message: "Worker not found!" });
    }
    const siteAssignedToWorker = worker.rows[0].site_assigned;

    if (!siteAssignedToWorker)
      return res
        .status(409)
        .json({ message: "Worker not assigned to any site." });

    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [supervisor_id]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({ message: "Supervisor not found!" });
    }

    await pool.query(
      `INSERT INTO worker_payouts (amount, worker_id, supervisor_id, site_id) VALUES ($1, $2, $3, $4)`,
      [amount, worker_id, supervisor_id, siteAssignedToWorker]
    );

    await pool.query(
      `INSERT INTO expenses (amount, type, purpose, site_id, worker_id, supervisor_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        amount,
        "payout",
        "worker",
        worker.rows[0].site_assigned,
        worker_id,
        supervisor_id,
      ]
    );

    res.json({ message: "Payout added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function addSitePayout(req, res) {
  const { amount, site_id, supervisor_id, comment } = req.body;
  try {
    const site = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (site.rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [supervisor_id]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({ message: "Supervisor not found!" });
    }

    await pool.query(
      `INSERT INTO site_payouts (amount, site_id, supervisor_id, comment) VALUES ($1, $2, $3, $4)`,
      [amount, site_id, supervisor_id, comment],
      (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        } else {
          res.json({ message: "Payout added" });
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// get worker payout
async function getWorkerPayouts(req, res) {
  const { worker_id } = req.body;
  try {
    const worker = await pool.query(`SELECT * FROM workers WHERE id = $1`, [
      worker_id,
    ]);

    if (worker.rowCount === 0) {
      return res.status(404).json({ message: "Worker not found!" });
    }

    const { rows } = await pool.query(
      `SELECT
        s.profile_img as supervisor_image, s.fullname as supervisor_name,
        wp.amount, wp.created_at FROM worker_payouts AS wp
      JOIN supervisors AS s ON s.id = wp.supervisor_id
      WHERE worker_id = $1;`,
      [worker_id]
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// get site payout
async function getSitePayouts(req, res) {
  const { site_id } = req.body;
  try {
    const site = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (site.rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    const { rows } = await pool.query(
      `SELECT * FROM site_payouts WHERE site_id = $1;`,
      [site_id]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// get all payouts with query site and worker
async function getAllPayouts(req, res) {
  const { query } = req.body;
  try {
    if (!query) {
      return res.status(404).json({ message: "Please pass some query!" });
    }

    switch (query) {
      case "worker":
        const workerPayouts = await pool.query(`SELECT * FROM worker_payouts;`);
        res.json(workerPayouts.rows);
        break;
      case "site":
        const sitePayouts = await pool.query(`SELECT * FROM site_payouts;`);
        res.json(sitePayouts.rows);
        break;
      default:
        res.status(404).json({ message: "No query found!" });
        break;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  addWorkerPayout,
  addSitePayout,
  getAllPayouts,
  getWorkerPayouts,
  getSitePayouts,
};
