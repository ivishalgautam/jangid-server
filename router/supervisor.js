const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/supervisor.controller");
const {
  verifyTokenAndAdmin,
  verifyTokenAdminAndSupervisor,
} = require("../middlewares/verifyToken");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const folderPath = path.join(__dirname, "../assets");

    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    callback(null, folderPath);
  },
  filename: function (req, file, callback) {
    // callback(null, `${Date.now()}-${file.originalname.split(" ").join("-")}`);

    callback(null, `${Date.now()}-${file.originalname.split(" ").join("-")}`);
  },
});

const uploads = multer({ storage });

router.post(
  "/",
  verifyTokenAndAdmin,
  uploads.array("file", 5),
  Controller.createSupervisor
); //admin

router.put(
  "/:supervisorId",
  verifyTokenAndAdmin,
  uploads.array("file", 5),
  Controller.updateSupervisorById
); //admin

router.put(
  "/update-profile/:supervisorId",
  verifyTokenAdminAndSupervisor,
  uploads.single("file"),
  Controller.updateProfileImage
);

router.put(
  "/upload-docs/:supervisorId",
  verifyTokenAndAdmin,
  uploads.array("file", 5),
  Controller.uploadDocs
); //admin
router.put(
  "/update-password/:id",
  verifyTokenAdminAndSupervisor,
  Controller.updatePassword
); //admin

router.put("/site-assign/:siteId", verifyTokenAndAdmin, Controller.siteAssign);

router.delete("/", verifyTokenAndAdmin, Controller.deleteSupervisorById); //admin

router.get("/all", verifyTokenAndAdmin, Controller.getAllSupervisors);

router.get("/", verifyTokenAndAdmin, Controller.getSupervisorbyId);

module.exports = router;
