const router = require("express").Router();
const Controller = require("../controller/expense.controller");

router.post("/", Controller.createExpense);
router.put("/:expenseId", Controller.updateExpenseById);
router.delete("/:expenseId", Controller.deleteExpenseById);
router.get("/:expenseId", Controller.getExpenseById);
router.get("/", Controller.getAllExpenses);

module.exports = router;
