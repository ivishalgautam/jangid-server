const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/bill.controller");
const {
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middlewares/verifyToken");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const folderPath = path.join(__dirname, "../assets");
    console.log(folderPath);

    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    callback(null, folderPath);
  },
  filename: function (req, file, callback) {
    callback(null, `${Date.now()}-${file.originalname.split(" ").join("-")}`);
  },
});
const uploads = multer({ storage });

router.post(
  "/",
  verifyTokenAndAdmin,
  uploads.single("file"),
  Controller.createBill
); //admin
router.delete("/", verifyTokenAndAdmin, Controller.deleteBillById); // admin
router.get("/all", verifyTokenAndAdmin, Controller.getAllBills); // admin
router.get("/", verifyToken, Controller.getBillById);
router.put("/", verifyToken, uploads.single("file"), Controller.updateBillById);

module.exports = router;
