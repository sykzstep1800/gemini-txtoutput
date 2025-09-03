import React, { useState, useRef, useEffect } from "react";
import ApiKeyInput from "./ApiKeyInput";
import "./Menu.css";

// Type definitions
type Message = {
  role: "user" | "model";
  text: string;
};

type Conversation = {
  id: string;
  name: string;
  messages: Message[];
};

type SystemInstructionPreset = {
  name: string;
  instruction: string;
};

type MenuProps = {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSwitchConversation: (id: string) => void;
  onClear: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newName: string) => void;
  systemInstruction: string;
  onSystemInstructionChange: (text: string) => void;
  systemInstructionPresets: SystemInstructionPreset[];
  onAddSystemInstructionPreset: (name: string) => void;
  onDeleteSystemInstructionPreset: (name: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
};

const Menu: React.FC<MenuProps> = ({
  conversations,
  currentConversationId,
  onNewChat,
  onSwitchConversation,
  onClear,
  onDeleteConversation,
  onRenameConversation,
  systemInstruction,
  onSystemInstructionChange,
  systemInstructionPresets,
  onAddSystemInstructionPreset,
  onDeleteSystemInstructionPreset,
  selectedModel,
  onModelChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedPresetName, setSelectedPresetName] = useState("");
  const touchStartRef = useRef<number | null>(null);
  const touchMoveRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync dropdown with current system instruction
  useEffect(() => {
    const currentPresetName =
      systemInstructionPresets.find((p) => p.instruction === systemInstruction)
        ?.name || "";
    setSelectedPresetName(currentPresetName);
  }, [systemInstruction, systemInstructionPresets]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current !== null) {
      touchMoveRef.current = e.touches[0].clientX;
      e.preventDefault(); // デフォルトのスクロール動作などを抑制
    }
  };
  const handleTouchEnd = () => {
    if (touchStartRef.current !== null && touchMoveRef.current !== null) {
      const swipeDistance = touchMoveRef.current - touchStartRef.current;
      if (swipeDistance > 30) setIsOpen(true); // 感度を調整
      else if (swipeDistance < -30) setIsOpen(false); // 感度を調整
    }
    touchStartRef.current = null;
    touchMoveRef.current = null;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Action handlers
  const handleSwitch = (id: string) => {
    if (editingId !== id) {
      onSwitchConversation(id);
      setIsOpen(false);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  const handleDoubleClick = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleRename = () => {
    if (editingId && editingName.trim()) {
      onRenameConversation(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") setEditingId(null);
  };

  const handleExport = () => {
    const currentConvo = conversations.find(
      (c) => c.id === currentConversationId
    );
    if (!currentConvo) return;

    const markdownContent =
      `# Conversation: ${currentConvo.name}\n\n` +
      currentConvo.messages
        .map((msg) => {
          const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
          return `**${role}:**\n\n${msg.text}`;
        })
        .join("\n\n---\n\n");

    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentConvo.name.replace(/[\\/\:\*\?"<>|]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedPresetName(name); // 選択された名前を state に保存
    const selectedPreset = systemInstructionPresets.find(
      (p) => p.name === name
    );
    if (selectedPreset) {
      onSystemInstructionChange(selectedPreset.instruction);
    } else {
      // 「プリセットを選択...」が選ばれた場合など
      onSystemInstructionChange("");
    }
  };

  const handleSavePreset = () => {
    const name = prompt("プリセット名を入力してください:");
    if (name && systemInstruction.trim()) {
      onAddSystemInstructionPreset(name);
    }
  };

  const handleDeletePreset = () => {
    if (
      selectedPresetName &&
      confirm(`プリセット「${selectedPresetName}」を削除しますか？`)
    ) {
      onDeleteSystemInstructionPreset(selectedPresetName);
    }
  };

  return (
    <div
      className="touch-handler"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button onClick={() => setIsOpen(!isOpen)} className="menu-toggle-pc">
        {isOpen ? "メニューを閉じる" : "メニューを開く"}
      </button>
      <div className={`menu-container ${isOpen ? "open" : ""}`} ref={menuRef}>
        <div className="menu-content" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleNewChat} className="new-chat-button">
            + 新しい対話を開始
          </button>

          <div className="conversation-list">
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className={`conversation-item ${
                  convo.id === currentConversationId ? "active" : ""
                }`}
                onClick={() => handleSwitch(convo.id)}
                onDoubleClick={() => handleDoubleClick(convo.id, convo.name)}
              >
                {editingId === convo.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={handleRenameKeyDown}
                    className="rename-input"
                    onClick={(e) => e.stopPropagation()} // Prevent switch on click
                  />
                ) : (
                  <span className="conversation-name">{convo.name}</span>
                )}
                <div className="conversation-actions">
                  {editingId !== convo.id && (
                    <button
                      className="edit-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDoubleClick(convo.id, convo.name);
                      }}
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    className="delete-conversation-button"
                    onClick={(e) => handleDelete(e, convo.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="menu-footer">
            <div className="system-instruction-editor">
              <label htmlFor="system-instruction">システムへの指示:</label>
              <textarea
                id="system-instruction"
                value={systemInstruction}
                onChange={(e) => onSystemInstructionChange(e.target.value)}
                rows={5}
                className="system-instruction-textarea"
                placeholder="例: あなたは優秀なアシスタントです。"
              />
              <div className="system-instruction-presets">
                <select
                  onChange={handlePresetChange}
                  value={selectedPresetName}
                >
                  <option value="">プリセットを選択...</option>
                  {systemInstructionPresets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <div className="preset-buttons">
                  <button onClick={handleSavePreset}>保存</button>
                  <button
                    onClick={handleDeletePreset}
                    disabled={!selectedPresetName}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>

            <ApiKeyInput
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
            <button onClick={handleExport} className="export-button">
              現在の対話をエクスポート
            </button>
            <button onClick={onClear} className="clear-button">
              現在の対話をクリア
            </button>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="close-button-mobile"
          >
            閉じる
          </button>
        </div>
        {isOpen && (
          <div className="menu-overlay" onClick={() => setIsOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default Menu;
