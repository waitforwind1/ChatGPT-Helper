import test from "node:test";
import assert from "node:assert/strict";

import { renderAssistantContent } from "../src/format.mjs";

test("renderAssistantContent formats bold text, bullet lists, and blockquotes", () => {
  const html = renderAssistantContent([
    "- **Stack roots** referenced objects",
    "- **Static fields** referenced objects",
    "",
    "> **Simple view**: GC Roots are root references"
  ].join("\n"));

  assert.match(html, /<ul>/);
  assert.match(html, /<strong>Stack roots<\/strong>/);
  assert.match(html, /<li><strong>Static fields<\/strong> referenced objects<\/li>/);
  assert.match(html, /<blockquote><strong>Simple view<\/strong>: GC Roots are root references<\/blockquote>/);
  assert.doesNotMatch(html, /\*\*/);
});

test("renderAssistantContent formats markdown headings and inline code", () => {
  const html = renderAssistantContent([
    "### Usage",
    "",
    "Use `volatile` for visibility.",
    "",
    "#### Limits"
  ].join("\n"));

  assert.match(html, /<h3>Usage<\/h3>/);
  assert.match(html, /<code>volatile<\/code>/);
  assert.match(html, /<h4>Limits<\/h4>/);
  assert.doesNotMatch(html, /###/);
  assert.doesNotMatch(html, /`volatile`/);
});

test("renderAssistantContent formats fenced code blocks", () => {
  const html = renderAssistantContent([
    "```java",
    "volatile boolean running = true;",
    "```"
  ].join("\n"));

  assert.match(html, /<pre><code>volatile boolean running = true;<\/code><\/pre>/);
  assert.doesNotMatch(html, /```/);
});

test("renderAssistantContent formats markdown tables", () => {
  const html = renderAssistantContent([
    "| Feature | Meaning |",
    "| --- | --- |",
    "| volatile | visibility and ordering |",
    "| synchronized | mutual exclusion |"
  ].join("\n"));

  assert.match(html, /<table>/);
  assert.match(html, /<th>Feature<\/th>/);
  assert.match(html, /<td>visibility and ordering<\/td>/);
  assert.doesNotMatch(html, /\| --- \|/);
});

test("renderAssistantContent escapes unsafe html", () => {
  const html = renderAssistantContent("**safe** <script>alert(1)</script>");

  assert.match(html, /<strong>safe<\/strong>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
