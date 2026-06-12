import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("manifest declares MV3 extension entry points for ChatGPT pages", async () => {
  const manifest = JSON.parse(await readFile("manifest.json", "utf8"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "ChatGPT Helper");
  assert.equal(manifest.action.default_title, "ChatGPT Helper");
  assert.equal(manifest.background.service_worker, "src/background.js");
  assert.equal(manifest.background.type, "module");
  assert.deepEqual(manifest.content_scripts[0].matches, [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*"
  ]);
  assert.deepEqual(manifest.host_permissions, ["https://api.openai.com/*"]);
  assert.ok(manifest.optional_host_permissions.includes("https://*/*"));
  assert.ok(manifest.permissions.includes("storage"));
  assert.equal(manifest.options_ui.page, "options.html");
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.deepEqual(manifest.icons, {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  });
  assert.deepEqual(manifest.action.default_icon, manifest.icons);
  assert.deepEqual(manifest.web_accessible_resources, [
    {
      resources: [
        "icons/floating-icon.png",
        "icons/treat-bone.png",
        "icons/treat-food.png",
        "icons/treat-drumstick.png"
      ],
      matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
    }
  ]);
});
