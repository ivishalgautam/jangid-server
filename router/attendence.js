const router = require("express").Router();
const Controller = require("../controller/attendence.controller");

router.get("/", Controller.getWorkerAttendenceById);
