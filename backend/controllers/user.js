const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createUser = async (req, res) => {
  const { name, email, phoneNo, password } = req.body;

  if (!name || !email || !password || !phoneNo) {
    return res.status(500).json({
      success: false,
      message: "All Fields Are Required",
    });
  }

  let user = await User.findOne({ email });

  if (user) {
    return res.status(500).json({
      success: false,
      message: "User Already Exists",
    });
  }

  const hashPass = await bcrypt.hash(password, 10);

  user = await User.create({ name, email, password: hashPass, phoneNo });

  res.status(200).json({
    success: true,
    message: "User Created Successfully",
    user,
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(500).json({
      success: false,
      message: "All Fields Are Required",
    });
  }

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(500).json({
      success: false,
      message: "User Doesn't Exist",
    });
  }

  const comparePass = await bcrypt.compare(password, user.password);

  if (!comparePass) {
    return res.status(500).json({
      success: false,
      message: "Password Doesn't Match",
    });
  }

  sendToken(user, 200, "User Logged In Successfully", res);
};


const generateToken = async (userID) => {
  const token = await jwt.sign({ id: userID }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return token;
};

const sendToken = async (user, statusCode, message, res) => {
  const token = await generateToken(user._id);
  const options = {
    expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    httpOnly: false,
    sameSite: "none",
    secure: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user,
    token,
  });
};

const getUserDetails = async (req, res) => {
  const myId = req.user._id;

  const user = await User.findById(myId);

  res.status(200).json({
    success: true,
    user,
  });
};

const updateUser = async (req, res) => {};

module.exports = {
  createUser,
  loginUser,
  updateUser,
  getUserDetails,
};
