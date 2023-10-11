const router = require("express").Router();
const Controller = require("../controller/dashboard.controller");
const {
  verifyTokenAndSupervisor,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");

router.get(
  "/supervisor/:supervisorId",
  verifyTokenAndSupervisor,
  Controller.supervisor
);

router.get("/admin", verifyTokenAndAdmin, Controller.admin);
router.get("/worker", Controller.worker);

module.exports = router;
