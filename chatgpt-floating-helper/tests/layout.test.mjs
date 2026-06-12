import test from "node:test";
import assert from "node:assert/strict";

import { fitWidgetToViewport } from "../src/layout.mjs";

test("fitWidgetToViewport keeps expanded panel inside the right edge", () => {
  const position = fitWidgetToViewport({
    left: 1180,
    top: 520,
    width: 360,
    height: 520,
    viewportWidth: 1280,
    viewportHeight: 720
  });

  assert.equal(position.left, 912);
  assert.equal(position.top, 192);
});

test("fitWidgetToViewport keeps panel visible near the left and top edges", () => {
  const position = fitWidgetToViewport({
    left: -20,
    top: -12,
    width: 360,
    height: 520,
    viewportWidth: 1280,
    viewportHeight: 720
  });

  assert.equal(position.left, 8);
  assert.equal(position.top, 8);
});
