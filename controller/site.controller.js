const { pool } = require("../config/db");

async function createSite(req, res) {
  const { site_name, owner_name, address, supervisor_id } = req.body;
  const files = {
    filename: req.file.originalname,
    path: `/assets/images/${req.file.filename}`,
  };
  // console.log(req.file);
  try {
    await pool.query(
      `INSERT INTO sites (site_name, owner_name, address, supervisor_id, image) VALUES ($1, $2, $3, $4, $5)`,
      [site_name, owner_name, address, supervisor_id, files.path]
    );
    res.json({ message: "Site created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSiteById(req, res) {
  const { site_name, owner_name, address, supervisor_id } = req.body;
  const siteId = parseInt(req.params.siteId);
  const files = {
    filename: req.file.originalname,
    path: `/assets/images/${req.file.filename}`,
  };

  try {
    const exist = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      siteId,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    await pool.query(
      `UPDATE sites SET site_name = $1, owner_name = $2, address = $3, supervisor_id = $4, image = $5) WHERE id = $6`,
      [site_name, owner_name, address, supervisor_id, files.path, siteId]
    );
    res.json({ message: "Site updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteSiteById(req, res) {
  const siteId = parseInt(req.params.siteId);
  try {
    const exist = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      siteId,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    await pool.query(`DELETE FROM sites WHERE id = $1`, [siteId]);
    res.json({ message: "Site deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getSiteById(req, res) {
  const siteId = parseInt(req.params.siteId);
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM sites WHERE id = $1`,
      [siteId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllSites(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM sites;`);

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createSite,
  updateSiteById,
  deleteSiteById,
  getSiteById,
  getAllSites,
};
