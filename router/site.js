const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Controller = require("../controller/site.controller");

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

router.post("/", uploads.single("file"), Controller.createSite);
router.put("/:siteId", uploads.single("file"), Controller.updateSiteById);
router.delete("/:siteId", Controller.deleteSiteById);
router.get("/:siteId", Controller.getSiteById);
router.get("/", Controller.getAllSites);
