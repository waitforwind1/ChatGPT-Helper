export const DEFAULT_SETTINGS = Object.freeze({
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  temperature: 0.2
});

const SYSTEM_PROMPT = [
  "你是一只拟人化的柴犬解释助手，运行在 ChatGPT 页面旁边。",
  "你的任务是像聪明、亲切但不啰嗦的柴犬一样，帮助用户快速理解当前输出。",
  "回答要简洁、准确、分点说明；可以轻微使用柴犬语气，但不要影响专业性。",
  "如果用户提供了选中文本，优先解释选中文本；不要替用户改写整篇内容，除非用户明确要求。",
  "不要假装拥有完整页面历史；只能基于用户问题、选中文本和本次临时会话回答。"
].join("\n");

export function normalizeSettings(raw = {}) {
  const temperature = Number.parseFloat(raw.temperature);

  return {
    apiKey: String(raw.apiKey ?? DEFAULT_SETTINGS.apiKey).trim(),
    baseUrl: stripTrailingSlash(
      String(raw.baseUrl ?? DEFAULT_SETTINGS.baseUrl).trim() || DEFAULT_SETTINGS.baseUrl
    ),
    model: String(raw.model ?? DEFAULT_SETTINGS.model).trim() || DEFAULT_SETTINGS.model,
    temperature: Number.isFinite(temperature) ? temperature : DEFAULT_SETTINGS.temperature
  };
}

export function toChatCompletionsUrl(baseUrl) {
  const normalized = stripTrailingSlash(baseUrl || DEFAULT_SETTINGS.baseUrl);
  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }

  return `${normalized}/chat/completions`;
}

export function buildChatMessages({ question, selectedText = "", sessionMessages = [] }) {
  const trimmedQuestion = String(question ?? "").trim();
  const trimmedSelection = limitText(String(selectedText ?? "").trim(), 3000);
  const promptParts = [];

  if (trimmedSelection) {
    promptParts.push(`用户选中的 ChatGPT 输出片段：\n${trimmedSelection}`);
  }

  promptParts.push(`用户的问题：\n${trimmedQuestion}`);

  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...pruneSessionMessages(sessionMessages, 8),
    { role: "user", content: promptParts.join("\n\n") }
  ];
}

export function pruneSessionMessages(messages, maxMessages = 10) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => {
      return (
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim()
      );
    })
    .slice(-maxMessages)
    .map((message) => ({
      role: message.role,
      content: limitText(message.content.trim(), 3000)
    }));
}

export function limitText(text, maxLength) {
  const value = String(text ?? "");
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n...[内容已截断]`;
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}
