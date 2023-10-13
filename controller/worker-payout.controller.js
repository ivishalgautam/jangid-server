const { pool } = require("../config/db");

async function addPayout(req, res) {
  const { amount, worker_id, supervisor_id } = req.body;
  try {
    const worker = await pool.query(`SELECT * FROM workers WHERE id = $1`, [
      worker_id,
    ]);

    if (worker.rowCount === 0) {
      return res.status(404).json({ message: "Worker not found!" });
    }

    await pool.query(
      `INSERT INTO worker_payouts (amount, worker_id, supervisor_id) VALUES ($1, $2, $3)`,
      [amount, worker_id, supervisor_id]
    );

    const { total_payout, total_paid } = worker?.rows[0];

    await pool.query(
      `UPDATE workers SET total_paid = $1, pending_payout = $2 WHERE id = $3;`,
      [total_paid + amount, total_payout - total_paid + amount, worker_id]
    );

    res.json({ message: "Payout added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { addPayout };
