const { pool } = require("../config/db");

async function supervisor(req, res) {
  const { supervisor_id } = req.body;
  try {
    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [supervisor_id]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    const { rows } = await pool.query(
      `SELECT 
            (SELECT COUNT(*) FROM sites AS s WHERE s.supervisor_id::integer = sv.id) AS site_count,
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id::integer = sv.id) AS worker_count,
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id::integer = sv.id AND w.is_present = true) AS present_worker_count,
            (SELECT COUNT(*) FROM wallet AS wlt WHERE wlt.supervisor_id::integer = sv.id) AS wallet_count
        FROM supervisors AS sv
        WHERE sv.id = $1;`,
      [supervisor_id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function admin(req, res) {
  let data = {};

  try {
    const { rows } = await pool.query(
      `SELECT 
            (SELECT COUNT(*) FROM sites AS s WHERE s.is_completed = false) AS ongoing_sites,
            (SELECT COUNT(*) FROM sites AS s WHERE s.is_completed = true) AS completed_sites,
            (SELECT COUNT(*) FROM workers) AS total_workers,
            (SELECT COUNT(*) FROM workers AS w WHERE w.is_present = true) AS present_workers,
            (SELECT COUNT(*) FROM supervisors) AS total_supervisors,
            (SELECT COUNT(*) FROM workers AS s WHERE s.is_present = true) AS present_supervisors,
            (SELECT SUM(amount) FROM expenses WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())) AS expense_this_month,
            (SELECT SUM(total_budget) FROM sites WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW()) AND is_completed = true) AS income_this_month;
            `
    );

    for (const [key, value] of Object.entries(rows[0])) {
      data[key] = value ?? "";
    }

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function worker(req, res) {
  const { worker_id } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT 
        (SELECT SUM(earned)
        FROM 
            attendances
        WHERE 
            EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND worker_id = $1) AS total_payout_this_month;`,
      [worker_id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { supervisor, admin, worker };
