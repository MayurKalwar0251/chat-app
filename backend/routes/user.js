const express = require("express");
const {
  createUser,
  loginUser,
  updateUser,
  searchUser,
  getUserDetails,
} = require("../controllers/user");
const isAuthenticated = require("../middleware/authentication");

const userRouter = express.Router();

// for creating user
userRouter.post("/", createUser);

// for loging user
userRouter.post("/login", loginUser);


// for updating user infos
userRouter.put("/update/:id", isAuthenticated, updateUser);

// for getting user infos
userRouter.get("/", isAuthenticated, getUserDetails);

module.exports = userRouter;
