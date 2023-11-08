const router = require("express").Router();
const Controller = require("../controller/wallet.controller");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

// router.post("/", verifyTokenAndAdmin, Controller.createWallet);
router.put("/", verifyTokenAndAdmin, Controller.updateWalletBySupervisorId);
router.delete("/:walletId", verifyTokenAndAdmin, Controller.deleteWalletById);
router.get("/all", verifyTokenAndAdmin, Controller.getAllWallet);
router.get("/", verifyTokenAndAdmin, Controller.getWalletBySupervisorId);

module.exports = router;
