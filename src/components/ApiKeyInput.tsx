// components/ApiKeyInput.tsx
import React, { useState } from "react";

type ApiKeyInputProps = {
  selectedModel: string;
  onModelChange: (model: string) => void;
};

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  selectedModel,
  onModelChange,
}) => {
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("gemini_api_key") || ""
  );

  const handleSave = () => {
    localStorage.setItem("gemini_api_key", apiKey);
    alert("APIキーを保存しました！");
  };

  return (
    <div className="api-key-input">
      <label htmlFor="api-key">Gemini API Key:</label>
      <input
        id="api-key"
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="YOUR_GEMINI_API_KEY"
      />
      <button onClick={handleSave}>保存</button>

      {/* モデル選択ドロップダウン */}
      <div className="model-selector">
        <label htmlFor="model-select">モデル選択:</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
        >
          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
          <option value="gemini-2.5-pro">gemini-2.5-pro</option>
        </select>
      </div>
    </div>
  );
};

export default ApiKeyInput;
