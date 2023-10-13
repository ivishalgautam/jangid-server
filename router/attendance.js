const router = require("express").Router();
const Controller = require("../controller/attendance.controller");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

// check in - check out
router.get("/", Controller.getWorkerAttendanceById);
router.get("/all", verifyTokenAndAdmin, Controller.getAllAttendances);

module.exports = router;
