const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/site.controller");
const {
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middlewares/verifyToken");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const folderPath = path.join(__dirname, "../assets/images");
    console.log(folderPath);

    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    callback(null, folderPath);
  },
  filename: function (req, file, callback) {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});
const uploads = multer({ storage });

router.post(
  "/",
  verifyTokenAndAdmin,
  uploads.single("file"),
  Controller.createSite
); //admin

router.delete("/", verifyTokenAndAdmin, Controller.deleteSiteById); // admin
router.get("/all", verifyTokenAndAdmin, Controller.getAllSites); // admin
router.get("/", verifyToken, Controller.getSiteById);

router.put("/", verifyToken, uploads.single("file"), Controller.updateSiteById);

module.exports = router;
