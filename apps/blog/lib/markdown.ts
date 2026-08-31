/**
 * Minimal markdown renderer for article bodies.
 *
 * The seed content uses a small, well-defined subset of markdown:
 * headings, paragraphs, lists, blockquotes, inline code, code blocks,
 * bold, italics, and horizontal rules. We render these to safe HTML
 * without pulling in a heavy dependency.
 *
 * The output is intentionally conservative: only the supported subset is
 * transformed, and everything else is escaped.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(value: string): string | null {
  const decoded = value.replace(/&amp;/g, "&").trim();
  const internalPath = decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.startsWith("/\\");
  if (internalPath || decoded.startsWith("#") || decoded.startsWith("mailto:")) return escapeHtml(decoded);
  try {
    const url = new URL(decoded);
    return url.protocol === "https:" || url.protocol === "http:" ? escapeHtml(decoded) : null;
  } catch {
    return null;
  }
}

function inline(text: string): string {
  let out = escapeHtml(text);
  // Inline code
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    const safe = safeHref(href);
    return safe ? `<a href="${safe}">${label}</a>` : label;
  });
  return out;
}

/**
 * Render a markdown string to HTML. The output is safe for use with
 * dangerouslySetInnerHTML because all raw text is escaped and only the
 * supported constructs are converted to tags.
 */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listBuffer: string[] = [];

  function flushList() {
    if (listType && listBuffer.length) {
      html.push(`<${listType}>`);
      html.push(...listBuffer);
      html.push(`</${listType}>`);
    }
    listType = null;
    listBuffer = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushList();
      continue;
    }

    // Headings
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      flushList();
      html.push(`<h1>${inline(h1[1])}</h1>`);
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      flushList();
      html.push(`<h2>${inline(h2[1])}</h2>`);
      continue;
    }
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      flushList();
      html.push(`<h3>${inline(h3[1])}</h3>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      html.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listBuffer.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    // Ordered list
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listBuffer.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line)) {
      flushList();
      html.push("<hr />");
      continue;
    }

    // Paragraph
    flushList();
    html.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }

  return html.join("\n");
}
