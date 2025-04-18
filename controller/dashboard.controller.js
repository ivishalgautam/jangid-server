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
      `SELECT
        (SELECT COUNT(*) FROM workers AS w WHERE w.site_assigned::varchar = ssm.site_id::varchar) AS worker_count,
        (SELECT COUNT(*) FROM site_supervisor_map AS ssm WHERE ssm.supervisor_id::varchar = sv.id::varchar) AS site_count,
        (SELECT COUNT(*) FROM workers AS w WHERE w.site_assigned::varchar = ssm.site_id::varchar AND w.is_present = true) AS present_worker_count,
        (SELECT amount FROM wallet AS wlt WHERE wlt.supervisor_id::varchar = sv.id::varchar) AS wallet_count,
        (SELECT uid FROM supervisor_check_in_out AS sco WHERE sco.supervisor_id::varchar = sv.id::varchar) AS session_id,
        sv.is_present as is_present
       FROM supervisors AS sv
       LEFT JOIN site_supervisor_map ssm ON ssm.supervisor_id = sv.id
       WHERE sv.id = $1`,
      [req.user.id]
    );

    const {
      worker_count,
      present_worker_count,
      wallet_count,
      site_count,
      is_present,
      session_id,
    } = rows[0];

    res.json({
      worker_count: String(worker_count),
      present_worker_count: String(present_worker_count),
      wallet_count: parseInt(wallet_count),
      site_count: parseInt(site_count),
      is_present,
      session_id,
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
            (SELECT SUM(amount) FROM site_transactions WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())) AS income_this_month,
            (SELECT SUM(amount) FROM bills) as total_bill,
            (SELECT SUM(amount) FROM site_transactions) as total_amount_received;
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
  const worker_id = req.user.id;
  try {
    // (SELECT SUM(hours) FROM attendances WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND worker_id = $2) AS total_work_this_month
    const { rows } = await pool.query(
      `SELECT 
        (SELECT daily_wage_salary FROM workers WHERE id = $1) AS daily_wage,
        COALESCE((SELECT SUM(earned) FROM attendances WHERE worker_id = $1 AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)), 0) AS total_payout_this_month,
        COALESCE((SELECT SUM(amount) FROM worker_payouts WHERE worker_id = $1 AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)), 0) AS paid_this_month,
        (SELECT SUM(earned) FROM attendances WHERE worker_id = $1) AS total_earned,
        COALESCE((SELECT SUM(amount) FROM worker_payouts WHERE worker_id = $1), 0) AS total_paid,
        (SELECT uid FROM check_in_out AS wco WHERE wco.worker_id::varchar = $1::VARCHAR) AS session_id,
        (SELECT is_present FROM workers WHERE id = $1),
        (SELECT fullname FROM workers WHERE id = $1) as worker_name
        ;`,
      [worker_id]
    );
    console.log({ rows });
    const { total_paid, total_earned, ...data } = rows[0];

    res.json({
      message: "success",
      status: 200,
      data: {
        ...data,
        pending_payout: parseInt(total_earned) - parseInt(total_paid),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { supervisor, admin, worker };
