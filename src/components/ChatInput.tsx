import React, { useState } from "react";

type Props = {
  onSend: (text: string) => void;
  inputText?: string;
  setInputText?: (text: string) => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
};

const ChatInput: React.FC<Props> = ({
  onSend,
  inputText = "",
  setInputText,
  isEditing = false,
  onCancelEdit,
}) => {
  const [localInput, setLocalInput] = useState("");

  const input = setInputText ? inputText : localInput;
  const updateInput = setInputText ?? setLocalInput;

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSend(input);
    updateInput("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="flex flex-col border-t p-4 space-y-2"
    >
      <textarea
        value={input}
        onChange={(e) => updateInput(e.target.value)}
        placeholder="Shift+Enterで改行、Enterで送信"
        rows={3}
        className="border rounded px-3 py-2 focus:outline-none resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex space-x-2 justify-end">
        <button
          type="submit"
          className={`${
            isEditing
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white px-4 py-2 rounded`}
        >
          {isEditing ? "再送信" : "送信"}
        </button>
        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
};
export default ChatInput;
