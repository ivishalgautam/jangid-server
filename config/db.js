require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.USER,
  host: process.env.JANGID_HOST,
  password: process.env.PASSWORD,
  database: process.env.JANGID_DATABASE,
  port: process.env.DB_PORT,
});

module.exports = { pool };
