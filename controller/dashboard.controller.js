const { pool } = require("../config/db");

async function supervisor(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);
  try {
    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [supervisorId]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    const { rows } = await pool.query(
      `SELECT 
            (SELECT COUNT(*) FROM sites AS s WHERE s.supervisor_id = sv.id) AS site_count,
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id = sv.id) AS worker_count,
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id = sv.id AND w.is_present = true) AS present_worker_count,
            (SELECT COUNT(*) FROM wallet AS wlt WHERE wlt.supervisor_id = sv.id) AS wallet_count
        FROM supervisors AS sv
        WHERE sv.id = $1;`,
      [supervisorId]
    );
    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function admin(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT 
            (SELECT COUNT(*) FROM sites AS s WHERE s.is_completed = false) AS ongoing_sites,
            (SELECT COUNT(*) FROM sites AS s WHERE s.is_completed = true) AS completed_sites,
            (SELECT COUNT(*) FROM workers) AS total_workers,
            (SELECT COUNT(*) FROM workers AS w WHERE w.is_present = true) AS present_workers,
            (SELECT COUNT(*) FROM supervisors) AS total_supervisors,
            (SELECT COUNT(*) FROM workers AS s WHERE s.is_present = true) AS present_supervisors
            (SELECT site_name, SUM(total_budget) AS total_income_this_month;`
    );
    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function worker(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT 
            (SELECT SUM(hours) AS total_work_hours
            FROM attendences
            WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM NOW())
            AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM NOW())`
    );
    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { supervisor, admin, worker };
