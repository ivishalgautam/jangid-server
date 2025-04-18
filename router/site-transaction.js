const router = require("express").Router();
const Controller = require("../controller/site-transaction.controller");
const {
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middlewares/verifyToken");

router.post("/", verifyTokenAndAdmin, Controller.create); //admin
router.delete("/", verifyTokenAndAdmin, Controller.deleteById); // admin
router.get("/all", verifyTokenAndAdmin, Controller.getAll); // admin
router.get("/", verifyToken, Controller.getById);
router.put("/", verifyToken, Controller.update);

module.exports = router;
