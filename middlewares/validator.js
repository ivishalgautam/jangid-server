const { body } = require("express-validator");

// Validation middleware for creating a supervisor
const validateSupervisor = [
  body("fullname")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("phone")
    .isLength({ min: 10 })
    .withMessage("Phone number must be at least 10 characters long"),
];

// Validation middleware for creating a worker
const validateWorker = [
  body("fullname")
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 characters long"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("phone")
    .isLength({ min: 10 })
    .withMessage("Phone number must be at least 10 characters long"),
];

module.exports = {
  validateSupervisor,
  validateWorker,
};
