import { UserContext } from "@/context/context";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Mic } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";

function ChatItem({ chat, onSelect, selectedChat }) {
  const { user, onlineUsers } = useContext(UserContext);

  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (!chat.isGroupChat) {
      const isAnyOnline = chat.users.some(
        (u) => onlineUsers[u._id] && u._id !== user._id
      );
      setShowOnline(isAnyOnline);
    }
  }, [chat.isGroupChat, chat.users, onlineUsers, user._id]);

  const getUserName = (users) => {
    return users[0]._id === user._id ? users[1].name : users[0].name;
  };

  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"
      style={
        selectedChat != chat._id
          ? { backgroundColor: "white" }
          : { backgroundColor: "grey" }
      }
    >
      {/*
       <Avatar>
        <AvatarImage src={chat.avatar} alt={chat.name} />
        <AvatarFallback>{chat.name[0]}</AvatarFallback>
      </Avatar>
      */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          {chat.isGroupChat ? (
            <span className="font-medium">{chat.chatName}</span>
          ) : (
            <span className="font-medium">{getUserName(chat.users)}</span>
          )}
        </div>
        {showOnline == true && <span>Online</span>}

        {chat.latestMessage && (
          <div className="flex items-center gap-2">
            {/* Check the fileType to display the content type */}
            {chat.latestMessage.fileType === "audio" ? (
              // Display "Audio" if file type is audio
              <span className="flex gap-2 text-sm text-black">
                <Mic />
                Audio
              </span>
            ) : chat.latestMessage.fileType === "image" ? (
              // Display "Image" if file type is image
              <span className="text-sm text-black">Image</span>
            ) : chat.latestMessage.fileType === "video" ? (
              // Display "Video" if file type is video
              <span className="text-sm text-black">Video</span>
            ) : (
              // If it's a text message, just display the content
              <span className="truncate text-sm text-black">
                {chat.latestMessage.content.length > 30
                  ? chat.latestMessage.content
                  : chat.latestMessage.content.slice(0, 30)}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default ChatItem;
