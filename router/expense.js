const router = require("express").Router();
const Controller = require("../controller/expense.controller");

router.post("/", Controller.createExpense);
router.put("/:expenseId", Controller.updateExpenseById);
router.delete("/:expenseId", Controller.deleteExpenseById);
router.get("/all", Controller.getAllExpenses);
router.get("/", Controller.getExpenseById);

module.exports = router;
