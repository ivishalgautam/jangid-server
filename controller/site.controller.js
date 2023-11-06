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
    const { rows } = await pool.query(
      `INSERT INTO sites (site_name, owner_name, address, supervisor_id, image, lat, long, radius, start_time, end_time, owner_contact) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning id`,
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
    res.json({ message: "Site created", site_id: rows[0].id });
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

    const { ...data } = req.body;
    const updateColumns = Object.keys(data)
      .map(
        (column, key) => `${column === "site_id" ? "id" : column} = $${key + 1}`
      )
      .join(", ");
    const updateValues = Object.values(data);

    await pool.query(
      `UPDATE sites SET ${updateColumns} WHERE id = $${
        updateValues.length + 1
      };`,
      [...updateValues, site_id]
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

    const todayWorking = await pool.query(
      `
      SELECT 
            (SELECT count(*) FROM workers WHERE site_assigned = $1) as total_workers,
            (SELECT count(*) FROM workers WHERE site_assigned = $2 AND is_present = true) as present_workers,
            (SELECT count(*) FROM expenses WHERE site_id = $3) as total_transactions,
            (SELECT * FROM expenses WHERE site_id = $4) as workers
      ;`,
      [
        parseInt(site_id),
        parseInt(site_id),
        parseInt(site_id),
        parseInt(site_id),
      ]
    );

    res.json({
      message: "success",
      status: 200,
      data: { ...rows[0], ...todayWorking.rows[0] },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllSites(req, res) {
  try {
    const { rows } = await pool.query(`SELECT * FROM sites;`);

    res.json({
      message: "success",
      status: 200,
      data: rows,
    });
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
