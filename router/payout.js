const Payout = require("../controller/payout.controller");
const { verifyAdminAndSupervisor } = require("../middlewares/verifyToken");
const router = require("express").Router();

router.post("/worker", verifyAdminAndSupervisor, Payout.addWorkerPayout);
router.post("/site", verifyAdminAndSupervisor, Payout.addSitePayout);
router.post("/all", verifyAdminAndSupervisor, Payout.getAllPayouts);

module.exports = router;
