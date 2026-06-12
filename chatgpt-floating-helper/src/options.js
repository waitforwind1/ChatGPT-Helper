const form = document.querySelector("#settings-form");
const status = document.querySelector("#status");

const fields = {
  apiKey: document.querySelector("#apiKey"),
  baseUrl: document.querySelector("#baseUrl"),
  model: document.querySelector("#model"),
  temperature: document.querySelector("#temperature")
};

loadSettings();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const baseUrl = stripTrailingSlash(fields.baseUrl.value.trim() || "https://api.openai.com/v1");
  const granted = await ensureHostPermission(baseUrl);
  if (!granted) {
    showStatus("汪，柴犬没有拿到这个 API 地址权限，设置没保存。");
    return;
  }

  await chrome.storage.sync.set({
    apiKey: fields.apiKey.value.trim(),
    baseUrl,
    model: fields.model.value.trim() || "gpt-4.1-mini",
    temperature: Number.parseFloat(fields.temperature.value || "0.2")
  });
  showStatus("汪，保存好了。刷新 ChatGPT 页面后柴犬就用新配置。");
});

document.querySelector("#reset").addEventListener("click", () => {
  fields.baseUrl.value = "https://api.openai.com/v1";
  fields.model.value = "gpt-4.1-mini";
  fields.temperature.value = "0.2";
  showStatus("汪，默认参数叼回来了，保存后生效。");
});

async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    temperature: 0.2
  });

  fields.apiKey.value = settings.apiKey;
  fields.baseUrl.value = settings.baseUrl;
  fields.model.value = settings.model;
  fields.temperature.value = settings.temperature;
}

function showStatus(message) {
  status.textContent = message;
  window.setTimeout(() => {
    status.textContent = "";
  }, 3500);
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

async function ensureHostPermission(baseUrl) {
  const pattern = toOriginPattern(baseUrl);
  if (!pattern || pattern === "https://api.openai.com/*") {
    return true;
  }

  const hasPermission = await chrome.permissions.contains({ origins: [pattern] });
  if (hasPermission) {
    return true;
  }

  return chrome.permissions.request({ origins: [pattern] });
}

function toOriginPattern(baseUrl) {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }
    return `${url.origin}/*`;
  } catch {
    return "";
  }
}
