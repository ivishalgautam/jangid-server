const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/worker.controller");
const { validateWorker } = require("../middlewares/validator");
const { verifyTokenAndSupervisor } = require("../middlewares/verifyToken");

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
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});
const uploads = multer({ storage });

router.post(
  "/",
  validateWorker,
  verifyTokenAndSupervisor,
  uploads.array("file", 5),
  Controller.createWorker
);
router.put(
  "/:workerId",
  verifyTokenAndSupervisor,
  uploads.array("file", 5),
  Controller.updateWorkerById
);
router.delete(
  "/:workerId",
  verifyTokenAndSupervisor,
  Controller.deleteWorkerById
);
router.get("/:workerId", verifyTokenAndSupervisor, Controller.getWorkerById);
router.get("/", verifyTokenAndSupervisor, Controller.getAllWorkers);

module.exports = router;
