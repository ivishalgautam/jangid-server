const { addPayout } = require("../controller/worker-payout.controller");
const router = require("express").Router();

router.post("/:workerId", addPayout);

module.exports = router;
