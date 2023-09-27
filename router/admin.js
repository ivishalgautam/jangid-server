const router = require("express").Router();
const { createAdmin } = require("../controller/admin.controller");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router.post("/", verifyTokenAndAdmin, createAdmin);

module.exports = router;
