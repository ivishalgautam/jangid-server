const { pool } = require("../config/db");

async function createExpense(req, res) {
  const { amount, purpose, site_id, worker_id } = req.body;

  try {
    await pool.query(
      `INSERT INTO expenses (amount, purpose, site_id, worker_id) VALUES ($1, $2, $3, $4)`,
      [amount, purpose, site_id, worker_id]
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
      `UPDATE expenses SET amount = $1, purpose = $2, site_id = $3, worker_id = $4) WHERE id = $5`,
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
  const expense_id = req.body;

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
  try {
    const { rows } = await pool.query(
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

    res.json(rows);
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
};
