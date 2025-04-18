const { pool } = require("../config/db");

async function createExpense(req, res) {
  const { amount, purpose, site_id, comment, worker_id, supervisor_id, type } =
    req.body;

  try {
    const siteRecord = await pool.query(`SELECT * FROM sites WHERE id = $1`, [
      site_id,
    ]);

    if (siteRecord.rowCount === 0) {
      return res.status(404).json({ message: "site not found!" });
    }

    if (worker_id) {
      const workerRecord = await pool.query(
        `SELECT * FROM workers WHERE id = $1`,
        [worker_id]
      );

      if (workerRecord.rowCount === 0) {
        return res.status(404).json({ message: "worker not found!" });
      }
    }

    const supervisor = await pool.query(
      `SELECT * FROM supervisors WHERE id = $1;`,
      [supervisor_id]
    );

    if (supervisor.rowCount === 0) {
      return res.status(404).json({
        message: `supervisor not found!`,
      });
    }

    await pool.query(
      `INSERT INTO expenses (amount, purpose, site_id, comment, worker_id, supervisor_id, type) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [amount, purpose, site_id, comment, worker_id, supervisor_id, type]
    );

    const walletRecord = await pool.query(
      "SELECT * FROM wallet WHERE supervisor_id = $1;",
      [supervisor_id]
    );

    if (walletRecord.rowCount === 0) {
      return res.status(404).json({
        message: `wallet not found with id: '${supervisor_id}'`,
      });
    }

    let prevAmt = parseInt(walletRecord.rows[0].amount);
    if (prevAmt <= 0) {
      return res.status(400).json({ message: "insufficient wallet balance!" });
    }

    await pool.query(
      `UPDATE wallet SET amount = $1 WHERE supervisor_id = $2;`,
      [prevAmt - parseInt(amount), supervisor_id]
    );

    res.json({ message: "Expense created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateExpenseById(req, res) {
  const { amount, purpose, site_id, worker_id } = req.body;
  const expenseId = parseInt(req.params.expenseId);

  try {
    const exist = await pool.query(`SELECT * FROM expenses WHERE id = $1`, [
      expenseId,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Expense not found!" });
    }

    await pool.query(
      `UPDATE expenses SET amount = $1, purpose = $2, site_id = $3, worker_id = $4 WHERE id = $5`,
      [amount, purpose, site_id, worker_id, expenseId]
    );
    res.json({ message: "Expense updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function deleteExpenseById(req, res) {
  const expenseId = parseInt(req.params.expenseId);

  try {
    const exist = await pool.query(`SELECT * FROM expenses WHERE id = $1`, [
      expenseId,
    ]);

    if (exist.rowCount === 0) {
      return res.status(404).json({ message: "Expense not found!" });
    }

    await pool.query(`DELETE FROM expenses WHERE id = $1`, [expenseId]);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getExpenseById(req, res) {
  const expense_id = req.body.expense_id;

  try {
    const { rows, rowCount } = await pool.query(
      `SELECT * FROM expenses WHERE id = $1`,
      [expense_id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Expense not found!" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getAllExpenses(req, res) {
  const { type } = req.query;
  let data = [];
  try {
    switch (type) {
      case "site":
        data = await pool.query(
          `
          SELECT 
            exp.*, 
            s.site_name,
            s.image as site_image
          FROM expenses exp 
          LEFT JOIN sites s ON exp.site_id = s.id
            WHERE exp.site_id IS NOT NULL
            ORDER BY created_at DESC;
          `
        );
        break;

      case "worker":
        data = await pool.query(
          `
          SELECT 
            exp.*, 
            w.fullname as worker_name
          FROM expenses exp 
          LEFT JOIN workers w ON exp.worker_id = w.id
            WHERE exp.worker_id IS NOT NULL
          ;`
        );
        break;

      default:
        data = await pool.query(
          `
          SELECT 
            exp.*, 
            s.site_name, 
            w.fullname as worker_name
          FROM expenses exp 
          LEFT JOIN sites s ON exp.site_id = s.id
          LEFT JOIN workers w ON exp.worker_id = w.id
          ;`
        );
        break;
    }

    const filteredData = data?.rows.map((row) => {
      if (type === "site") {
        const { worker_id, ...data } = row;
        return { ...data };
      } else {
        return row;
      }
    });

    res.json({ message: "success", status: 200, data: filteredData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getWorkerExpenses(req, res) {
  try {
    const expenses = await pool.query(
      `
          SELECT 
            exp.*, 
            s.fullname as supervisor_name,
            s.profile_img as profile_img
          FROM expenses exp 
          LEFT JOIN supervisors s ON exp.supervisor_id = s.id
            WHERE exp.worker_id = $1
          ;`,
      [req.user.id]
    );

    res.json({ message: "success", status: 200, data: expenses.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function getSupervisorExpenses(req, res) {
  try {
    const expenses = await pool.query(
      `
          SELECT 
            exp.*, 
            s.fullname as supervisor_name,
            s.profile_img as profile_img
          FROM expenses exp 
          LEFT JOIN supervisors s ON exp.supervisor_id = s.id
            WHERE exp.supervisor_id = $1
          ;`,
      [req.user.id]
    );

    res.json({ message: "success", status: 200, data: expenses.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createExpense,
  updateExpenseById,
  deleteExpenseById,
  getExpenseById,
  getAllExpenses,
  getWorkerExpenses,
  getSupervisorExpenses,
};
