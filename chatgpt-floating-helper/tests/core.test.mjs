import test from "node:test";
import assert from "node:assert/strict";

import {
  buildChatMessages,
  normalizeSettings,
  pruneSessionMessages,
  toChatCompletionsUrl
} from "../src/core.js";

test("normalizeSettings supplies fast defaults and trims user input", () => {
  const settings = normalizeSettings({
    apiKey: "  sk-test  ",
    baseUrl: " https://api.example.com/v1/ ",
    model: "  quick-model  ",
    temperature: "0.25"
  });

  assert.deepEqual(settings, {
    apiKey: "sk-test",
    baseUrl: "https://api.example.com/v1",
    model: "quick-model",
    temperature: 0.25
  });
});

test("normalizeSettings falls back to safe defaults", () => {
  const settings = normalizeSettings({
    temperature: "not-a-number"
  });

  assert.equal(settings.baseUrl, "https://api.openai.com/v1");
  assert.equal(settings.model, "gpt-4.1-mini");
  assert.equal(settings.temperature, 0.2);
});

test("toChatCompletionsUrl accepts compatible API base URLs", () => {
  assert.equal(
    toChatCompletionsUrl("https://api.example.com/v1/"),
    "https://api.example.com/v1/chat/completions"
  );
  assert.equal(
    toChatCompletionsUrl("https://api.example.com/v1/chat/completions"),
    "https://api.example.com/v1/chat/completions"
  );
});

test("buildChatMessages includes selected text and shiba persona", () => {
  const messages = buildChatMessages({
    question: "What does this mean?",
    selectedText: "Residual connections help gradients flow.",
    sessionMessages: [
      { role: "user", content: "previous question" },
      { role: "assistant", content: "previous answer" }
    ]
  });

  assert.equal(messages[0].role, "system");
  assert.match(messages[0].content, /柴犬解释助手/);
  assert.deepEqual(messages.slice(1, 3), [
    { role: "user", content: "previous question" },
    { role: "assistant", content: "previous answer" }
  ]);
  assert.equal(messages.at(-1).role, "user");
  assert.match(messages.at(-1).content, /Residual connections/);
  assert.match(messages.at(-1).content, /What does this mean/);
});

test("pruneSessionMessages keeps the newest temporary conversation only", () => {
  const messages = Array.from({ length: 14 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `message-${index}`
  }));

  const pruned = pruneSessionMessages(messages, 6);

  assert.equal(pruned.length, 6);
  assert.equal(pruned[0].content, "message-8");
  assert.equal(pruned.at(-1).content, "message-13");
});
