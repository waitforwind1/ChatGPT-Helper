import {
  buildChatMessages,
  normalizeSettings,
  pruneSessionMessages,
  toChatCompletionsUrl
} from "./core.js";

const sessionByTab = new Map();
const REQUEST_TIMEOUT_MS = 30000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "汪，请求失败了，稍后再试一次。"
      });
    });

  return true;
});

async function handleMessage(message, sender) {
  if (!message || typeof message.type !== "string") {
    throw new Error("汪，柴犬没看懂这个请求。");
  }

  const tabId = sender.tab?.id ?? "global";

  if (message.type === "HELPER_ASK") {
    return askModel({
      tabId,
      question: message.question,
      selectedText: message.selectedText
    });
  }

  if (message.type === "HELPER_CLEAR_SESSION") {
    sessionByTab.delete(tabId);
    return { ok: true };
  }

  if (message.type === "HELPER_GET_SETTINGS") {
    return { ok: true, settings: await getSettingsForDisplay() };
  }

  throw new Error("汪，柴犬没看懂这个请求类型。");
}

async function askModel({ tabId, question, selectedText }) {
  const cleanQuestion = String(question ?? "").trim();
  if (!cleanQuestion) {
    throw new Error("汪，先丢一个问题给柴犬吧。");
  }

  const settings = await getSettings();
  if (!settings.apiKey) {
    throw new Error("汪，还没喂 API Key，请先打开设置页。");
  }

  const sessionMessages = sessionByTab.get(tabId) ?? [];
  const messages = buildChatMessages({
    question: cleanQuestion,
    selectedText,
    sessionMessages
  });

  const content = await requestChatCompletion(settings, messages);
  const nextSession = pruneSessionMessages(
    [
      ...sessionMessages,
      { role: "user", content: cleanQuestion },
      { role: "assistant", content }
    ],
    10
  );
  sessionByTab.set(tabId, nextSession);

  return { ok: true, answer: content };
}

async function getSettings() {
  const raw = await chrome.storage.sync.get([
    "apiKey",
    "baseUrl",
    "model",
    "temperature"
  ]);
  return normalizeSettings(raw);
}

async function getSettingsForDisplay() {
  const settings = await getSettings();
  return {
    ...settings,
    apiKeyConfigured: Boolean(settings.apiKey),
    apiKey: ""
  };
}

async function requestChatCompletion(settings, messages) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(toChatCompletionsUrl(settings.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature: settings.temperature
      }),
      signal: controller.signal
    });

    const payload = await readJson(response);
    if (!response.ok) {
      const detail = payload?.error?.message || response.statusText || "模型接口返回错误。";
      throw new Error(`汪，模型请求失败：${detail}`);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("汪，模型没有叼回可读内容。");
    }

    return content.trim();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("汪，模型请求超时了，请稍后重试或换用更快的模型。");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
