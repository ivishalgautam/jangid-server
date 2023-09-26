const router = require("express").Router();
const Controller = require("../controller/dashboard.controller");
const { verifyTokenAndSupervisor } = require("../middlewares/verifyToken");

router.get(
  "/supervisor/:supervisorId",
  verifyTokenAndSupervisor,
  Controller.supervisor
);

module.exports = router;
