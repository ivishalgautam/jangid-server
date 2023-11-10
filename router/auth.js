const router = require("express").Router();
const Controller = require("../controller/auth.controller");
const { validateCredentials } = require("../middlewares/validator");

// admin
router.post("/login/admin", validateCredentials, Controller.adminLogin);

// supervisor
router.post(
  "/login/supervisor",
  validateCredentials,
  Controller.supervisorLogin
);

// worker
router.post("/login/worker", Controller.workerLogin);
router.post("/worker/check-in", Controller.workerCheckIn);
router.post("/worker/check-out", Controller.workerCheckOut);

module.exports = router;
