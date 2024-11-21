const jwt = require("jsonwebtoken");
const User = require("../models/user");

const isAuthenticated = async (req, res, next) => {
  const { token } = await req.cookies;

  if (!token) {
    return res.status(500).json({
      success: false,
      message: "User Not Logged In",
    });
  }

  const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decodedToken.id);

  if (!user) {
    return res.status(500).json({
      success: false,
      message: "User Not Found",
    });
  }

  req.user = user;

  next();
};

module.exports = isAuthenticated;
