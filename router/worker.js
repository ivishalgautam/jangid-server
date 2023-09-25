const router = require("express").Router();
const Controller = require("../controller/worker.controller");
const { validateWorker } = require("../middlewares/validator");

router.post("/", validateWorker, Controller.createWorker);
router.put("/:workerId", Controller.updateWorkerById);
router.delete("/:workerId", Controller.deleteWorkerById);
router.get("/:workerId", Controller.getWorkerById);
router.get("/", Controller.getAllWorkers);

module.exports = router;
