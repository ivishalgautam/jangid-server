require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");

app.use(express.static("assets/images"));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
  if (req.method !== "GET") {
    console.log(`\n[${req.method}] ${req.originalUrl}`);
    console.log("Request Body:", req.body);
  }
  next();
});

app.use("/api/supervisors", require("./router/supervisor"));
app.use("/api/workers", require("./router/worker"));
app.use("/api/payouts", require("./router/payout"));
app.use("/api/sites", require("./router/site"));
app.use("/api/wallets", require("./router/wallet"));
app.use("/api/expenses", require("./router/expense"));
app.use("/api/payouts", require("./router/payout"));
app.use("/api/dashboard", require("./router/dashboard"));
app.use("/api/attendances", require("./router/attendance"));
app.use("/api/files", require("./router/file"));

app.use("/api/admin", require("./router/admin"));

// auth
app.use("/api/auth", require("./router/auth"));

app.get("/", (req, res) => {
  res.json({ message: "hello world" });
});

app.listen(4001, "127.0.0.1", () => {
  console.log(`Jangid stone server up and running on localhost:4001`);
});
