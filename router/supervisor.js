const router = require("express").Router();
const Controller = require("../controller/supervisor.controller");
const { validateSupervisor } = require("../middlewares/validator");

router.post("/", validateSupervisor, Controller.createSupervisor);
router.put("/:supervisorId", Controller.updateSupervisorById);
router.delete("/:supervisorId", Controller.deleteSupervisorById);
router.get("/:supervisorId", Controller.getSupervisorbyId);
router.get("/", Controller.getAllSupervisors);

module.exports = router;
