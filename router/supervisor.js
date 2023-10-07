const router = require("express").Router();
const Controller = require("../controller/supervisor.controller");
const { validateSupervisor } = require("../middlewares/validator");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router.post(
  "/",
  // verifyTokenAndAdmin,
  // validateSupervisor,
  Controller.createSupervisor
); //admin

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

router.get("/", verifyTokenAndAdmin, Controller.getAllSupervisors);
router.get("/:supervisorId", verifyTokenAndAdmin, Controller.getSupervisorbyId);

module.exports = router;
