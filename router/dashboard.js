const router = require("express").Router();
const Controller = require("../controller/dashboard.controller");

router.get("/supervisor/:supervisorId", Controller.supervisor);

module.exports = router;
