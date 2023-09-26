const router = require("express").Router();
const Controller = require("../controller/wallet.controller");

router.post("/", Controller.createWallet);
router.put("/:walletId", Controller.updateWalletById);
router.delete("/:walletId", Controller.deleteWalletById);
router.get("/:walletId", Controller.getWalletById);
router.get("/", Controller.getAllWallet);

module.exports = router;
