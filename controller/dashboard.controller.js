const { pool } = require("../config/db");

async function supervisor(req, res) {
  try {
    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [req.user.id]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    const { rows } = await pool.query(
      // (SELECT COUNT(*) FROM sites AS s WHERE s.supervisor_id::integer = sv.id) AS site_count,
      `SELECT 
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id::integer = sv.id) AS worker_count,
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id::integer = sv.id AND w.is_present = true) AS present_worker_count,
            (SELECT amount FROM wallet AS wlt WHERE wlt.supervisor_id::integer = sv.id) AS wallet_count
        FROM supervisors AS sv
        WHERE sv.id = $1;`,
      [req.user.id]
    );

    const { worker_count, present_worker_count, wallet_count } = rows[0];

    res.json({
      worker_count: String(worker_count),
      present_worker_count: String(present_worker_count),
      wallet_count: parseInt(wallet_count),
    });
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
    // (SELECT SUM(hours) FROM attendances WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND worker_id = $2) AS total_work_this_month
    const { rows } = await pool.query(
      `SELECT 
        (SELECT daily_wage_salary FROM workers WHERE id = $1) AS daily_wage,
        (SELECT SUM(earned) FROM attendances WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND worker_id = $2) AS total_payout_this_month,
        (SELECT SUM(amount) FROM expenses WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND worker_id = $3) AS paid_this_month,
        (SELECT SUM(earned) FROM attendances WHERE worker_id = $4) AS total_earned,
        (SELECT SUM(amount) FROM expenses WHERE worker_id = $5) AS total_paid,
        (SELECT is_present FROM workers WHERE id = $6)
        ;`,
      [worker_id, worker_id, worker_id, worker_id, worker_id, worker_id]
    );

    const { total_paid, total_earned, ...data } = rows[0];
    res.json({
      ...data,
      pending_payout: parseInt(total_earned) - parseInt(total_paid),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { supervisor, admin, worker };
