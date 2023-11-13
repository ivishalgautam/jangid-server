const router = require("express").Router();
const Controller = require("../controller/dashboard.controller");
const {
  verifyTokenAndSupervisor,
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middlewares/verifyToken");

router.get("/supervisor", verifyTokenAndSupervisor, Controller.supervisor);

router.get("/admin", verifyTokenAndAdmin, Controller.admin);
router.get("/worker", verifyToken, Controller.worker);

module.exports = router;
