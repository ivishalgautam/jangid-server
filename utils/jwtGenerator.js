require("dotenv").config();
const jwt = require("jsonwebtoken");

function jwtGenerator(user) {
  return jwt.sign(user, process.env.JWT_SEC, "2d");
}

module.exports = jwtGenerator;
