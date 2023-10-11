const router = require("express").Router();
const Controller = require("../controller/supervisor.controller");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router.post("/", verifyTokenAndAdmin, Controller.createSupervisor); //admin

router.put(
  "/:supervisorId",
  verifyTokenAndAdmin,
  Controller.updateSupervisorById
); //admin

router.delete(
  "/:supervisorId",
  verifyTokenAndAdmin,
  Controller.deleteSupervisorById
); //admin

router.get("/get-all", verifyTokenAndAdmin, Controller.getAllSupervisors);
router.get("/", verifyTokenAndAdmin, Controller.getSupervisorbyId);

module.exports = router;
