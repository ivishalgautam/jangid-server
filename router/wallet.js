const router = require("express").Router();
const Controller = require("../controller/wallet.controller");

router.post("/", Controller.createWallet);
router.put("/:walletId", Controller.updateWalletById);
router.delete("/:walletId", Controller.deleteWalletById);
router.get("/all", Controller.getAllWallet);
router.get("/", Controller.getWalletById);

module.exports = router;
