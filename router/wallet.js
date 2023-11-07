const router = require("express").Router();
const Controller = require("../controller/wallet.controller");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

router.post("/", verifyTokenAndAdmin, Controller.createWallet);
router.put("/:walletId", verifyTokenAndAdmin, Controller.updateWalletById);
router.delete("/:walletId", verifyTokenAndAdmin, Controller.deleteWalletById);
router.get("/all", verifyTokenAndAdmin, Controller.getAllWallet);
router.get("/", verifyTokenAndAdmin, Controller.getWalletById);

module.exports = router;
