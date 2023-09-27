require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());

app.use("/api/supervisors", require("./router/supervisor"));
app.use("/api/workers", require("./router/worker"));
app.use("/api/sites", require("./router/site"));
app.use("/api/wallets", require("./router/wallet"));
app.use("/api/expenses", require("./router/expense"));
app.use("/api/payouts", require("./router/payout"));
app.use("/api/dashboard", require("./router/dashboard"));

app.use("/api/admin", require("./router/admin"));

// auth
app.use("/api/auth", require("./router/auth"));

app.listen(process.env.PORT, () => {
  console.log(`Server up and running on localhost:${process.env.PORT}`);
});
