"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  buildRichTextLinkHref,
  parseRichTextLinkHref,
  RICH_TEXT_LINK_TYPE_LABELS,
  type RichTextLinkContext,
  type RichTextLinkType,
} from "@/lib/rich-text-links";

type RichTextLinkDialogProps = {
  open: boolean;
  context?: RichTextLinkContext;
  initialHref?: string;
  onClose: () => void;
  onApply: (href: string) => void;
  onRemove?: () => void;
};

const LINK_TYPES: RichTextLinkType[] = ["form", "section", "url", "email", "phone", "whatsapp"];

export function RichTextLinkDialog({
  open,
  context,
  initialHref,
  onClose,
  onApply,
  onRemove,
}: RichTextLinkDialogProps) {
  const availableTypes = context
    ? LINK_TYPES
    : (["url", "email", "phone"] as RichTextLinkType[]);

  const editing = Boolean(initialHref);

  const [type, setType] = useState<RichTextLinkType>(availableTypes[0]);
  const [formIntent, setFormIntent] = useState("default");
  const [sectionHash, setSectionHash] = useState(context?.sections[0]?.hash || "#about");
  const [url, setUrl] = useState("https://");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(context?.sitePhone || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    const parsed = initialHref ? parseRichTextLinkHref(initialHref, context) : null;
    const types = context ? LINK_TYPES : (["url", "email", "phone"] as RichTextLinkType[]);
    setType(parsed?.type && types.includes(parsed.type) ? parsed.type : types[0]);
    setFormIntent(parsed?.formIntent || context?.intents[0]?.id || "default");
    setSectionHash(parsed?.sectionHash || context?.sections[0]?.hash || "#about");
    setUrl(parsed?.url || "https://");
    setEmail(parsed?.email || "");
    setPhone(parsed?.phone || context?.sitePhone || "");
  }, [open, context, initialHref]);

  if (!open) return null;

  const submit = () => {
    let href = "";
    switch (type) {
      case "form":
        href = buildRichTextLinkHref("form", formIntent, context);
        break;
      case "section":
        href = buildRichTextLinkHref("section", sectionHash, context);
        break;
      case "url":
        href = buildRichTextLinkHref("url", url, context);
        break;
      case "email":
        href = buildRichTextLinkHref("email", email, context);
        break;
      case "phone":
        href = buildRichTextLinkHref("phone", phone, context);
        break;
      case "whatsapp":
        href = buildRichTextLinkHref("whatsapp", phone || context?.siteWhatsapp || "", context);
        break;
    }

    if (!href) {
      setError("Please enter a valid link.");
      return;
    }

    onApply(href);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="mb-10 w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0b1f35]">{editing ? "Edit link" : "Insert link"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {editing ? (
          <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            Current link: <span className="font-mono text-[10px] text-[#0b1f35]">{initialHref}</span>
          </p>
        ) : null}

        <div className="space-y-3">
          <label className="block">
            <span className="admin-label">Link type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as RichTextLinkType)}
              className="admin-input"
            >
              {availableTypes.map((linkType) => (
                <option key={linkType} value={linkType}>{RICH_TEXT_LINK_TYPE_LABELS[linkType]}</option>
              ))}
            </select>
          </label>

          {type === "form" ? (
            <label className="block">
              <span className="admin-label">Which form</span>
              <select value={formIntent} onChange={(event) => setFormIntent(event.target.value)} className="admin-input">
                {context?.intents.length
                  ? context.intents.map((intent) => (
                    <option key={intent.id} value={intent.id}>{intent.name}</option>
                  ))
                  : <option value="default">General enquiry</option>}
              </select>
            </label>
          ) : null}

          {type === "section" ? (
            <label className="block">
              <span className="admin-label">Which section</span>
              <select value={sectionHash} onChange={(event) => setSectionHash(event.target.value)} className="admin-input">
                {context?.sections.map((section) => (
                  <option key={section.hash} value={section.hash}>{section.label}</option>
                ))}
              </select>
            </label>
          ) : null}

          {type === "url" ? (
            <label className="block">
              <span className="admin-label">Website URL</span>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                className="admin-input"
              />
            </label>
          ) : null}

          {type === "email" ? (
            <label className="block">
              <span className="admin-label">Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sales@example.com"
                className="admin-input"
              />
            </label>
          ) : null}

          {type === "phone" ? (
            <label className="block">
              <span className="admin-label">Phone number</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={context?.sitePhone || "+91…"}
                className="admin-input"
              />
              {context?.sitePhone ? (
                <p className="mt-1 text-[10px] text-slate-500">Leave blank to use the site phone from Brand & Contact.</p>
              ) : null}
            </label>
          ) : null}

          {type === "whatsapp" ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              Opens WhatsApp using the site number from Brand & Contact
              {context?.siteWhatsapp ? `: ${context.siteWhatsapp}` : "."}
            </div>
          ) : null}

          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {editing && onRemove ? (
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="inline-flex min-h-9 items-center rounded-lg border border-red-200 px-4 text-[12px] font-medium text-red-600 hover:bg-red-50"
            >
              Remove link
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-4 text-[12px] font-medium text-slate-700">
              Cancel
            </button>
            <button type="button" onClick={submit} className="inline-flex min-h-9 items-center rounded-lg bg-[#0b1f35] px-4 text-[12px] font-semibold text-white">
              {editing ? "Update link" : "Insert link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
