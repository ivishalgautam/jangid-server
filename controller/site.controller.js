const { pool } = require("../config/db");

async function createSite(req, res) {
  const {
    site_name,
    owner_name,
    address,
    supervisor_id,
    lat,
    long,
    radius,
    start_time,
    end_time,
    owner_contact,
  } = req.body;

  const files = {
    filename: req.file.originalname,
    path: `/assets/images/${req.file.filename}`,
  };
  // console.log(req.file);
  try {
    await pool.query(
      `INSERT INTO sites (site_name, owner_name, address, supervisor_id, image, lat, long, radius, start_time, end_time, owner_contact) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        site_name,
        owner_name,
        address,
        supervisor_id,
        files.path,
        lat,
        long,
        radius,
        start_time,
        end_time,
        owner_contact,
      ]
    );
    res.json({ message: "Site created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSiteById(req, res) {
  const {
    site_id,
    site_name,
    owner_name,
    address,
    supervisor_id,
    lat,
    long,
    radius,
  } = req.body;

  try {
    const exist = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    await pool.query(
      `UPDATE sites SET site_name = $1, owner_name = $2, address = $3, supervisor_id = $4, lat = $5, long = $6, radius = $7) WHERE id = $8`,
      [
        site_name,
        owner_name,
        address,
        supervisor_id,
        lat,
        long,
        radius,
        site_id,
      ]
    );
    res.json({ message: "Site updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteSiteById(req, res) {
  const { site_id } = req.body;
  try {
    const exist = await pool.query(`DELETE FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    res.json({ message: "Site deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getSiteById(req, res) {
  const { site_id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM sites WHERE id = $1`,
      [site_id]
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
