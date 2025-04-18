const router = require("express").Router();
const Controller = require("../controller/wallet.controller");
const {
  verifyTokenAndAdmin,
  verifyTokenAdminAndSupervisor,
} = require("../middlewares/verifyToken");

// router.post("/", verifyTokenAndAdmin, Controller.createWallet);
router.put("/", verifyTokenAndAdmin, Controller.updateWalletBySupervisorId);
router.delete("/:walletId", verifyTokenAndAdmin, Controller.deleteWalletById);
router.get(
  "/transactions/:id",
  verifyTokenAndAdmin,
  Controller.getWalletHistoryBySupervisorId
);
router.get("/all", verifyTokenAndAdmin, Controller.getAllWallet);
router.get(
  "/",
  verifyTokenAdminAndSupervisor,
  Controller.getWalletBySupervisorId
);

module.exports = router;
