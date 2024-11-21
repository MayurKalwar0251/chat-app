const Chat = require("../models/chat");
const Message = require("../models/message");

const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, chatId } = req.body;

    if (!receiverId || !content || !chatId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const sender = req.user._id;

    const msg = await Message.create({
      sender,
      receiver: receiverId,
      content,
      chatBW: chatId,
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: msg });

    const messageSend = await Message.findById(msg._id)
      .populate("sender", "-password")
      .populate("receiver", "-password")
      .populate("chatBW");

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      messageSend,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const fetchMessages = async (req, res) => {
  const { cId } = req.params; // chat id required

  if (!cId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    const messages = await Message.find({
      chatBW: cId,
    })
      .populate("sender", "-password")
      .populate("receiver", "-password")
      .populate("chatBW")
      .sort({ createdAt: 1 }); // Fetch messages in ascending order (oldest to newest)

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  fetchMessages,
};
