const apiStatus = document.querySelector("#api-status");
const openOptions = document.querySelector("#open-options");
const openChatGpt = document.querySelector("#open-chatgpt");

init();

openOptions.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

openChatGpt.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://chatgpt.com/" });
});

async function init() {
  const settings = await chrome.storage.sync.get({ apiKey: "" });
  apiStatus.textContent = settings.apiKey ? "汪，API Key 已就位" : "汪，还没喂 API Key";
}
