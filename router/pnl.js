const PNL = require("../controller/pnl.controller");
const { verifyAdminAndSupervisor } = require("../middlewares/verifyToken");
const router = require("express").Router();

// get
router.get("/site-wise", verifyAdminAndSupervisor, PNL.siteWise);
router.get("/overall", verifyAdminAndSupervisor, PNL.overall);
router.post("/statements/:id", verifyAdminAndSupervisor, PNL.statement);

module.exports = router;
