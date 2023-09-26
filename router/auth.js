const router = require("express").Router();
const Controller = require("../controller/auth.controller");
const { validateCredentials } = require("../middlewares/validator");

router.post(
  "/login/supervisor",
  validateCredentials,
  Controller.supervisorLogin
);

module.exports = router;
