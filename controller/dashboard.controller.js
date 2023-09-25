const { pool } = require("../config/db");

async function supervisor(req, res) {
  const supervisorId = parseInt(req.params.supervisorId);
  try {
    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1`,
      [supervisorId]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({ message: "NOT FOUND!" });
    }

    const { rows } = await pool.query(
      `SELECT 
            (SELECT COUNT(*) FROM sites AS s WHERE s.supervisor_id = sv.id) AS site_count,
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id = sv.id) AS worker_count,
            (SELECT COUNT(*) FROM workers AS w WHERE w.supervisor_id = sv.id AND w.is_present = true) AS present_worker_count,
            (SELECT COUNT(*) FROM wallet AS wlt WHERE wlt.supervisor_id = sv.id) AS wallet_count,
        FROM supervisors AS sv
        WHERE sv.id = $1;`,
      [supervisorId]
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { supervisor };
