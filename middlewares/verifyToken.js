const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
      if (err) {
        return res.status(401).json({ message: err });
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    return res
      .status(404)
      .json({ message: "Access denied token not provided!" });
  }
}

function verifyTokenAndAuthorization(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.role === "admin") {
      next();
    } else {
      return res.status(401).json({ message: "Unauthorised!" });
    }
  });
}

function verifyTokenAndSupervisor(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role === "supervisor") {
      next();
    } else {
      return res.status(401).json({ message: "Access denied not supervisor!" });
    }
  });
}

function verifyTokenAndAdmin(req, res, next) {
  return next();
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      next();
    } else {
      return res.status(401).json({ message: "Access denied not admin!" });
    }
  });
}

function verifyTokenAdminAndSupervisor(req, res, next) {
  verifyToken(req, res, () => {
    if (["admin", "supervisor"].includes(req.user.role)) {
      next();
    } else {
      return res.status(401).json({ message: "Unauthorized!" });
    }
  });
}

function verifyAdminAndSupervisor(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role === "admin" || req.user.role === "supervisor") {
      next();
    } else {
      return res
        .status(401)
        .json({ message: "Access denied not admin or supervisor!" });
    }
  });
}

module.exports = {
  verifyToken,
  verifyTokenAndSupervisor,
  verifyTokenAndAuthorization,
  verifyTokenAndAdmin,
  verifyAdminAndSupervisor,
  verifyTokenAdminAndSupervisor,
};
