import React, { useContext, useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import Message from "./Message";
import { Input } from "../ui/input";
import ScrollableFeed from "react-scrollable-feed";
import { sendUserMessage } from "@/context/Messages/Messages";
import { ChatMessageContext } from "@/context/messageContext";
import { UserContext } from "@/context/context";

import { SendIcon } from "lucide-react";
import { getUserChatById } from "@/context/Chats/Chats";
import { UserChatContext } from "@/context/chatContext";
import AudioMessage from "./AudioMessage";
import axios from "axios";

function MessageContainer({ chatId, onBack, chats, socket }) {
  const chat = chats.find((c) => c._id === chatId);
  if (!chat) return null;

  const { user, onlineUsers } = useContext(UserContext);
  const { messages, setMessages, setLoadingMessages, setErrorMessages } =
    useContext(ChatMessageContext);
  const { selectedChat, setChats, setLoadingChats, setErrorChats } =
    useContext(UserChatContext);

  const [content, setContent] = useState("");

  const [typing, setTyping] = useState(false); // For tracking current user's typing status
  const [isTyping, setIsTyping] = useState(false); // For tracking other user's typing status
  const [userTypingDetails, setUserTypingDetails] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showOnline, setShowOnline] = useState(false);

  // Determine recipient ID
  useEffect(() => {
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);

    if (!chat.isGroupChat) {
      const isAnyOnline = chat.users.some(
        (u) => onlineUsers[u._id] && u._id !== user._id
      );
      setShowOnline(isAnyOnline);
    }
  }, [chat.users, onlineUsers, chat.isGroupChat, user._id]);

  const uploadAudio = async () => {
    if (!audioBlob) return alert("No audio recorded!");

    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("upload_preset", "media_upload_preset"); // Replace with your preset
    formData.append("cloud_name", "dfiw6zwz0"); // Replace with your cloud name

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dfiw6zwz0/upload`,
        formData
      );

      const uploadedUrl = response.data.secure_url;
      console.log("Uploaded Audio URL:", uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      console.error("Error uploading audio:", error);
      alert("Failed to upload audio!");
    }
  };

  // Handle sending messages
  async function handleSubmit(e) {
    e.preventDefault();

    let fileContent = null;
    let fileType = null;

    if (audioBlob) {
      fileContent = await uploadAudio();
      fileType = "audio";
    }

    // if (content.trim().length === 0 && fileContent == null)
    //   return alert("Type Any Message First");

    const msg = await sendUserMessage({
      content: content.trim(),
      chatId: chat._id,
      setMessages,
      setLoadingMessages,
      setErrorMessages,
      messages,
      fileContent,
      fileType,
    });
    if (typing) {
      setTyping(false);
      socket.emit("stop typing", selectedChat);
    }
    socket.emit("new message", msg);
    // setMessages((prevMessages) => [...prevMessages, msg]);
    getUserChatById(chatId, chats, setChats, setLoadingChats, setErrorChats);
    setAudioBlob(null);
    setAudioUrl("");
    setContent("");
  }

  // Socket event listeners for typing and receiving messages
  useEffect(() => {
    socket.on("typing", (userTyping) => {
      setIsTyping(true);
      setUserTypingDetails(userTyping);
    });
    socket.on("stop typing", () => {
      setUserTypingDetails(null);
      setIsTyping(false);
    });

    return () => {
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [socket]);

  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(null);
  // Handle typing status
  function handleContentTyping(e) {
    const value = e.target.value;
    setContent(value);

    if (!typing && value != "") {
      setTyping(true);
      socket.emit("typing", selectedChat, user);
    }

    lastTypingTimeRef.current = new Date().getTime();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTimeRef.current;

      if (timeDiff >= 3000 && typing) {
        socket.emit("stop typing", selectedChat);
        setTyping(false);
      }
    }, 3000);
  }

  useEffect(() => {
    socket.on("message recieved", (newMsgRcv) => {
      setMessages([...messages, newMsgRcv]);
    });

    return () => {
      socket.off("message recieved");
    };
  });

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 items-center gap-3 border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to chats</span>
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h2 className="font-semibold">{chat.chatName}</h2>
            <p className="text-sm text-muted-foreground">
              {showOnline ? "Online" : "Offline"}
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Chat menu</span>
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollableFeed className="p-4">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <Message key={index} message={message} />
          ))}
        </div>
      </ScrollableFeed>

      {/* Typing Indicator */}
      {isTyping && userTypingDetails && (
        <span className="px-4">{userTypingDetails.name} Typing...</span>
      )}

      {/* Footer */}
      <footer className="border-t p-4 flex items-center gap-3 justify-between">
        <div className="audio-message-container ">
          <AudioMessage
            audioBlob={audioBlob}
            setAudioBlob={setAudioBlob}
            audioUrl={audioUrl}
            setAudioUrl={setAudioUrl}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        </div>

        {/* Form for sending text messages */}
        {!isRecording && !audioBlob && (
          <form
            onSubmit={handleSubmit}
            className="message-form flex gap-2 justify-between max-h-12 w-full"
          >
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              placeholder="Type a message"
              onChange={handleContentTyping}
              value={content}
              minLength={1}
              autoFocus
              required
            />
            <button
              type="submit"
              className="bg-black text-white p-2 rounded-md text-right"
            >
              <SendIcon />
            </button>
          </form>
        )}

        {/* Secondary button for sending the message manually */}
        <button
          onClick={handleSubmit}
          className={`bg-black text-white p-2 rounded-md text-right ${
            audioBlob ? "block" : "hidden"
          }`}
          disabled={isRecording}
        >
          <SendIcon />
        </button>
      </footer>
    </div>
  );
}

export default MessageContainer;
