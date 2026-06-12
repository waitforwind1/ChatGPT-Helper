import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("content script collapses on outside click and does not render a minimize button", async () => {
  const source = await readFile("src/content.js", "utf8");

  assert.doesNotMatch(source, /data-action="collapse"/);
  assert.match(source, /document\.addEventListener\("pointerdown", handleOutsidePointerDown/);
  assert.match(source, /function handleOutsidePointerDown/);
});

test("content script restores the collapsed bubble anchor after closing the panel", async () => {
  const source = await readFile("src/content.js", "utf8");

  assert.match(source, /anchorLeft/);
  assert.match(source, /function rememberAnchorPosition/);
  assert.match(source, /function restoreAnchorPosition/);
  assert.match(source, /restoreAnchorPosition\(\);/);
});

test("content script uses the extension icon for the floating bubble", async () => {
  const source = await readFile("src/content.js", "utf8");

  assert.match(source, /chrome\.runtime\.getURL\("icons\/floating-icon\.png"\)/);
  assert.match(source, /class="cgfh-bubble-icon"/);
});

test("content script shows sequential thinking icons instead of a rectangular generating hint", async () => {
  const source = await readFile("src/content.js", "utf8");
  const styles = await readFile("styles/content.css", "utf8");

  assert.match(source, /chrome\.runtime\.getURL\("icons\/treat-bone\.png"\)/);
  assert.match(source, /chrome\.runtime\.getURL\("icons\/treat-food\.png"\)/);
  assert.match(source, /chrome\.runtime\.getURL\("icons\/treat-drumstick\.png"\)/);
  assert.match(source, /cgfh-thinking-treats/);
  assert.match(source, /thinkingIconUrls\[0\]/);
  assert.match(source, /thinkingIconUrls\[1\]/);
  assert.match(source, /thinkingIconUrls\[2\]/);
  assert.match(source, /function showThinking/);
  assert.match(source, /is-thinking/);
  assert.doesNotMatch(source, /class="cgfh-hint"/);
  assert.doesNotMatch(source, /function showHint/);
  assert.doesNotMatch(styles, /\.cgfh-treat\s*\{[^}]*background:/);
  assert.doesNotMatch(styles, /\.cgfh-inline-thinking-icon\s*\{[^}]*background:/);
  assert.match(styles, /animation-delay: 0\.32s/);
  assert.match(styles, /animation-delay: 0\.64s/);
});

test("content script uses shiba persona copy", async () => {
  const source = await readFile("src/content.js", "utf8");

  assert.match(source, /ChatGPT Helper/);
  assert.match(source, /\\u6c6a\\u6c6a \\u6c6a\\u6c6a\\u6c6a \\u6c6a\\u6c6a\\u6c6a\\u6c6a/);
  assert.match(source, /\\u67f4\\u72ac\\u52a9\\u624b/);
});

test("content script renders the shiba thinking message with three spinning icons", async () => {
  const source = await readFile("src/content.js", "utf8");
  const styles = await readFile("styles/content.css", "utf8");

  assert.match(source, /thinking: "\\u67f4\\u72ac\\u5c3e\\u5df4\\u9ad8\\u901f\\u65cb\\u8f6c\\u4e2d"/);
  assert.match(source, /icons\/treat-bone\.png/);
  assert.match(source, /icons\/treat-food\.png/);
  assert.match(source, /icons\/treat-drumstick\.png/);
  assert.match(source, /function renderThinkingContent/);
  assert.match(source, /cgfh-inline-thinking-icons/);
  assert.match(source, /thinkingIconUrls\[0\]/);
  assert.match(source, /thinkingIconUrls\[1\]/);
  assert.match(source, /thinkingIconUrls\[2\]/);
  assert.match(styles, /cgfh-inline-icon-spin/);
  assert.match(styles, /rotate: 360deg/);
});

test("content script can widen for dense responses", async () => {
  const source = await readFile("src/content.js", "utf8");

  assert.match(source, /WIDE_WIDTH/);
  assert.match(source, /adjustWidthForMessages/);
  assert.match(source, /containsWideContent/);
  assert.match(source, /getWideContentRequiredWidth/);
  assert.match(source, /element\.scrollWidth - element\.clientWidth/);
  assert.match(source, /state\.userWidth !== null/);
  assert.match(source, /function expandFromCurrentPosition/);
  assert.doesNotMatch(source, /const targetWidth = containsWideContent\(\) \? WIDE_WIDTH : EXPANDED_WIDTH/);
});

test("content script supports manual resizing on every edge", async () => {
  const source = await readFile("src/content.js", "utf8");

  assert.match(source, /cgfh-resize-handle is-left/);
  assert.match(source, /cgfh-resize-handle is-right/);
  assert.match(source, /cgfh-resize-handle is-top/);
  assert.match(source, /cgfh-resize-handle is-bottom/);
  assert.match(source, /function startResize/);
  assert.match(source, /function resizePanel/);
  assert.match(source, /resizeStartHeight/);
  assert.match(source, /userHeight/);
});

test("dragging the expanded panel does not force collapsed width", async () => {
  const source = await readFile("src/content.js", "utf8");

  assert.doesNotMatch(source, /widget\.style\.width = `\\$\\{COLLAPSED_SIZE\\}px`;[\s\S]*function stopDrag/);
});
