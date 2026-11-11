"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from "lucide-react";
import { RichTextLinkDialog } from "@/components/admin/RichTextLinkDialog";
import { countWords, ensureRichHtml, sanitizeRichHtml } from "@/lib/rich-text";
import { isExternalRichTextHref, type RichTextLinkContext } from "@/lib/rich-text-links";
import { FONT_FAMILIES } from "@/lib/typography";

const FONT_SIZE_OPTIONS = [
  { label: "Size", value: "" },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
] as const;

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  styleControl?: React.ReactNode;
  wordLimitControl?: React.ReactNode;
  linkContext?: RichTextLinkContext;
  /** Live typography preview (font size, line height, etc.) applied to the editing area. */
  editorStyle?: CSSProperties;
};

function ToolbarButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex size-8 items-center justify-center rounded-md ${active ? "bg-[#b98945]/15 text-[#9b6d30]" : "text-slate-600 hover:bg-white"}`}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px self-center bg-slate-200" aria-hidden />;
}

function getAnchorAtSelection(root: HTMLElement | null): HTMLAnchorElement | null {
  const selection = window.getSelection();
  if (!selection?.anchorNode || !root) return null;
  let node: Node | null = selection.anchorNode;
  while (node && node !== root) {
    if (node instanceof HTMLAnchorElement) return node;
    node = node.parentNode;
  }
  return null;
}

const BLOCK_TAGS = new Set(["P", "DIV", "LI", "H2", "H3", "BLOCKQUOTE"]);

function findBlockElement(node: Node | null, root: HTMLElement): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== root) {
    if (current instanceof HTMLElement && BLOCK_TAGS.has(current.tagName)) return current;
    current = current.parentNode;
  }
  return null;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  styleControl,
  wordLimitControl,
  linkContext,
  editorStyle,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const html = ensureRichHtml(value);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingHref, setEditingHref] = useState<string | undefined>();
  const editingAnchorRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== html) ref.current.innerHTML = html || "<p></p>";
  }, [html]);

  const commit = () => onChange(sanitizeRichHtml(ref.current?.innerHTML || ""));

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !ref.current) {
      savedRangeRef.current = null;
      return;
    }
    const range = selection.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = null;
      return;
    }
    savedRangeRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current || !ref.current) return false;
    const selection = window.getSelection();
    if (!selection) return false;
    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
    return true;
  };

  const apply = (command: string, commandValue?: string) => {
    ref.current?.focus();
    // Prefer semantic tags (<b>/<i>/…) so bold/unbold survives sanitize reliably.
    if (command === "bold" || command === "italic" || command === "underline" || command === "strikeThrough") {
      try {
        document.execCommand("styleWithCSS", false, "false");
      } catch {
        /* ignore */
      }
    }
    document.execCommand(command, false, commandValue);
    saveSelection();
    commit();
  };

  /** Wrap the current selection (or current block) in a span with an explicit font-size. */
  const applyFontSize = (sizePx: string) => {
    if (!sizePx || !ref.current) return;
    ref.current.focus();
    restoreSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let range = selection.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;

    // No text selected → size the whole paragraph/block under the caret.
    if (range.collapsed) {
      const block = findBlockElement(range.startContainer, ref.current);
      if (!block) return;
      range = document.createRange();
      range.selectNodeContents(block);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const stamp = `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    ref.current.querySelectorAll("span").forEach((node) => {
      (node as HTMLElement).dataset.fontSizePre = "1";
    });

    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* ignore */
    }
    const sized = document.execCommand("fontSize", false, "7");

    ref.current.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = sizePx;
      span.dataset.fontSizeStamp = stamp;
      while (font.firstChild) span.appendChild(font.firstChild);
      font.replaceWith(span);
    });

    // Browsers that force CSS mode emit new spans (xx-large or a large px value).
    ref.current.querySelectorAll("span").forEach((node) => {
      const span = node as HTMLElement;
      if (span.dataset.fontSizePre === "1") return;
      if (span.style.fontSize) {
        span.style.fontSize = sizePx;
        span.dataset.fontSizeStamp = stamp;
      }
    });

    ref.current.querySelectorAll("[data-font-size-pre]").forEach((node) => {
      (node as HTMLElement).removeAttribute("data-font-size-pre");
    });

    // Fallback when execCommand did nothing (or selection was odd).
    if (!sized || !ref.current.querySelector(`[data-font-size-stamp="${stamp}"]`)) {
      restoreSelection();
      const again = window.getSelection();
      if (again && again.rangeCount > 0) {
        const liveRange = again.getRangeAt(0);
        if (liveRange.collapsed) {
          const block = findBlockElement(liveRange.startContainer, ref.current);
          if (block) {
            const blockRange = document.createRange();
            blockRange.selectNodeContents(block);
            again.removeAllRanges();
            again.addRange(blockRange);
          }
        }
        const target = again.getRangeAt(0);
        try {
          const span = document.createElement("span");
          span.style.fontSize = sizePx;
          target.surroundContents(span);
        } catch {
          const contents = target.extractContents();
          const span = document.createElement("span");
          span.style.fontSize = sizePx;
          span.appendChild(contents);
          target.insertNode(span);
        }
      }
    }

    ref.current.querySelectorAll("[data-font-size-stamp]").forEach((node) => {
      (node as HTMLElement).removeAttribute("data-font-size-stamp");
    });

    saveSelection();
    commit();
  };

  /** Wrap selection (or current block) in a span with an explicit font-family. */
  const applyFontFamily = (family: string) => {
    if (!family || !ref.current) return;
    ref.current.focus();
    restoreSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let range = selection.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) {
      const block = findBlockElement(range.startContainer, ref.current);
      if (!block) return;
      range = document.createRange();
      range.selectNodeContents(block);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const live = selection.getRangeAt(0);
    try {
      const span = document.createElement("span");
      span.style.fontFamily = family;
      live.surroundContents(span);
    } catch {
      const contents = live.extractContents();
      const span = document.createElement("span");
      span.style.fontFamily = family;
      span.appendChild(contents);
      live.insertNode(span);
    }

    saveSelection();
    commit();
  };

  const openLinkDialog = () => {
    const anchor = getAnchorAtSelection(ref.current);
    editingAnchorRef.current = anchor;
    setEditingHref(anchor?.getAttribute("href") || undefined);
    setLinkDialogOpen(true);
  };

  const applyLink = (href: string) => {
    ref.current?.focus();
    const anchor = editingAnchorRef.current;
    if (anchor) {
      anchor.setAttribute("href", href);
      if (isExternalRichTextHref(href)) {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      } else {
        anchor.removeAttribute("target");
        anchor.removeAttribute("rel");
      }
    } else {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = href;
        if (isExternalRichTextHref(href)) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        ref.current?.appendChild(link);
      } else {
        document.execCommand("createLink", false, href);
        const created = getAnchorAtSelection(ref.current);
        if (created) {
          if (isExternalRichTextHref(href)) {
            created.setAttribute("target", "_blank");
            created.setAttribute("rel", "noopener noreferrer");
          } else {
            created.removeAttribute("target");
            created.removeAttribute("rel");
          }
        }
      }
    }
    editingAnchorRef.current = null;
    setEditingHref(undefined);
    commit();
  };

  const removeLink = () => {
    const anchor = editingAnchorRef.current;
    if (!anchor) return;
    const text = document.createTextNode(anchor.textContent || "");
    anchor.replaceWith(text);
    editingAnchorRef.current = null;
    setEditingHref(undefined);
    commit();
  };

  return (
    <div>
      <span className="mb-1 flex items-center gap-1">
        <span className="admin-label">{label}</span>
        {styleControl}
      </span>
      <div className="overflow-hidden rounded-lg border border-slate-200 focus-within:border-[#b98945]">
        <div className="flex flex-wrap gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
          <ToolbarButton label="Bold" onClick={() => apply("bold")}><Bold className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => apply("italic")}><Italic className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Underline" onClick={() => apply("underline")}><Underline className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Strikethrough" onClick={() => apply("strikeThrough")}><Strikethrough className="size-3.5" /></ToolbarButton>
          <label className="inline-flex h-8 items-center" title="Font size for selected text (or current paragraph)">
            <span className="sr-only">Font size</span>
            <select
              className="h-8 rounded-md border-0 bg-transparent px-1.5 text-[11px] font-semibold text-slate-600 outline-none hover:bg-white"
              defaultValue=""
              onPointerDown={saveSelection}
              onMouseDown={saveSelection}
              onChange={(event) => {
                const next = event.target.value;
                applyFontSize(next);
                event.target.value = "";
              }}
            >
              {FONT_SIZE_OPTIONS.map((option) => (
                <option key={option.label} value={option.value} disabled={!option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex h-8 max-w-[7.5rem] items-center" title="Font family for selected text (or current paragraph)">
            <span className="sr-only">Font family</span>
            <select
              className="h-8 max-w-full truncate rounded-md border-0 bg-transparent px-1.5 text-[11px] font-semibold text-slate-600 outline-none hover:bg-white"
              defaultValue=""
              onPointerDown={saveSelection}
              onMouseDown={saveSelection}
              onChange={(event) => {
                const next = event.target.value;
                applyFontFamily(next);
                event.target.value = "";
              }}
            >
              <option value="" disabled>
                Font
              </option>
              {FONT_FAMILIES.filter((option) => option.value).map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <ToolbarDivider />
          <ToolbarButton label="Heading" onClick={() => apply("formatBlock", "h3")}><Heading2 className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Quote" onClick={() => apply("formatBlock", "blockquote")}><Quote className="size-3.5" /></ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Bullet list" onClick={() => apply("insertUnorderedList")}><List className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Numbered list" onClick={() => apply("insertOrderedList")}><ListOrdered className="size-3.5" /></ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Align left" onClick={() => apply("justifyLeft")}><AlignLeft className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Align center" onClick={() => apply("justifyCenter")}><AlignCenter className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Align right" onClick={() => apply("justifyRight")}><AlignRight className="size-3.5" /></ToolbarButton>
          <ToolbarButton label="Align justify" onClick={() => apply("justifyFull")}><AlignJustify className="size-3.5" /></ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton label="Insert or edit link" onClick={openLinkDialog} active={Boolean(editingHref)}>
            <Link2 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Clear formatting" onClick={() => apply("removeFormat")}><RemoveFormatting className="size-3.5" /></ToolbarButton>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className="admin-rich-text min-h-56 max-h-[28rem] overflow-y-auto px-3 py-3 text-[13px] leading-6 text-[#142033] outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
          style={editorStyle}
          onInput={commit}
          onBlur={commit}
          onMouseUp={saveSelection}
          onKeyUp={() => {
            saveSelection();
            const anchor = getAnchorAtSelection(ref.current);
            setEditingHref(anchor?.getAttribute("href") || undefined);
          }}
          onClick={() => {
            saveSelection();
            const anchor = getAnchorAtSelection(ref.current);
            setEditingHref(anchor?.getAttribute("href") || undefined);
          }}
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500">
          {countWords(html)} words · click linked text to edit · use Enter for a new line
        </p>
        {wordLimitControl}
      </div>

      <RichTextLinkDialog
        open={linkDialogOpen}
        context={linkContext}
        initialHref={editingHref}
        onClose={() => {
          setLinkDialogOpen(false);
          editingAnchorRef.current = null;
        }}
        onApply={applyLink}
        onRemove={editingHref ? removeLink : undefined}
      />
    </div>
  );
}
