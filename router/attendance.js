const router = require("express").Router();
const Controller = require("../controller/attendance.controller");

// check in - check out
router.get("/", Controller.getWorkerAttendanceById);

module.exports = router;
