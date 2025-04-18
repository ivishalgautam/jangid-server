const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/worker.controller");
const {
  verifyTokenAdminAndSupervisor,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const folderPath = path.join(__dirname, "../assets");
    // console.log(folderPath);

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
  // validateWorker,
  verifyTokenAdminAndSupervisor,
  uploads.array("file", 5),
  // uploads.single("profile_img"),
  Controller.createWorker
);
router.put(
  "/",
  verifyTokenAdminAndSupervisor,
  uploads.array("file", 5),
  Controller.updateWorkerById
);

// to add profile image
router.put(
  "/update-profile/:worker_id",
  verifyTokenAdminAndSupervisor,
  uploads.single("file"),
  Controller.updateProfileImage
);

router.put(
  "/upload-docs/:workerId",
  verifyTokenAdminAndSupervisor,
  uploads.array("file", 5),
  Controller.uploadDocs
);
router.put(
  "/update-password/:id",
  verifyTokenAdminAndSupervisor,
  Controller.updatePassword
);

router.put(
  "/site-assign",
  verifyTokenAdminAndSupervisor,
  Controller.siteAssign
);

router.delete("/", verifyTokenAndAdmin, Controller.deleteWorkerById);
router.get("/all", verifyTokenAdminAndSupervisor, Controller.getAllWorkers);
router.get("/", verifyTokenAdminAndSupervisor, Controller.getWorkerById);
router.get(
  "/punched-in",
  verifyTokenAdminAndSupervisor,
  Controller.punchedInWorkers
);
router.delete(
  "/punched-in/:sessionId",
  verifyTokenAdminAndSupervisor,
  Controller.deletePunchedIn
);

module.exports = router;
