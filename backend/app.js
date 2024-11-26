const express = require("express");
const dotenv = require("dotenv");
const { connectDb } = require("./utils/connectDb");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const cookieParser = require("cookie-parser");
const messageRouter = require("./routes/message");
const cors = require("cors");
const User = require("./models/user");
const path = require("path");

const app = express();
dotenv.config();

app.use(express.json());
// app.use(express.urlencoded(true));

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.static(path.join(__dirname, "dist")));

connectDb();

app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/message", messageRouter);

// app.get("*", (req, res) => {
//   console.log("HOME PAGE JOINED");

//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

app.get("/", (req, res) => {
  app.use(express.static(path.resolve(__dirname, "frontend", "dist")));
  res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
});
const server = app.listen(process.env.PORT, () => {
  console.log(`Connected at PORT `, process.env.PORT);
});

const io = require("socket.io")(server, {
  pingTimeout: 10000,
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

const onlineUsers = {}; // will store userid who are online

io.on("connection", (socket) => {
  console.log("Connected To Socket IO");
  console.log("Active connections:", io.engine.clientsCount);

  // Setup user connection
  socket.on("setup", (userId) => {
    if (!userId) {
      return socket.emit("error", "UserId is required");
    }

    onlineUsers[userId] = socket.id;
    socket.join(userId);
    socket.emit("connected");

    // Notify others that this user is online
    socket.broadcast.emit("user online", userId);

    // Send the current list of online users to the new user
    socket.emit("all users online", onlineUsers);
    console.log("SETUPP ", userId, socket.id);
    console.log(onlineUsers);

    // notifying other users
  });

  // Join chat room
  socket.on("join chat", (chatId) => {
    if (!chatId) {
      return socket.emit("error", "ChatId is required");
    }

    socket.join(chatId);
  });

  socket.on("typing", (chatId, user) => {
    socket.to(chatId).emit("typing", user);
  });

  socket.on("stop typing", (chatId) => {
    socket.to(chatId).emit("stop typing");
  });

  socket.on("new message", (newChat) => {
    var chat = newChat.chatBW;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user == newChat.sender._id)
        return console.log("SENDER doesnt get msg ");
      socket.in(user).emit("message recieved", newChat);
    });
  });

  socket.on("create chat", (chat) => {
    const users = chat.users;

    users.forEach((user) => {
      socket.in(user).emit("chat created", chat);
    });
  });

  // Handle disconnections
  socket.on("disconnect", async () => {
    const disconnectedUser = Object.keys(onlineUsers).find(
      (key) => onlineUsers[key] === socket.id
    );

    console.log("User disconnected ", disconnectedUser);
    await User.findByIdAndUpdate(disconnectedUser, { lastSeen: new Date() });

    if (disconnectedUser) {
      delete onlineUsers[disconnectedUser]; // Remove from online users

      // Notify others that this user is offline
      socket.broadcast.emit("user offline", disconnectedUser);
    }
  });

  // Handle errors
  socket.on("error", (err) => {
    console.error("Socket.IO error:", err);
  });
});
