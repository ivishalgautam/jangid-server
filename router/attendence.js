const router = require("express").Router();
const Controller = require("../controller/attendence.controller");

// check in - check out
router.get("/", Controller.getWorkerAttendenceById);

module.exports = router;
