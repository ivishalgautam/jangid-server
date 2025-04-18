const { pool } = require("../config/db");

async function createWallet(req, res) {
  const { amount, supervisor_id, mode } = req.body;

  try {
    const record = await pool.query(
      `SELECT * FROM wallet WHERE supervisor_id = $1;`,
      [supervisor_id]
    );

    if (record.rowCount > 0) {
      return res.status(400).json({ message: "already created" });
    }

    await pool.query(
      `INSERT INTO wallet (amount, supervisor_id, mode) VALUES ($1, $2, $3)`,
      [amount, supervisor_id, mode]
    );
    res.json({ message: "Wallet created" });
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
}

async function updateWalletBySupervisorId(req, res) {
  const { amount, supervisor_id, mode } = req.body;

  try {
    const walletRecord = await pool.query(
      "SELECT * FROM wallet WHERE supervisor_id = $1",
      [supervisor_id]
    );

    if (walletRecord.rowCount === 0) {
      await pool.query(
        `INSERT INTO wallet (amount, supervisor_id) VALUES ($1, $2);`,
        [amount, supervisor_id]
      );
    } else {
      await pool.query(
        `UPDATE wallet SET amount = $1 WHERE supervisor_id = $2;`,
        [
          parseInt(walletRecord.rows[0].amount) + parseInt(amount),
          supervisor_id,
        ]
      );
      await pool.query(
        `INSERT INTO wallet_transactions (amount, supervisor_id, mode) VALUES ($1, $2, $3);`,
        [parseInt(amount), supervisor_id, mode]
      );
    }

    res.json({ message: "Amount added" });
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
}

async function deleteWalletById(req, res) {
  const walletId = parseInt(req.params.walletId);

  try {
    const exist = await pool.query(`SELECT * FROM wallet WHERE id = $1`, [
      walletId,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Wallet not found!" });
    }

    await pool.query(`DELETE FROM wallet WHERE id = $1;`, [walletId]);
    res.json({ message: "Wallet deleted" });
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
}

async function getWalletBySupervisorId(req, res) {
  const supervisorId = req.body.supervisor_id;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT amount FROM wallet WHERE supervisor_id = $1`,
      [req.user.role === "supervisor" ? req.user.id : supervisorId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Wallet not found!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
}

async function getWalletHistoryBySupervisorId(req, res) {
  const supervisorId = req.params.id;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM wallet_transactions WHERE supervisor_id = $1`,
      [supervisorId]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
}

async function getAllWallet(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM wallet ORDER BY created_at DESC;`
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
}

module.exports = {
  createWallet,
  updateWalletBySupervisorId,
  deleteWalletById,
  getWalletBySupervisorId,
  getAllWallet,
  getWalletHistoryBySupervisorId,
};
