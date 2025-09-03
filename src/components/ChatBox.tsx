import React from "react";

type Props = {
  messages: string[];
};

const ChatBox: React.FC<Props> = ({ messages }) => (
  <div
    id="chat-box"
    className="h-96 p-4 overflow-y-auto space-y-2 scroll-smooth"
  >
    {messages.map((msg, i) => (
      <div
        key={i}
        className="text-sm whitespace-pre-wrap bg-white p-2 rounded shadow"
      >
        {msg}
      </div>
    ))}
  </div>
);

export default ChatBox;
