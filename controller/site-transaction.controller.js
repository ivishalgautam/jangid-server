const { pool } = require("../config/db");

async function create(req, res) {
  const { amount, site_id } = req.body;

  try {
    const siteRecord = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      parseInt(site_id),
    ]);
    if (!siteRecord.rowCount)
      return res.status(404).json({ message: "Site not found!" });
    const { rows } = await pool.query(
      `INSERT INTO site_transactions (amount, site_id) VALUES ($1, $2) returning id`,
      [amount, site_id]
    );

    res.json({ message: "Transaction created", transaction_id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function update(req, res) {
  const { id } = req.body;

  try {
    const exist = await pool.query(
      `SELECT * FROM site_transactions WHERE id = $1`,
      [parseInt(id)]
    );

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found!" });
    }

    const { ...data } = req.body;
    const updateColumns = Object.keys(data)
      .map((column, key) => `${column} = $${key + 1}`)
      .join(", ");

    const updateValues = Object.values(data);

    const { rows, rowCount } = await pool.query(
      `UPDATE site_transactions SET ${updateColumns} WHERE id = $${
        updateValues.length + 1
      } returning *;`,
      [...updateValues, parseInt(id)]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found!" });
    }

    res.json({ message: "Transaction updated", transaction_id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteById(req, res) {
  const { id } = req.body;
  try {
    const exist = await pool.query(
      `DELETE FROM site_transactions WHERE id = $1`,
      [id]
    );

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found!" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getById(req, res) {
  const { id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM site_transactions WHERE id = $1`,
      [parseInt(id)]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found!" });
    }

    res.json({
      message: "success",
      status: 200,
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAll(req, res) {
  try {
    const data = await pool.query(
      `SELECT 
          strn.*,
          st.site_name  
        FROM site_transactions strn
        LEFT JOIN sites st ON st.id = strn.site_id
        ORDER BY strn.created_at DESC;`
    );

    res.json({
      message: "success",
      status: 200,
      data: data?.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  create,
  update,
  deleteById,
  getById,
  getAll,
};
