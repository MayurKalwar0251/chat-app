const express = require("express");
const dotenv = require("dotenv");
const { connectDb } = require("./utils/connectDb");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const cookieParser = require("cookie-parser");
const messageRouter = require("./routes/message");
const cors = require("cors");

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: "https://chat-app-green-two-75.vercel.app",
    credentials: true,
  })
);

dotenv.config();

connectDb();

app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/message", messageRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server Running",
  });
});

const server = app.listen(process.env.PORT, () => {
  console.log(`Connected at PORT `, process.env.PORT);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://chat-app-green-two-75.vercel.app",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected To Socket IO");
  console.log("Active connections:", io.engine.clientsCount);

  // Setup user connection
  socket.on("setup", (userId) => {
    if (!userId) {
      return socket.emit("error", "UserId is required");
    }
    socket.join(userId);
    socket.emit("connected");
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
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  // Handle errors
  socket.on("error", (err) => {
    console.error("Socket.IO error:", err);
  });
});
