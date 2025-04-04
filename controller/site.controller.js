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
    total_budget,
  } = req.body;

  const files = {
    filename: req.file.originalname,
    path: `/assets/images/${req.file.filename}`,
  };
  // console.log(req.file);
  try {
    const { rows } = await pool.query(
      `INSERT INTO sites (site_name, owner_name, address, supervisor_id, image, lat, long, radius, start_time, end_time, owner_contact, total_budget) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning id`,
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
        total_budget
      ]
    );
    res.json({ message: "Site created", site_id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSiteById(req, res) {
  const { site_id } = req.body;

  try {
    const exist = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      parseInt(site_id),
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

    const { rows, rowCount } = await pool.query(
      `UPDATE sites SET ${updateColumns} WHERE id = $${
        updateValues.length + 1
      } returning *;`,
      [...updateValues, site_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "site not found!" });
    }

    res.json({ message: "Site updated", site_id: rows[0].id });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getSiteById(req, res) {
  const { site_id } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM sites WHERE id = $1`,
      [parseInt(site_id)]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    const todayWorking = await pool.query(
      `
      SELECT 
            (SELECT count(*) FROM workers WHERE site_assigned = $1) as total_workers,
            (SELECT count(*) FROM workers WHERE site_assigned = $2 AND is_present = true) as present_workers,
            (SELECT count(*) FROM expenses WHERE site_id = $3) as total_transactions
      ;`,
      [site_id, site_id, parseInt(site_id)]
    );

    const expenses = await pool.query(
      `SELECT 
          exp.*, 
          w.profile_img as worker_img,
          w.fullname as worker_name,
          s.image as site_img,
          s.site_name
        FROM expenses exp 
          LEFT JOIN workers w on exp.worker_id::integer = w.id 
          LEFT JOIN sites s on exp.site_id = s.id 
        WHERE site_id = $1 
        ORDER BY created_at DESC;`,
      [parseInt(site_id)]
    );

    const workers = await pool.query(
      `SELECT id, fullname, created_at, profile_img FROM workers WHERE site_assigned = $1 ORDER BY created_at DESC;`,
      [site_id]
    );

    res.json({
      message: "success",
      status: 200,
      data: {
        ...rows[0],
        ...todayWorking.rows[0],
        site_payouts: expenses.rows
          .filter((row) => row.purpose === "site")
          .map((row) => {
            const { worker_id, worker_img, worker_name, ...data } = row;
            return { ...data };
          }),
        worker_payouts: expenses.rows.filter(
          (row) => row.purpose === "worker" && row.worker_id !== null
        ),
        workers: workers.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllSites(req, res) {
  let data;
  // console.log(req.user);
  try {
    if (req.user.role === "admin") {
      data = await pool.query(`SELECT * FROM sites ORDER BY created_at DESC;`);
    }

    if (req.user.role === "supervisor") {
      // console.log(!isNaN(parseInt(req.user.site_assigned)));
      if (!isNaN(parseInt(req.user.site_assigned))) {
        data = await pool.query(`SELECT * FROM sites st WHERE st.supervisor_id = $1  ORDER BY st.created_at DESC;`, [
          req.user.id,
        ]);
      } else {
        data = { rows: [] };
      }
    }

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
  createSite,
  updateSiteById,
  deleteSiteById,
  getSiteById,
  getAllSites,
};
