import * as React from "react";

import { cn } from "@/lib/utils";
import ChatList from "@/components/chats/ChatList";
import MessageContainer from "@/components/messages/MessageContainer";
import WelcomeScreen from "@/components/WelcomeScreen";
import { UserChatContext } from "@/context/chatContext";
import { UserContext } from "@/context/context";
import { getUserChatsMessages } from "@/context/Messages/Messages";
import { ChatMessageContext } from "@/context/messageContext";
import { checkOrCreateChat, getUserChatById } from "@/context/Chats/Chats";
import io from "socket.io-client";
import { server, serverHost } from "@/utils/server";
import GroupCreateModal from "@/components/GroupCreateModal";

export default function HomePage() {
  const [showMessages, setShowMessages] = React.useState(false);

  const [selectedChatUser, setSelectedChatUser] = React.useState(null);

  const [createGroupModal, setCreateGroupModal] = React.useState(false);

  const { user } = React.useContext(UserContext);
  const { messages, setMessages, setLoadingMessages, setErrorMessages } =
    React.useContext(ChatMessageContext);

  const {
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    setLoadingChats,
    setErrorChats,
  } = React.useContext(UserChatContext);

  const socketRef = React.useRef(null);

  React.useEffect(() => {
    socketRef.current = io(serverHost, { withCredentials: true });

    socketRef.current.emit("setup", user._id);
    socketRef.current.on("connected", () => {
      console.log("SOCKET CONNECTED");
    });

    return () => {
      // Clean up socket connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user._id]);

  const handleSelectChat = async (chatId, users) => {
    setSelectedChat((prev) => (prev !== chatId ? chatId : chatId));
    const userId = user._id == users[0]._id ? users[1]._id : users[0]._id;
    setSelectedChatUser(userId);
    setShowMessages(true);

    socketRef.current.emit("join chat", chatId);

    await getUserChatsMessages(
      chatId,
      setMessages,
      setLoadingMessages,
      setErrorMessages
    );
  };

  const handleBackToChats = () => {
    socketRef.current.emit("stop typing", selectedChat);
    setShowMessages(false);
    setSelectedChat(null);
  };

  const handleSelectSearchChat = async (userId) => {
    const chat = await checkOrCreateChat(
      userId,
      setChats,
      setLoadingChats,
      setErrorChats,
      chats
    );

    setSelectedChatUser(userId);
    setSelectedChat(chat._id);
    setShowMessages(true);

    socketRef.current.emit("join chat", chat._id);
    socketRef.current.emit("create chat", chat);

    getUserChatsMessages(
      chat._id,
      setMessages,
      setLoadingMessages,
      setErrorMessages
    );
  };

  React.useEffect(() => {
    socketRef.current.on("chat created", (newChat) => {
      setChats([...chats, newChat]);
    });
  });

  React.useEffect(() => {
    socketRef.current.on("message recieved", (newMsgRcv) => {
      getUserChatById(
        newMsgRcv.chatBW._id,
        chats,
        setChats,
        setLoadingChats,
        setErrorChats
      );
    });

    return () => {
      socketRef.current.off("message recieved");
    };
  });

  return (
    <div className="grid  grid-cols-1 md:grid-cols-[350px_1fr] bg-background h-screen">
      {createGroupModal && (
        <GroupCreateModal
          createGroupModal={createGroupModal}
          setCreateGroupModal={setCreateGroupModal}
          setShowMessages={setShowMessages}
          socket={socketRef.current}
        />
      )}
      <div
        className={cn("md:block overflow-x-hidden", {
          "hidden md:block": showMessages,
        })}
      >
        <ChatList
          chats={chats}
          onSelectChat={handleSelectChat}
          onSelectSearchChat={handleSelectSearchChat}
          socket={socketRef.current}
          setCreateGroupModal={setCreateGroupModal}
        />
      </div>
      <div
        className={cn("md:block overflow-x-hidden", {
          "hidden md:block": !showMessages,
        })}
      >
        {selectedChat && messages ? (
          <MessageContainer
            chats={chats}
            chatId={selectedChat}
            onBack={handleBackToChats}
            socket={socketRef.current}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
}
