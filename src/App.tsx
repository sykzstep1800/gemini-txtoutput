import { useState, useEffect } from "react";
import { sendToGeminiWithContext } from "./lib/gemini";
import ChatInput from "./components/ChatInput";
import ReactMarkdown from "react-markdown";
import Menu from "./components/Menu";
import { v4 as uuidv4 } from "uuid";

// Type definitions
type Message = {
  role: "user" | "model";
  text: string;
};

type Conversation = {
  id: string;
  name: string;
  messages: Message[];
  systemInstruction: string;
};

type SystemInstructionPreset = {
  name: string;
  instruction: string;
};

const CONVERSATIONS_KEY = "gemini_conversations";
const CURRENT_CONVERSATION_ID_KEY = "gemini_current_conversation_id";
const SYSTEM_INSTRUCTION_PRESETS_KEY = "gemini_system_instruction_presets";
const SELECTED_MODEL_KEY = "gemini_selected_model";

const getInitialPresets = (): SystemInstructionPreset[] => {
  try {
    const savedPresets = localStorage.getItem(SYSTEM_INSTRUCTION_PRESETS_KEY);
    return savedPresets ? JSON.parse(savedPresets) : [];
  } catch (error) {
    console.error(
      "Failed to load system instruction presets from localStorage",
      error
    );
    return [];
  }
};

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editRole, setEditRole] = useState<"user" | "model" | null>(null);
  const [systemInstructionPresets, setSystemInstructionPresets] =
    useState<SystemInstructionPreset[]>(getInitialPresets);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const savedModel = localStorage.getItem(SELECTED_MODEL_KEY);
      return savedModel ? JSON.parse(savedModel) : "gemini-2.5-flash"; // デフォルトモデル
    } catch (error) {
      console.error("Failed to load selected model from localStorage", error);
      return "gemini-2.5-flash";
    }
  });

  // --- Effects ---
  // Load conversations from localStorage on initial render
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem(CONVERSATIONS_KEY);
      const savedId = localStorage.getItem(CURRENT_CONVERSATION_ID_KEY);

      if (savedConversations) {
        const parsedConversations = JSON.parse(savedConversations);
        setConversations(parsedConversations);
        if (savedId) {
          setCurrentConversationId(JSON.parse(savedId));
        } else if (parsedConversations.length > 0) {
          setCurrentConversationId(parsedConversations[0].id);
        }
      } else {
        // No saved data, create a new conversation
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to load from localStorage", error);
      handleNewChat(); // Start fresh if loading fails
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save current conversation ID to localStorage when it changes
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(
        CURRENT_CONVERSATION_ID_KEY,
        JSON.stringify(currentConversationId)
      );
    }
  }, [currentConversationId]);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      SYSTEM_INSTRUCTION_PRESETS_KEY,
      JSON.stringify(systemInstructionPresets)
    );
  }, [systemInstructionPresets]);

  // Save selected model to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SELECTED_MODEL_KEY, JSON.stringify(selectedModel));
  }, [selectedModel]);

  // --- State Accessors ---
  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );
  const messages = currentConversation?.messages ?? [];
  const systemInstruction = currentConversation?.systemInstruction ?? "";

  // --- Handlers ---
  const updateConversation = (id: string, update: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...update } : c))
    );
  };

  const handleSend = async (userText: string, baseMessages?: Message[]) => {
    if (!currentConversationId) return;

    const history = baseMessages ?? messages;
    const newMessages: Message[] = [
      ...history,
      { role: "user", text: userText },
    ];
    updateConversation(currentConversationId, { messages: newMessages });
    setIsLoading(true);

    try {
      const reply = await sendToGeminiWithContext(
        newMessages,
        systemInstruction,
        selectedModel
      );
      updateConversation(currentConversationId, {
        messages: [...newMessages, { role: "model", text: reply }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = (index: number) => {
    const targetMsg = messages[index];
    if (!targetMsg || targetMsg.role !== "user") return;
    const trimmedHistory = messages.slice(0, index);
    handleSend(targetMsg.text, trimmedHistory);
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    const newConversation: Conversation = {
      id: newId,
      name: `Conversation ${conversations.length + 1}`,
      messages: [],
      systemInstruction: "",
    };
    setConversations((prev) => [...prev, newConversation]);
    setCurrentConversationId(newId);
  };

  const handleSwitchConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    // If the deleted conversation was the current one, switch to another or create a new one
    if (currentConversationId === id) {
      const remainingConversations = conversations.filter((c) => c.id !== id);
      if (remainingConversations.length > 0) {
        setCurrentConversationId(remainingConversations[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameConversation = (id: string, newName: string) => {
    updateConversation(id, { name: newName });
  };

  const handleClearChat = () => {
    if (currentConversationId) {
      updateConversation(currentConversationId, { messages: [] });
    }
  };

  const handleSystemInstructionChange = (text: string) => {
    if (currentConversationId) {
      updateConversation(currentConversationId, { systemInstruction: text });
    }
  };

  const handleAddSystemInstructionPreset = (name: string) => {
    if (!currentConversation) return;
    const newPreset: SystemInstructionPreset = {
      name,
      instruction: currentConversation.systemInstruction,
    };
    setSystemInstructionPresets((prev) => {
      const existingIndex = prev.findIndex((p) => p.name === name);
      if (existingIndex !== -1) {
        // 上書き
        const updatedPresets = [...prev];
        updatedPresets[existingIndex] = newPreset;
        return updatedPresets;
      } else {
        // 新規追加
        return [...prev, newPreset];
      }
    });
  };

  const handleDeleteSystemInstructionPreset = (name: string) => {
    const presetToDelete = systemInstructionPresets.find(
      (p) => p.name === name
    );
    setSystemInstructionPresets((prev) => prev.filter((p) => p.name !== name));

    if (
      presetToDelete &&
      currentConversation?.systemInstruction === presetToDelete.instruction
    ) {
      handleSystemInstructionChange("");
    }
  };

  return (
    <div className="flex h-screen">
      <Menu
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSwitchConversation={handleSwitchConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClear={handleClearChat}
        systemInstruction={systemInstruction}
        onSystemInstructionChange={handleSystemInstructionChange}
        systemInstructionPresets={systemInstructionPresets}
        onAddSystemInstructionPreset={handleAddSystemInstructionPreset}
        onDeleteSystemInstructionPreset={handleDeleteSystemInstructionPreset}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
      <div className="flex-1 flex flex-col max-w-xl mx-auto p-4">
        <div className="flex-1 overflow-y-auto my-4 space-y-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="bg-white p-2 rounded shadow whitespace-pre-wrap"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <strong>{msg.role === "user" ? "🧑" : "🤖"}:</strong>{" "}
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="whitespace-pre-wrap" {...props} />
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {msg.role === "user" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleResend(i)}
                      disabled={isLoading}
                      className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
                    >
                      再送
                    </button>
                    <button
                      onClick={() => {
                        setEditIndex(i);
                        setEditText(msg.text);
                        setEditRole("user");
                      }}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-sm"
                    >
                      編集
                    </button>
                  </div>
                )}
                {msg.role === "model" && (
                  <button
                    onClick={() => {
                      setEditIndex(i);
                      setEditText(msg.text);
                      setEditRole("model");
                    }}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-sm"
                  >
                    編集
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <ChatInput
          onSend={(text) => {
            if (editIndex !== null && editRole === "user") {
              const trimmedHistory = messages.slice(0, editIndex);
              handleSend(text, trimmedHistory);
            } else if (editIndex !== null && editRole === "model") {
              if (currentConversationId) {
                const updatedMessages = [...messages];
                updatedMessages[editIndex] = {
                  ...updatedMessages[editIndex],
                  text,
                };
                updateConversation(currentConversationId, {
                  messages: updatedMessages,
                });
              }
            } else {
              handleSend(text);
            }
            setEditIndex(null);
            setEditText("");
            setEditRole(null);
          }}
          inputText={editText}
          setInputText={setEditText}
          isEditing={editIndex !== null}
          onCancelEdit={() => {
            setEditIndex(null);
            setEditText("");
            setEditRole(null);
          }}
        />
      </div>
    </div>
  );
}

export default App;
