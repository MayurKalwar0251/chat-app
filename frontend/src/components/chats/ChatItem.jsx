import { UserContext } from "@/context/context";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import React, { useContext } from "react";

function ChatItem({ chat, onSelect, selectedChat }) {
  const { user } = useContext(UserContext);
  const getUserName = (users) => {
    return users[0]._id == user._id ? users[1].name : users[0].name;
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
          {/*Will change to sender name or group name*/}
          <span className="text-xs text-muted-foreground">{chat.content}</span>
        </div>
        {chat.latestMessage && (
          <div className="flex items-center gap-2">
            <span className="truncate text-sm text-black">
              {chat.length > 30
                ? chat.latestMessage.content
                : chat.latestMessage.content.slice(0, 30)}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export default ChatItem;
