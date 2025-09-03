import {
  GoogleGenAI,
  type Content,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/genai";

// Messageインターフェースは変更ありません
interface Message {
  role: "user" | "model";
  text: string;
}

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export async function sendToGeminiWithContext(
  messages: Message[],
  systemInstructionText: string,
  modelName: string
): Promise<string> {
  const apiKey = localStorage.getItem("gemini_api_key");
  const systemInstruction = {
    parts: [
      {
        text: systemInstructionText,
      },
    ],
  };
  if (!apiKey) {
    return "⚠️ APIキーが未設定です。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents: Content[] = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        safetySettings: safetySettings,
        systemInstruction: systemInstruction,
      },
    });

    return response.text ?? "⚠️ レスポンスが空でした。"; // ✅ ここで結果を返す
  } catch (err) {
    console.error("Gemini API error:", err);
    if (err instanceof Error) {
      return `⚠️ エラー: ${err.message}`;
    }
    return "⚠️ 不明なエラーが発生しました。";
  }
}
