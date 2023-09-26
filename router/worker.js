const router = require("express").Router();
const Controller = require("../controller/worker.controller");
const { validateWorker } = require("../middlewares/validator");
const { verifyTokenAndSupervisor } = require("../middlewares/verifyToken");

router.post(
  "/",
  validateWorker,
  verifyTokenAndSupervisor,
  Controller.createWorker
);
router.put("/:workerId", verifyTokenAndSupervisor, Controller.updateWorkerById);
router.delete(
  "/:workerId",
  verifyTokenAndSupervisor,
  Controller.deleteWorkerById
);
router.get("/:workerId", verifyTokenAndSupervisor, Controller.getWorkerById);
router.get("/", verifyTokenAndSupervisor, Controller.getAllWorkers);

module.exports = router;
