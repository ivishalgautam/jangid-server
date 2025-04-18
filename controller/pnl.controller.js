const { pool } = require("../config/db");

const siteWise = async (req, res) => {
  try {
    const data = await pool.query(
      `SELECT 
            st.id,
            st.site_name,
            (COALESCE(SUM(sttrn.amount::integer), 0) - COALESCE(SUM(exp.amount), 0)) as profit_and_loss
        from sites st 
        LEFT JOIN site_transactions sttrn ON sttrn.site_id = st.id
        LEFT JOIN expenses exp ON exp.site_id = st.id
        GROUP BY st.id, st.site_name, st.created_at
        ORDER BY st.created_at DESC
        ;`
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
};

const statement = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const siteId = req.params.id;
    const data = await pool.query(
      `SELECT 
        st.id,
        st.site_name,
        COALESCE((
            SELECT SUM(bl.amount)
            FROM bills bl
            WHERE bl.site_id = st.id
            AND bl.created_at BETWEEN $2 AND $3
        ), 0) AS total_bill_amount,
        COALESCE((
            SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', bl.id,
            'amount', bl.amount,
            'created_at', bl.created_at
            ))
            FROM bills bl
            WHERE bl.site_id = st.id
            AND bl.created_at BETWEEN $2 AND $3
        ), '[]') AS bills,
        COALESCE((
            SELECT SUM(sttrn.amount)
            FROM site_transactions sttrn
            WHERE sttrn.site_id = st.id
            AND sttrn.created_at BETWEEN $2 AND $3
        ), 0) AS total_amount_received,
        COALESCE((
            SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', sttrn.id,
            'amount', sttrn.amount,
            'created_at', sttrn.created_at
            ))
            FROM site_transactions sttrn
            WHERE sttrn.site_id = st.id
            AND sttrn.created_at BETWEEN $2 AND $3
        ), '[]') AS transactions,
        COALESCE((
            SELECT SUM(exp.amount)
            FROM expenses exp
            WHERE exp.site_id = st.id
            AND exp.created_at BETWEEN $2 AND $3
        ), 0) AS total_expenses,
        COALESCE((
            SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', exp.id,
            'amount', exp.amount,
            'type', exp.type,
            'created_at', exp.created_at
            ))
            FROM expenses exp
            WHERE exp.site_id = st.id
            AND exp.purpose = 'site'
            AND exp.created_at BETWEEN $2 AND $3
        ), '[]') AS site_expenses,
        COALESCE((
            SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', exp.id,
            'amount', exp.amount,
            'type', exp.type,
            'created_at', exp.created_at
            ))
            FROM expenses exp
            WHERE exp.site_id = st.id
            AND exp.purpose = 'worker'
            AND exp.created_at BETWEEN $2 AND $3
        ), '[]') AS worker_expenses,
        COALESCE((
            SELECT JSON_AGG(JSON_BUILD_OBJECT(
            'id', exp.id,
            'amount', exp.amount,
            'type', exp.type,
            'created_at', exp.created_at
            ))
            FROM expenses exp
            WHERE exp.site_id = st.id
            AND exp.purpose = 'worker'
            AND exp.type = 'payout'
            AND exp.created_at BETWEEN $2 AND $3
        ), '[]') AS worker_payouts,
        (COALESCE((
            SELECT SUM(sttrn.amount)
            FROM site_transactions sttrn
            WHERE sttrn.site_id = st.id
            AND sttrn.created_at BETWEEN $2 AND $3
        ), 0) - COALESCE((
            SELECT SUM(exp.amount)
            FROM expenses exp
            WHERE exp.site_id = st.id
            AND exp.created_at BETWEEN $2 AND $3
        ), 0)) as profit_and_loss
        FROM sites st
        WHERE st.id = $1
        ORDER BY st.created_at DESC;`,
      [siteId, start_date, end_date]
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
};

const overall = async (req, res) => {
  try {
    const data = await pool.query(
      `SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE purpose = 'worker') as total_worker_expense,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE purpose = 'site') as total_site_expense,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) as total_expense,
        (SELECT COALESCE(SUM(amount), 0) FROM site_transactions) as total_amount_received,
        ((SELECT COALESCE(SUM(amount), 0) FROM site_transactions) - (SELECT COALESCE(SUM(amount), 0) FROM expenses)) as profit_and_loss
        ;`
    );

    res.json({
      message: "success",
      status: 200,
      data: data?.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { siteWise, overall, statement };
