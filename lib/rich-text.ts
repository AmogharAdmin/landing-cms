const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "H2",
  "H3",
  "I",
  "LI",
  "OL",
  "P",
  "S",
  "SPAN",
  "STRIKE",
  "STRONG",
  "U",
  "UL",
]);

const ALLOWED_ALIGN = new Set(["left", "center", "right", "justify"]);
const ALLOWED_FONT_SIZE = /^[\d.]+(?:px|rem|em|%)$/i;
const ALLOWED_FONT_WEIGHT = /^(normal|bold|bolder|lighter|[1-9]00)$/i;
const ALLOWED_SPACING = /^-?[\d.]+(?:px|rem|em|%)$/i;
/** Safe CSS font-family stacks (no url(), expression, or braces). */
const ALLOWED_FONT_FAMILY = /^[\w\s,"'\-]+$/i;

/** Map legacy <font size="1-7"> values to CSS px (HTML font size 7 ≈ xx-large). */
const LEGACY_FONT_SIZE_PX: Record<string, string> = {
  "1": "10px",
  "2": "13px",
  "3": "16px",
  "4": "18px",
  "5": "24px",
  "6": "32px",
  "7": "48px",
};

function isBoldFontWeight(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === "bold" || normalized === "bolder") return true;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 600;
}

function isNormalFontWeight(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === "normal" || normalized === "lighter") return true;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 && numeric < 600;
}

/** Prefer semantic <strong>/<b> for bold spans; keep explicit normal weight for unbold. */
function normalizeFontWeightSpans(root: ParentNode) {
  root.querySelectorAll("span").forEach((node) => {
    const span = node as HTMLElement;
    const weight = (span.style.fontWeight || "").trim();
    if (!weight) return;

    if (isBoldFontWeight(weight)) {
      const strong = document.createElement("strong");
      // Preserve other allowed styles (e.g. font-size) on a nested span if needed.
      const size = span.style.fontSize;
      if (size) {
        const sized = document.createElement("span");
        sized.style.fontSize = size;
        while (span.firstChild) sized.appendChild(span.firstChild);
        strong.appendChild(sized);
      } else {
        while (span.firstChild) strong.appendChild(span.firstChild);
      }
      span.replaceWith(strong);
      return;
    }

    if (isNormalFontWeight(weight)) {
      // Keep font-weight: normal so text can escape a bold parent/container.
      span.style.fontWeight = "normal";
    }
  });
}

function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

export function plainTextFromHtml(html: string): string {
  return decodeBasicEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h2|h3|blockquote)>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function countWords(html: string): number {
  const text = plainTextFromHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function isSafeCssColor(value: string) {
  if (!value || /url\s*\(|expression\s*\(|\/\*|\*\//i.test(value)) return false;
  return /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\))$/i.test(value);
}

function sanitizeElementAttributes(element: HTMLElement) {
  const tag = element.tagName;
  const keep = new Map<string, string>();

  if (tag === "A") {
    const href = element.getAttribute("href")?.trim() || "";
    if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href)) keep.set("href", href);
    if (/^https?:\/\//i.test(href)) {
      keep.set("target", "_blank");
      keep.set("rel", "noopener noreferrer");
    }
  }

  const align = (element.getAttribute("align") || "").toLowerCase();
  if (ALLOWED_ALIGN.has(align)) keep.set("align", align);

  const style = element.getAttribute("style") || "";
  const styleParts: string[] = [];
  const alignMatch = style.match(/text-align\s*:\s*(left|center|right|justify)/i);
  if (alignMatch) styleParts.push(`text-align: ${alignMatch[1].toLowerCase()}`);
  const sizeMatch = style.match(/font-size\s*:\s*([\d.]+(?:px|rem|em|%))/i);
  if (sizeMatch && ALLOWED_FONT_SIZE.test(sizeMatch[1])) {
    styleParts.push(`font-size: ${sizeMatch[1].toLowerCase()}`);
  }
  // Keep font-weight so bold/unbold via CSS spans survives save (browsers often use spans, not <b>).
  const weightMatch = style.match(/font-weight\s*:\s*([a-z0-9]+)/i);
  if (weightMatch && ALLOWED_FONT_WEIGHT.test(weightMatch[1])) {
    styleParts.push(`font-weight: ${weightMatch[1].toLowerCase()}`);
  }
  const familyMatch = style.match(/font-family\s*:\s*([^;]+)/i);
  if (familyMatch) {
    const family = familyMatch[1].trim().replace(/\s+/g, " ");
    if (family && ALLOWED_FONT_FAMILY.test(family) && !/url\s*\(/i.test(family)) {
      styleParts.push(`font-family: ${family}`);
    }
  }
  const letterMatch = style.match(/letter-spacing\s*:\s*(-?[\d.]+(?:px|rem|em|%))/i);
  if (letterMatch && ALLOWED_SPACING.test(letterMatch[1])) {
    styleParts.push(`letter-spacing: ${letterMatch[1].toLowerCase()}`);
  }
  const wordMatch = style.match(/word-spacing\s*:\s*(-?[\d.]+(?:px|rem|em|%))/i);
  if (wordMatch && ALLOWED_SPACING.test(wordMatch[1])) {
    styleParts.push(`word-spacing: ${wordMatch[1].toLowerCase()}`);
  }
  const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  if (colorMatch && isSafeCssColor(colorMatch[1].trim())) {
    styleParts.push(`color: ${colorMatch[1].trim()}`);
  }
  if (styleParts.length) keep.set("style", styleParts.join("; "));

  Array.from(element.attributes).forEach((attr) => element.removeAttribute(attr.name));
  keep.forEach((value, name) => element.setAttribute(name, value));
}

/** Convert leftover <font size> tags into <span style="font-size"> before stripping. */
function normalizeFontTags(root: ParentNode) {
  root.querySelectorAll("font").forEach((font) => {
    const span = document.createElement("span");
    const sizeAttr = font.getAttribute("size")?.trim() || "";
    const face = font.getAttribute("face")?.trim();
    const color = font.getAttribute("color")?.trim();
    const styleSize = (font.getAttribute("style") || "").match(/font-size\s*:\s*([^;]+)/i)?.[1]?.trim();
    const px = styleSize && ALLOWED_FONT_SIZE.test(styleSize)
      ? styleSize.toLowerCase()
      : LEGACY_FONT_SIZE_PX[sizeAttr];
    if (px) span.style.fontSize = px;
    if (face) span.style.fontFamily = face;
    if (color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) span.style.color = color;
    while (font.firstChild) span.appendChild(font.firstChild);
    font.replaceWith(span);
  });
}

function sanitizeAnchorTagsServer(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref=(["'])(.*?)\1/i);
    const href = hrefMatch?.[2]?.trim() || "";
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href)) return _match;
    const cleaned = attrs
      .replace(/\s+(target|rel)=(["'][^"']*["'])/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (/^https?:\/\//i.test(href)) {
      return `<a ${cleaned} target="_blank" rel="noopener noreferrer">`;
    }
    return `<a ${cleaned}>`;
  });
}

export function sanitizeRichHtml(html: string): string {
  if (typeof document === "undefined") {
    return sanitizeAnchorTagsServer(
      html
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
        .replace(/\son\w+=("[^"]*"|'[^']*')/gi, ""),
    );
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  normalizeFontTags(template.content);
  normalizeFontWeightSpans(template.content);

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (!ALLOWED_TAGS.has(element.tagName)) {
          const text = document.createTextNode(element.textContent || "");
          element.replaceWith(text);
          continue;
        }
        sanitizeElementAttributes(element);
        walk(element);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.parentNode?.removeChild(child);
      }
    }
  };

  walk(template.content);
  return template.innerHTML;
}

export function plainToRichHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function ensureRichHtml(value: string): string {
  if (!value.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeRichHtml(value);
  return plainToRichHtml(value);
}

export function truncateHtmlByWords(html: string, wordLimit: number): { html: string; truncated: boolean } {
  const limit = Math.max(0, Math.floor(wordLimit));
  if (!limit) return { html: ensureRichHtml(html), truncated: false };

  const sanitized = ensureRichHtml(html);
  const words = plainTextFromHtml(sanitized).split(/\s+/).filter(Boolean);
  if (words.length <= limit) return { html: sanitized, truncated: false };

  // Use the same plain-text truncation on server and client so SSR markup matches hydration.
  return { html: `<p>${words.slice(0, limit).join(" ")}…</p>`, truncated: true };
}
