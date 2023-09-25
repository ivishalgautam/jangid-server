const { pool } = require("../config/db");

async function createSite(req, res) {
  const { site_name, owner_name, address } = req.body;
  try {
    // await pool.query(`INSERT`)
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
