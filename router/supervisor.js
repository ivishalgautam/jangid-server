const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/supervisor.controller");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

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
    callback(null, `${Date.now()}-${file.originalname.split(" ").join("-")}`);
  },
});
const uploads = multer({ storage });

router.post(
  "/",
  verifyTokenAndAdmin,
  uploads.single("file"),
  Controller.createSupervisor
); //admin

router.put(
  "/:supervisorId",
  verifyTokenAndAdmin,
  Controller.updateSupervisorById
); //admin

router.put("/site-assign/:siteId", verifyTokenAndAdmin, Controller.siteAssign);

router.delete("/", verifyTokenAndAdmin, Controller.deleteSupervisorById); //admin

router.get("/all", verifyTokenAndAdmin, Controller.getAllSupervisors);
router.get("/", verifyTokenAndAdmin, Controller.getSupervisorbyId);

module.exports = router;
