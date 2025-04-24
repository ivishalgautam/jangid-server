const { pool } = require("../config/db");

async function createSite(req, res) {
  const {
    site_name,
    owner_name,
    address,
    lat,
    long,
    radius,
    start_time,
    end_time,
    owner_contact,
  } = req.body;

  const files = {
    filename: req.file.originalname,
    path: `/assets/${req.file.filename}`,
  };
  try {
    const { rows } = await pool.query(
      `INSERT INTO sites (site_name, owner_name, address, image, lat, long, radius, start_time, end_time, owner_contact) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
      [
        site_name,
        owner_name,
        address,
        files.path,
        lat,
        long,
        radius,
        start_time,
        end_time,
        owner_contact,
      ]
    );

    // if (req.user.role === "supervisor") {
    //   await pool.query(
    //     `INSERT INTO site_supervisor_map (site_id, supervisor_id) VALUES ($1, $2)`,
    //     [rows[0].id, req.user.id]
    //   );
    // }

    res.json({ message: "Site created", site_id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSiteById(req, res) {
  const { site_id } = req.body;
  if (!site_id)
    return res.status(404).json({ message: "'site_id' not found!" });

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
    const exist = await pool.query(`SELECT FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Site not found!" });
    }

    await pool.query(`DELETE FROM sites WHERE id = $1`, [site_id]);
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
      `SELECT
          st.*,
          (SELECT COALESCE(SUM(amount::integer), 0) FROM bills WHERE site_id = st.id) as total_bill_amount,
          (SELECT COALESCE(SUM(amount::integer), 0) FROM site_transactions WHERE site_id = st.id) as total_amount_received,
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE site_id = st.id) AS total_expense,
          ((SELECT COALESCE(SUM(amount::integer), 0) FROM site_transactions WHERE site_id = st.id) - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE site_id = st.id)) as profit_and_loss,
          (SELECT COALESCE(SUM(CASE
            WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
            THEN amount
            ELSE 0
          END), 0) FROM expenses WHERE site_id = st.id) AS expense_this_month
        FROM sites st
        WHERE st.id = $1
        GROUP BY st.id
        `,
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
    console.log(rows[0]);
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
  try {
    if (req.user.role === "admin") {
      data = await pool.query(`
        SELECT 
          st.*,
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE site_id = st.id) AS total_expense,
          (
            (SELECT COALESCE(SUM(amount::integer), 0) FROM site_transactions WHERE site_id = st.id) 
            - 
            (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE site_id = st.id)
          ) as profit_and_loss
        FROM sites st 
        ORDER BY st.created_at DESC;`);
    }

    if (req.user.role === "supervisor") {
      // console.log(!isNaN(parseInt(req.user.site_assigned)));
      data = await pool.query(
        `SELECT 
              st.*,
              (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE site_id = st.id) AS total_expense,
              ((SELECT COALESCE(SUM(amount::integer), 0) FROM site_transactions WHERE site_id = st.id) - (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE site_id = st.id)) as profit_and_loss
            from site_supervisor_map ssm 
            LEFT JOIN sites st ON st.id = ssm.site_id
            WHERE ssm.supervisor_id = $1 
            ORDER BY st.id DESC;`,
        [req.user.id]
      );
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

async function getSupervisorSites(req, res) {
  try {
    const supervisorId = req.params.id;

    const { rows, rowCount } = await pool.query(
      `
      SELECT s.* FROM supervisors s WHERE s.id = $1`,
      [supervisorId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    const data = await pool.query(
      `SELECT 
          ssm.id as _id,
          st.*
        from site_supervisor_map ssm
        LEFT JOIN sites st ON st.id = ssm.site_id
        WHERE ssm.supervisor_id = $1
        ORDER BY st.created_at DESC;`,
      [supervisorId]
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

async function unAssignSite(req, res) {
  try {
    const id = req.params.id;
    const { rows, rowCount } = await pool.query(
      `
      SELECT s.* FROM site_supervisor_map s WHERE s.id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "RESOURCE NOT FOUND!" });
    }

    const data = await pool.query(
      `DELETE from site_supervisor_map WHERE id = $1`,
      [id]
    );

    res.json({
      message: "success",
      status: 200,
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
  getSupervisorSites,
  unAssignSite,
};
