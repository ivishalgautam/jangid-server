require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

app.use("/api/supervisors", require("./router/supervisor"));
app.use("/api/workers", require("./router/worker"));
app.use("/api/dashboard", require("./router/dashboard"));

app.listen(process.env.PORT, () => {
  console.log(`Server up and running on localhost:${process.env.PORT}`);
});
