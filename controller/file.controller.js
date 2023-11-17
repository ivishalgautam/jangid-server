const fs = require("fs");
const path = require("path");

async function deleteFile(req, res) {
  try {
    const { filename } = req.params;
    const file = path.join(__dirname, "../assets/images", filename);

    if (fs.existsSync(file)) {
      fs.unlinkSync(file, (err) => {
        if (err) {
          console.log(
            `error deleting file: ${file} message:${JSON.stringify(err)}`
          );
        } else {
          console.log("file deleted");
        }
      });
    } else {
      return res.status(404).json({ message: "file not found!" });
    }

    res.json({ message: "file deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { deleteFile };
