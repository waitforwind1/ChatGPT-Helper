export function renderAssistantContent(value) {
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

export function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function escapeHtml(value) {
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
