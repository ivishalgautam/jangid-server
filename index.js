require("dotenv").config();
const express = require("express");
const app = express();

app.use("/api/supervisors", require("./router/supervisor"));
app.use("/api/workers", require("./router/worker"));

app.listen(process.env.PORT, () => {
  console.log(`Server up and running on localhost:${process.env.PORT}`);
});
