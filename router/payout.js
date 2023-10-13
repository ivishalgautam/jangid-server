const { addPayout } = require("../controller/worker-payout.controller");
const { verifyAdminAndSupervisor } = require("../middlewares/verifyToken");
const router = require("express").Router();

router.post("/worker", verifyAdminAndSupervisor, addPayout);

module.exports = router;
