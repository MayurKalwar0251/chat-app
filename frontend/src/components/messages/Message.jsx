import { UserContext } from "@/context/context";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";

function Message({ message }) {
  const [me, setMe] = useState(null);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const meOrNot = message.sender._id == user._id;
    setMe(meOrNot);
  }, []);

  return (
    <div
      className={cn("flex gap-2", {
        "justify-end": me,
      })}
    >
      <div
        className={cn("rounded-lg px-4 py-2 max-w-[50vw] break-words", {
          "bg-primary text-primary-foreground": me,
          "bg-muted": !me,
        })}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <div className="flex items-center justify-end gap-1">
          <span className="text-xs opacity-75">{message.createdAt}</span>
          {me && <Check className="h-3 w-3 opacity-75" />}
        </div>
      </div>
    </div>
  );
}

export default Message;
