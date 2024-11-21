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

function MessageContainer({ chatId, onBack, chats, socket }) {
  const chat = chats.find((c) => c._id === chatId);
  if (!chat) return null;

  const { user } = useContext(UserContext);
  const { messages, setMessages, setLoadingMessages, setErrorMessages } =
    useContext(ChatMessageContext);
  const { selectedChat, setChats, setLoadingChats, setErrorChats } =
    useContext(UserChatContext);

  const [content, setContent] = useState("");
  const [recId, setRecId] = useState("");
  const [typing, setTyping] = useState(false); // For tracking current user's typing status
  const [isTyping, setIsTyping] = useState(false); // For tracking other user's typing status
  const [userTypingDetails, setUserTypingDetails] = useState(null);

  // Determine recipient ID
  useEffect(() => {
    const rec =
      user._id === chat.users[0]._id ? chat.users[1]._id : chat.users[0]._id;
    setRecId(rec);
  }, [chat.users, user._id]);

  // Handle sending messages
  async function handleSubmit(e) {
    e.preventDefault();
    if (content.trim().length === 0) return;

    const msg = await sendUserMessage(
      content,
      chat._id,
      recId,
      setMessages,
      setLoadingMessages,
      setErrorMessages,
      messages
    );
    if (typing) {
      setTyping(false);
      socket.emit("stop typing", selectedChat);
    }
    socket.emit("new message", msg);
    // setMessages((prevMessages) => [...prevMessages, msg]);
    getUserChatById(chatId, chats, setChats, setLoadingChats, setErrorChats);
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
      console.log("WEAREHERE");

      setMessages([...messages, newMsgRcv]);
    });

    return () => {
      socket.off("message recieved");
    };
  });

  console.log("SELCTDCHAT", selectedChat);

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
            <p className="text-sm text-muted-foreground">online</p>
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
      <footer className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            className="w-full p-2 border rounded-md"
            placeholder="Type a message"
            onChange={handleContentTyping}
            value={content}
            autoFocus={true}
            minLength={1}
          />
          <button type="submit" className="bg-black text-white p-2 rounded-md">
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
}

export default MessageContainer;
