const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/worker.controller");
const { validateWorker } = require("../middlewares/validator");
const {
  verifyTokenAndSupervisor,
  verifyToken,
  verifyTokenAdminAndSupervisor,
} = require("../middlewares/verifyToken");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    const folderPath = path.join(__dirname, "../assets/images");
    // console.log(folderPath);

    // Create the folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    callback(null, folderPath);
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname +
        "-" +
        Date.now() +
        path.extname(file.originalname.split(" ").join("-"))
    );
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
  verifyTokenAndSupervisor,
  uploads.array("file", 5),
  Controller.updateWorkerById
);

// to add profile image
router.put(
  "/update-profile",
  verifyTokenAndSupervisor,
  uploads.single("file"),
  Controller.updateProfileImage
);

router.put("/site-assign", verifyTokenAndSupervisor, Controller.siteAssign);

router.delete("/", verifyTokenAndSupervisor, Controller.deleteWorkerById);
router.get("/all", verifyToken, Controller.getAllWorkers);
router.get("/", verifyTokenAndSupervisor, Controller.getWorkerById);

module.exports = router;
