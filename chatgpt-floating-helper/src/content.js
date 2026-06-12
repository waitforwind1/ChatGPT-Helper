(function initChatGptFloatingHelper() {
  if (window.__chatGptFloatingHelperLoaded) {
    return;
  }
  window.__chatGptFloatingHelperLoaded = true;

  const TEXT = {
    openTitle: "\u53eb\u9192\u67f4\u72ac\u52a9\u624b",
    title: "\u67f4\u72ac\u52a9\u624b",
    session: "\u67f4\u72ac\u53ea\u8bb0\u5f97\u672c\u6b21\u9875\u9762",
    clear: "\u6e05\u7a7a\u72d7\u7a9d",
    clearTitle: "\u6e05\u7a7a\u67f4\u72ac\u7684\u672c\u6b21\u5c0f\u8bb0\u5fc6",
    placeholder: "\u6c6a\u6c6a \u6c6a\u6c6a\u6c6a \u6c6a\u6c6a\u6c6a\u6c6a",
    selection: "\u67f4\u72ac\u4f1a\u53fc\u6765\u4f60\u9009\u4e2d\u7684\u6587\u5b57",
    send: "\u5f00\u95ee",
    thinking: "\u67f4\u72ac\u5c3e\u5df4\u9ad8\u901f\u65cb\u8f6c\u4e2d",
    failed: "\u6c6a\uff0c\u521a\u624d\u6ca1\u95ee\u6210\u3002",
    retryFailed: "\u6c6a\uff0c\u5931\u8d25\u4e86\uff0c\u518d\u8bd5\u4e00\u6b21\u5427\u3002",
    empty: "\u67f4\u72acsensei\u5728\u7ebf\u7b54\u7591",
    you: "\u4f60",
    assistant: "\u67f4\u72ac",
    busy: "\u67f4\u72ac\u6b63\u5728\u8dd1\u53bb\u95ee\u6a21\u578b",
    truncated: "\n...[\u5185\u5bb9\u5df2\u622a\u65ad]"
  };

  const state = {
    mode: "collapsed",
    isDragging: false,
    didDrag: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragStartX: 0,
    dragStartY: 0,
    dragSource: "",
    isResizing: false,
    resizeEdge: "",
    resizeStartX: 0,
    resizeStartY: 0,
    resizeStartLeft: 0,
    resizeStartTop: 0,
    resizeStartWidth: 0,
    resizeStartHeight: 0,
    userWidth: null,
    userHeight: null,
    anchorLeft: null,
    anchorTop: null,
    lastGenerating: false,
    messages: []
  };
  const EXPANDED_WIDTH = 360;
  const WIDE_WIDTH = 640;
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 760;
  const MIN_HEIGHT = 220;
  const COLLAPSED_SIZE = 58;
  const VIEWPORT_MARGIN = 8;
  const bubbleIconUrl = chrome.runtime.getURL("icons/floating-icon.png");
  const thinkingIconUrls = [
    chrome.runtime.getURL("icons/treat-bone.png"),
    chrome.runtime.getURL("icons/treat-food.png"),
    chrome.runtime.getURL("icons/treat-drumstick.png")
  ];

  const host = document.createElement("div");
  host.id = "cgfh-host";
  host.innerHTML = `
    <div class="cgfh-widget is-collapsed" role="dialog" aria-label="ChatGPT Helper">
      <button class="cgfh-bubble" type="button" title="${TEXT.openTitle}">
        <img class="cgfh-bubble-icon" src="${bubbleIconUrl}" alt="" aria-hidden="true">
        <span class="cgfh-thinking-treats" aria-hidden="true">
          <img class="cgfh-treat is-one" src="${thinkingIconUrls[0]}" alt="">
          <img class="cgfh-treat is-two" src="${thinkingIconUrls[1]}" alt="">
          <img class="cgfh-treat is-three" src="${thinkingIconUrls[2]}" alt="">
        </span>
      </button>
      <section class="cgfh-panel" aria-live="polite">
        <div class="cgfh-resize-handle is-left" data-resize-edge="left" title="拖动调整宽度"></div>
        <div class="cgfh-resize-handle is-right" data-resize-edge="right" title="拖动调整宽度"></div>
        <div class="cgfh-resize-handle is-top" data-resize-edge="top" title="拖动调整高度"></div>
        <div class="cgfh-resize-handle is-bottom" data-resize-edge="bottom" title="拖动调整高度"></div>
        <header class="cgfh-header">
          <div>
            <strong>${TEXT.title}</strong>
            <span class="cgfh-status">${TEXT.session}</span>
          </div>
          <div class="cgfh-actions">
            <button type="button" data-action="clear" title="${TEXT.clearTitle}">${TEXT.clear}</button>
          </div>
        </header>
        <main class="cgfh-log"></main>
        <form class="cgfh-form">
          <textarea placeholder="${TEXT.placeholder}" rows="2"></textarea>
          <div class="cgfh-form-row">
            <span class="cgfh-selection">${TEXT.selection}</span>
            <button type="submit">${TEXT.send}</button>
          </div>
        </form>
      </section>
    </div>
  `;

  document.documentElement.appendChild(host);

  const widget = host.querySelector(".cgfh-widget");
  const panel = host.querySelector(".cgfh-panel");
  const bubble = host.querySelector(".cgfh-bubble");
  const header = host.querySelector(".cgfh-header");
  const log = host.querySelector(".cgfh-log");
  const form = host.querySelector(".cgfh-form");
  const textarea = host.querySelector("textarea");
  const status = host.querySelector(".cgfh-status");
  const resizeHandles = host.querySelectorAll(".cgfh-resize-handle");

  bubble.addEventListener("click", (event) => {
    if (state.didDrag) {
      event.preventDefault();
      state.didDrag = false;
      return;
    }
    expand();
  });
  bubble.addEventListener("pointerdown", startDrag);
  host.querySelector('[data-action="clear"]').addEventListener("click", clearSession);
  form.addEventListener("submit", submitQuestion);
  textarea.addEventListener("keydown", handleTextareaKeydown);
  header.addEventListener("pointerdown", startDrag);
  resizeHandles.forEach((handle) => handle.addEventListener("pointerdown", startResize));
  document.addEventListener("pointerdown", handleOutsidePointerDown, true);
  window.addEventListener("pointermove", drag);
  window.addEventListener("pointerup", stopDrag);

  renderMessages();
  observeGeneratingState();

  function expand() {
    rememberAnchorPosition();
    expandFromCurrentPosition(state.userWidth ?? EXPANDED_WIDTH);
    if (state.userHeight === null) {
      panel.style.height = "";
    } else {
      applyPanelHeight(state.userHeight);
    }
    state.mode = "expanded";
    widget.classList.remove("is-collapsed", "is-thinking");
    widget.classList.add("is-expanded");
    textarea.focus();
  }

  function collapse() {
    state.mode = "collapsed";
    widget.classList.add("is-collapsed");
    widget.classList.remove("is-expanded");
    if (state.lastGenerating) {
      widget.classList.add("is-thinking");
    }
    restoreAnchorPosition();
  }

  function showThinking() {
    if (state.mode === "expanded") {
      return;
    }
    state.mode = "collapsed";
    widget.classList.add("is-collapsed", "is-thinking");
    widget.classList.remove("is-expanded");
    restoreAnchorPosition();
  }

  function hideThinking() {
    widget.classList.remove("is-thinking");
  }

  async function submitQuestion(event) {
    event.preventDefault();
    const question = textarea.value.trim();
    if (!question) {
      return;
    }

    const selectedText = getSelectionText() || getLatestAssistantText();
    textarea.value = "";
    state.messages.push({ role: "user", content: question });
    state.messages.push({ role: "assistant", content: TEXT.thinking });
    renderMessages();
    setBusy(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "HELPER_ASK",
        question,
        selectedText
      });
      if (!response?.ok) {
        throw new Error(response?.error || TEXT.failed);
      }
      state.messages[state.messages.length - 1] = {
        role: "assistant",
        content: response.answer
      };
    } catch (error) {
      state.messages[state.messages.length - 1] = {
        role: "assistant",
        content: error instanceof Error ? error.message : TEXT.retryFailed
      };
    } finally {
      setBusy(false);
      renderMessages();
    }
  }

  function handleTextareaKeydown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    form.requestSubmit();
  }

  function handleOutsidePointerDown(event) {
    if (state.mode === "collapsed" || host.contains(event.target)) {
      return;
    }
    collapse();
  }

  async function clearSession() {
    state.messages = [];
    renderMessages();
    await chrome.runtime.sendMessage({ type: "HELPER_CLEAR_SESSION" });
  }

  function renderMessages() {
    if (state.messages.length === 0) {
      log.innerHTML = `<div class="cgfh-empty">${TEXT.empty}</div>`;
      return;
    }

    log.innerHTML = state.messages
      .map((message) => {
        const role = message.role === "user" ? TEXT.you : TEXT.assistant;
        const body =
          message.role === "assistant"
            ? renderAssistantContent(message.content)
            : `<p>${escapeHtml(message.content)}</p>`;
        return `
          <article class="cgfh-message is-${message.role}">
            <span>${role}</span>
            <div class="cgfh-message-body">${body}</div>
          </article>
        `;
      })
      .join("");
    adjustWidthForMessages();
    log.scrollTop = log.scrollHeight;
  }

  function adjustWidthForMessages() {
    if (state.mode !== "expanded") {
      return;
    }
    if (state.userWidth !== null) {
      return;
    }
    const requiredWidth = getWideContentRequiredWidth();
    if (requiredWidth > 0) {
      expandFromCurrentPosition(requiredWidth);
    }
  }

  function containsWideContent() {
    return Boolean(log.querySelector("table, pre"));
  }

  function getWideContentRequiredWidth() {
    if (!containsWideContent()) {
      return 0;
    }
    const widgetRect = widget.getBoundingClientRect();
    let requiredWidth = widgetRect.width;
    const candidates = log.querySelectorAll(".cgfh-table-wrap, pre");

    for (const element of candidates) {
      const overflow = element.scrollWidth - element.clientWidth;
      if (overflow > 8) {
        requiredWidth = Math.max(requiredWidth, widgetRect.width + overflow + 24);
      }
    }

    if (requiredWidth <= widgetRect.width + 8) {
      return 0;
    }

    const viewportMaxWidth = window.innerWidth - 2 * VIEWPORT_MARGIN;
    return Math.min(requiredWidth, WIDE_WIDTH, MAX_WIDTH, viewportMaxWidth);
  }

  function setBusy(isBusy) {
    textarea.disabled = isBusy;
    form.querySelector('button[type="submit"]').disabled = isBusy;
    status.textContent = isBusy ? TEXT.busy : TEXT.session;
  }

  function getSelectionText() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    return limitText(text, 3000);
  }

  function getLatestAssistantText() {
    const candidates = Array.from(
      document.querySelectorAll('[data-message-author-role="assistant"], article')
    );
    const latest = candidates.at(-1);
    return limitText(latest?.innerText?.trim() || "", 3000);
  }

  function observeGeneratingState() {
    const update = throttle(() => {
      const generating = isChatGptGenerating();
      if (generating && !state.lastGenerating) {
        showThinking();
      }
      if (!generating && state.lastGenerating) {
        hideThinking();
      }
      state.lastGenerating = generating;
    }, 800);

    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "data-testid", "disabled"]
    });
  }

  function isChatGptGenerating() {
    const stopButton = document.querySelector(
      'button[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="停止"]'
    );
    const composerBusy = document.querySelector('[aria-busy="true"]');
    return Boolean(stopButton || composerBusy);
  }

  function startDrag(event) {
    if (event.target.closest(".cgfh-actions button")) {
      return;
    }
    state.isDragging = true;
    state.didDrag = false;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    state.dragSource = event.currentTarget === bubble ? "bubble" : "panel";
    const rect = widget.getBoundingClientRect();
    state.dragOffsetX = event.clientX - rect.left;
    state.dragOffsetY = event.clientY - rect.top;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function drag(event) {
    if (state.isResizing) {
      resizePanel(event);
      return;
    }
    if (!state.isDragging) {
      return;
    }
    if (Math.abs(event.clientX - state.dragStartX) + Math.abs(event.clientY - state.dragStartY) > 4) {
      state.didDrag = true;
    }
    const rect = widget.getBoundingClientRect();
    const left = clamp(
      event.clientX - state.dragOffsetX,
      VIEWPORT_MARGIN,
      window.innerWidth - rect.width - VIEWPORT_MARGIN
    );
    const top = clamp(
      event.clientY - state.dragOffsetY,
      VIEWPORT_MARGIN,
      window.innerHeight - rect.height - VIEWPORT_MARGIN
    );
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
  }

  function stopDrag() {
    if (state.isResizing) {
      state.isResizing = false;
      state.resizeEdge = "";
      return;
    }
    if (state.isDragging && state.dragSource === "bubble") {
      rememberAnchorPosition();
    }
    state.isDragging = false;
    state.dragSource = "";
  }

  function startResize(event) {
    if (state.mode !== "expanded") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const rect = widget.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    state.isResizing = true;
    state.resizeEdge = event.currentTarget.dataset.resizeEdge;
    state.resizeStartX = event.clientX;
    state.resizeStartY = event.clientY;
    state.resizeStartLeft = rect.left;
    state.resizeStartTop = rect.top;
    state.resizeStartWidth = rect.width;
    state.resizeStartHeight = panelRect.height;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function resizePanel(event) {
    const deltaX = event.clientX - state.resizeStartX;
    const deltaY = event.clientY - state.resizeStartY;
    const viewportMaxWidth = window.innerWidth - 2 * VIEWPORT_MARGIN;
    const maxWidth = Math.min(MAX_WIDTH, viewportMaxWidth);
    const maxHeight = window.innerHeight - 2 * VIEWPORT_MARGIN;
    const isHorizontal = state.resizeEdge === "left" || state.resizeEdge === "right";
    const isVertical = state.resizeEdge === "top" || state.resizeEdge === "bottom";
    let nextLeft = state.resizeStartLeft;
    let nextTop = state.resizeStartTop;
    let nextWidth = state.resizeStartWidth;
    let nextHeight = state.resizeStartHeight;

    if (state.resizeEdge === "right") {
      nextWidth = clamp(state.resizeStartWidth + deltaX, MIN_WIDTH, maxWidth);
      nextWidth = Math.min(nextWidth, window.innerWidth - state.resizeStartLeft - VIEWPORT_MARGIN);
    } else if (state.resizeEdge === "left") {
      nextWidth = clamp(state.resizeStartWidth - deltaX, MIN_WIDTH, maxWidth);
      nextLeft = state.resizeStartLeft + state.resizeStartWidth - nextWidth;
      nextLeft = clamp(nextLeft, VIEWPORT_MARGIN, state.resizeStartLeft + state.resizeStartWidth - MIN_WIDTH);
      nextWidth = state.resizeStartLeft + state.resizeStartWidth - nextLeft;
    } else if (state.resizeEdge === "bottom") {
      nextHeight = clamp(state.resizeStartHeight + deltaY, MIN_HEIGHT, maxHeight);
      nextHeight = Math.min(nextHeight, window.innerHeight - state.resizeStartTop - VIEWPORT_MARGIN);
    } else if (state.resizeEdge === "top") {
      nextHeight = clamp(state.resizeStartHeight - deltaY, MIN_HEIGHT, maxHeight);
      nextTop = state.resizeStartTop + state.resizeStartHeight - nextHeight;
      nextTop = clamp(nextTop, VIEWPORT_MARGIN, state.resizeStartTop + state.resizeStartHeight - MIN_HEIGHT);
      nextHeight = state.resizeStartTop + state.resizeStartHeight - nextTop;
    }

    widget.style.left = `${nextLeft}px`;
    widget.style.top = `${nextTop}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    if (isHorizontal) {
      widget.style.width = `${nextWidth}px`;
      state.userWidth = nextWidth;
    }
    if (isVertical) {
      applyPanelHeight(nextHeight);
      state.userHeight = nextHeight;
    }
  }

  function rememberAnchorPosition() {
    const rect = widget.getBoundingClientRect();
    state.anchorLeft = clamp(rect.left, VIEWPORT_MARGIN, window.innerWidth - COLLAPSED_SIZE - VIEWPORT_MARGIN);
    state.anchorTop = clamp(rect.top, VIEWPORT_MARGIN, window.innerHeight - COLLAPSED_SIZE - VIEWPORT_MARGIN);
  }

  function restoreAnchorPosition() {
    if (state.anchorLeft === null || state.anchorTop === null) {
      return;
    }
    const left = clamp(state.anchorLeft, VIEWPORT_MARGIN, window.innerWidth - COLLAPSED_SIZE - VIEWPORT_MARGIN);
    const top = clamp(state.anchorTop, VIEWPORT_MARGIN, window.innerHeight - COLLAPSED_SIZE - VIEWPORT_MARGIN);
    widget.style.left = `${left}px`;
    widget.style.top = `${top}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    widget.style.width = `${COLLAPSED_SIZE}px`;
  }

  function applyPanelHeight(height) {
    const maxHeight = window.innerHeight - 2 * VIEWPORT_MARGIN;
    panel.style.height = `${clamp(height, MIN_HEIGHT, maxHeight)}px`;
  }

  function expandFromCurrentPosition(targetWidth) {
    const rect = widget.getBoundingClientRect();
    const viewportMaxWidth = window.innerWidth - 2 * VIEWPORT_MARGIN;
    const nextWidth = Math.min(Math.max(targetWidth, MIN_WIDTH), MAX_WIDTH, viewportMaxWidth);
    const currentRight = rect.left + rect.width;
    let nextLeft = rect.left;

    if (rect.left + nextWidth > window.innerWidth - VIEWPORT_MARGIN) {
      nextLeft = currentRight - nextWidth;
    }

    nextLeft = clamp(nextLeft, VIEWPORT_MARGIN, window.innerWidth - nextWidth - VIEWPORT_MARGIN);
    const nextHeight =
      state.mode === "collapsed"
        ? Math.min(620, window.innerHeight - 40)
        : Math.min(rect.height, window.innerHeight - 2 * VIEWPORT_MARGIN);
    const nextTop = clamp(rect.top, VIEWPORT_MARGIN, window.innerHeight - nextHeight - VIEWPORT_MARGIN);

    widget.style.left = `${nextLeft}px`;
    widget.style.top = `${nextTop}px`;
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    widget.style.width = `${nextWidth}px`;
  }

  function renderAssistantContent(value) {
    if (String(value ?? "") === TEXT.thinking) {
      return renderThinkingContent();
    }

    const lines = String(value ?? "").split(/\r?\n/);
    const chunks = [];
    let listItems = [];
    let codeLines = [];
    let tableRows = [];
    let inCodeBlock = false;

    const flushList = () => {
      if (listItems.length === 0) {
        return;
      }
      chunks.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
      listItems = [];
    };

    const flushCode = () => {
      if (codeLines.length === 0) {
        return;
      }
      chunks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      codeLines = [];
    };

    const flushTable = () => {
      if (tableRows.length < 2 || !isTableDivider(tableRows[1])) {
        tableRows = [];
        return;
      }
      const header = splitTableRow(tableRows[0]);
      const body = tableRows.slice(2).map(splitTableRow);
      chunks.push([
        '<div class="cgfh-table-wrap"><table>',
        `<thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`,
        `<tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
        "</table></div>"
      ].join(""));
      tableRows = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("```")) {
        flushList();
        flushTable();
        if (inCodeBlock) {
          flushCode();
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }
      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }
      if (!trimmed) {
        flushList();
        flushTable();
        continue;
      }
      if (isTableRow(trimmed)) {
        flushList();
        tableRows.push(trimmed);
        continue;
      }
      if (trimmed.startsWith("- ")) {
        flushTable();
        listItems.push(renderInline(trimmed.slice(2)));
        continue;
      }
      flushList();
      flushTable();
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = Math.min(4, Math.max(2, headingMatch[1].length));
        chunks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
        continue;
      }
      if (trimmed.startsWith(">")) {
        chunks.push(`<blockquote>${renderInline(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
        continue;
      }
      chunks.push(`<p>${renderInline(trimmed)}</p>`);
    }

    flushList();
    flushTable();
    flushCode();
    return chunks.join("");
  }

  function renderThinkingContent() {
    return `
      <div class="cgfh-inline-thinking">
        <span>${TEXT.thinking}</span>
        <span class="cgfh-inline-thinking-icons" aria-hidden="true">
          <img class="cgfh-inline-thinking-icon is-one" src="${thinkingIconUrls[0]}" alt="">
          <img class="cgfh-inline-thinking-icon is-two" src="${thinkingIconUrls[1]}" alt="">
          <img class="cgfh-inline-thinking-icon is-three" src="${thinkingIconUrls[2]}" alt="">
        </span>
      </div>
    `;
  }

  function renderInline(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function isTableRow(value) {
    return value.startsWith("|") && value.endsWith("|") && value.slice(1, -1).includes("|");
  }

  function isTableDivider(value) {
    return splitTableRow(value).every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
  }

  function splitTableRow(value) {
    return value
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function limitText(value, maxLength) {
    const text = String(value ?? "");
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}${TEXT.truncated}`;
  }

  function throttle(fn, wait) {
    let timer = 0;
    return () => {
      if (timer) {
        return;
      }
      timer = window.setTimeout(() => {
        timer = 0;
        fn();
      }, wait);
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
})();
