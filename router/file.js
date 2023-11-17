const { deleteFile } = require("../controller/file.controller");

const router = require("express").Router();

router.delete("/:filename", deleteFile);

module.exports = router;
