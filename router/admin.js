const router = require("express").Router();
const { createAdmin } = require("../controller/admin.controller");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router.post("/", createAdmin);

module.exports = router;
