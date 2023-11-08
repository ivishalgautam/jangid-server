const { pool } = require("../config/db");

async function createWallet(req, res) {
  const { amount, supervisor_id } = req.body;

  try {
    const record = await pool.query(
      `SELECT * FROM wallet WHERE supervisor_id = $1;`,
      [supervisor_id]
    );

    if (record.rowCount > 0) {
      return res.status(400).json({ message: "already created" });
    }

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
  console.log(req.body);

  try {
    const walletRecord = await pool.query(
      "SELECT * FROM wallet WHERE supervisor_id = $1",
      [supervisor_id]
    );

    console.log({ walletRecord });

    if (walletRecord.rowCount === 0) {
      await pool.query(
        `INSERT INTO wallet (amount, supervisor_id) VALUES ($1, $2)`,
        [amount, supervisor_id]
      );
    } else {
      await pool.query(`UPDATE wallet SET amount = $1, supervisor_id = $2;`, [
        parseInt(walletRecord.rows[0].amount) + parseInt(amount),
        supervisor_id,
      ]);
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
      `SELECT * FROM wallet WHERE supervisor_id = $1`,
      [supervisorId]
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
  getWalletBySupervisorId,
  getAllWallet,
};
