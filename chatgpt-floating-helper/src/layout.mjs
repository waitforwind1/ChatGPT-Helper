export function fitWidgetToViewport({
  left,
  top,
  width,
  height,
  viewportWidth,
  viewportHeight,
  margin = 8
}) {
  return {
    left: clamp(left, margin, Math.max(margin, viewportWidth - width - margin)),
    top: clamp(top, margin, Math.max(margin, viewportHeight - height - margin))
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
