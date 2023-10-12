const router = require("express").Router();
const Controller = require("../controller/attendence.controller");

// check in - check out
router.post("/check-in", Controller.createCheckIn);
router.post("/check-out", Controller.createCheckOut);
router.get("/", Controller.getWorkerAttendenceById);

module.exports = router;
