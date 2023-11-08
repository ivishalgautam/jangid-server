const { pool } = require("../config/db");

async function createWallet(req, res) {
  const { amount, supervisor_id } = req.body;

  try {
    await pool.query(
      `INSERT INTO wallet (amount, supervisor_id) VALUES ($1, $2)`,
      [amount, supervisor_id]
    );
    res.json({ message: "Wallet created" });
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
}

async function updateWalletBySupervisorId(req, res) {
  const { amount, supervisor_id } = req.body;

  try {
    const walletRecord = await pool.query(
      "SELECT * FROM wallet WHERE supervisor_id = $1",
      [supervisor_id]
    );

    if (walletRecord.rowCount === 0) {
      return res.status(404).json({ message: "Wallet not found!" });
    }

    await pool.query(`UPDATE wallet SET amount = $1, supervisor_id = $2;`, [
      walletRecord.rows[0].amount + amount,
      supervisor_id,
    ]);

    res.json({ message: "Wallet updated" });
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

async function getWalletById(req, res) {
  const wallet_id = req.body;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM wallet WHERE id = $1`,
      [wallet_id]
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

async function getAllWallet(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM wallet;`);

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
  getWalletById,
  getAllWallet,
};
