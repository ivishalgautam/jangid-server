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
router.post("/login/worker", validateCredentials, Controller.workerlogin);
router.post("/logout/worker", validateCredentials, Controller.workerLogout);

module.exports = router;
