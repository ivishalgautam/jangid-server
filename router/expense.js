const router = require("express").Router();
const Controller = require("../controller/expense.controller");
const {
  verifyTokenAndAdmin,
  verifyTokenAdminAndSupervisor,
} = require("../middlewares/verifyToken");

router.post("/", verifyTokenAdminAndSupervisor, Controller.createExpense);
router.put("/:expenseId", verifyTokenAndAdmin, Controller.updateExpenseById);
router.delete("/:expenseId", verifyTokenAndAdmin, Controller.deleteExpenseById);
router.get("/all", verifyTokenAndAdmin, Controller.getAllExpenses);
router.get("/", verifyTokenAndAdmin, Controller.getExpenseById);

module.exports = router;
