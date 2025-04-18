const { pool } = require("../config/db");

async function createBill(req, res) {
  const { amount, site_id } = req.body;
  console.log(req.body);
  const files = {
    filename: req.file.originalname,
    path: `/assets/${req.file.filename}`,
  };

  try {
    const siteRecord = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      parseInt(site_id),
    ]);
    if (!siteRecord.rowCount)
      return res.status(404).json({ message: "Site not found!" });
    const { rows } = await pool.query(
      `INSERT INTO bills (amount, site_id, docs) VALUES ($1, $2, $3) returning id`,
      [amount, site_id, files.path]
    );

    res.json({ message: "Bill created", bill_id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateBillById(req, res) {
  const { id } = req.body;
  const files = {
    filename: req.file.originalname,
    path: `/assets/${req.file.filename}`,
  };

  try {
    const exist = await pool.query(`SELECT * FROM bills WHERE id = $1`, [
      parseInt(id),
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Bill not found!" });
    }

    const { ...data } = req.body;
    const updateColumns = Object.keys(data)
      .map((column, key) => `${column} = $${key + 1}`)
      .join(", ");

    const updateValues = Object.values(data);

    const { rows, rowCount } = await pool.query(
      `UPDATE bills SET ${updateColumns}, docs = $${updateValues.length + 1} WHERE id = $${
        updateValues.length + 2
      } returning *;`,
      [...updateValues, files?.path ?? exist.rows[0].docs, parseInt(id)]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Bill not found!" });
    }

    res.json({ message: "Bill updated", bill_id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteBillById(req, res) {
  const { id } = req.body;
  try {
    const exist = await pool.query(`DELETE FROM bills WHERE id = $1`, [id]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Bill not found!" });
    }

    res.json({ message: "Bill deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getBillById(req, res) {
  const { id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM bills WHERE id = $1`,
      [parseInt(id)]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Bill not found!" });
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

async function getAllBills(req, res) {
  try {
    const data = await pool.query(
      `SELECT 
          bl.*,
          st.site_name
        FROM bills bl
        LEFT JOIN sites st ON st.id = bl.site_id
        ORDER BY created_at DESC;`
    );
    console.log(data.rows);
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
  createBill,
  updateBillById,
  deleteBillById,
  getBillById,
  getAllBills,
};
