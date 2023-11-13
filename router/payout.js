const Payout = require("../controller/payout.controller");
const { verifyAdminAndSupervisor } = require("../middlewares/verifyToken");
const router = require("express").Router();

// post
router.post("/worker", verifyAdminAndSupervisor, Payout.addWorkerPayout);
router.post("/site", verifyAdminAndSupervisor, Payout.addSitePayout);

// get
router.get("/worker", Payout.getWorkerPayouts);
router.get("/site", verifyAdminAndSupervisor, Payout.getSitePayouts);
router.get("/all", verifyAdminAndSupervisor, Payout.getAllPayouts);

module.exports = router;
