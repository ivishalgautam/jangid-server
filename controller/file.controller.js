const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function deleteFile(req, res) {
  const { type } = req.query;
  const { worker_id, supervisor_id } = req.body;
  const { filename } = req.params;
  let data;

  try {
    switch (type) {
      case "worker":
        data = await pool.query(`SELECT * FROM workers where id = $1;`, [
          worker_id,
        ]);
        if (data.rowCount === 0)
          return res.status(404).json({ message: "worker not found!" });
        break;

      case "supervisor":
        data = await pool.query(`SELECT * FROM supervisors where id = $1;`, [
          supervisor_id,
        ]);
        if (data.rowCount === 0)
          return res.status(404).json({ message: "supervisor not found!" });
        break;

      default:
        return res.json({ message: `query type not found!` });
    }

    console.log({
      images: data.rows[0]?.docs?.filter((doc) => !doc.includes(filename)),
    });

    const file = path.join(__dirname, "../assets/images", filename);

    if (fs.existsSync(file)) {
      fs.unlinkSync(file, async (err) => {
        if (err) {
          console.log(
            `error deleting file: ${file} message:${JSON.stringify(err)}`
          );
        } else {
          switch (type) {
            case "worker":
              await pool.query(`UPDATE workers SET docs = $1 WHERE id = $2;`, [
                data.rows[0]?.docs?.filter((doc) => !doc.includes(filename)),
                worker_id,
              ]);
              break;

            case "supervisor":
              await pool.query(
                `UPDATE supervisors SET docs = $1 WHERE id = $2;`,
                [
                  data.rows[0]?.docs?.filter((doc) => !doc.includes(filename)),
                  supervisor_id,
                ]
              );
              break;

            default:
              break;
          }
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
