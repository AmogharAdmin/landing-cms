"use client";

import { useState, type KeyboardEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  CopyPlus,
  Eraser,
  ExternalLink,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type {
  KeywordAboutOverride,
  KeywordBookingCardOverride,
  KeywordContent,
  KeywordHeroOverride,
  KeywordMatchType,
  KeywordRule,
  SiteData,
} from "@/types/site";
import { CompactToggle } from "@/components/admin/editor-ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { hasRichText, normalizeKeyword } from "@/lib/keyword-content";

type OverrideTab = "hero" | "bookingCard" | "about";

type TextFieldSpec<T> = {
  key: keyof T & string;
  label: string;
  placeholder: string;
  multiline?: boolean;
};

const TAB_LABELS: Record<OverrideTab, string> = {
  hero: "Hero section",
  bookingCard: "Hero card",
  about: "About section",
};

function createRuleId() {
  return `kw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyRule(index: number): KeywordRule {
  return { id: createRuleId(), enabled: true, name: `Keyword rule ${index + 1}`, tags: [], match: "exact" };
}

function countFilled(override: Record<string, unknown> | undefined) {
  if (!override) return 0;
  return Object.entries(override).filter(([key, value]) => {
    if (Array.isArray(value)) return value.some((item) => typeof item === "string" && item.trim());
    if (key === "description" && typeof value === "string" && value.includes("<")) return hasRichText(value);
    return typeof value === "string" && value.trim().length > 0;
  }).length;
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((item) => item.replace(/\s+/g, " ").trim().slice(0, 200))
      .filter(Boolean);
    if (!incoming.length) return;
    const seen = new Set(tags.map(normalizeKeyword));
    const next = [...tags];
    for (const tag of incoming) {
      const key = normalizeKeyword(tag);
      if (seen.has(key)) continue;
      seen.add(key);
      next.push(tag);
    }
    onChange(next);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 focus-within:border-[#b98945]">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#0b1f35]/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#0b1f35]">
          <Tag className="size-3 text-[#b98945]" />
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            className="rounded-full p-0.5 text-slate-400 hover:bg-white hover:text-red-600"
            aria-label={`Remove ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={tags.length ? "Add another keyword" : "e.g. 3 bhk villas, luxury villas"}
        className="min-w-[160px] flex-1 border-0 bg-transparent px-1 py-1 text-[13px] outline-none"
      />
    </div>
  );
}

function OverrideTextFields<T extends Record<string, unknown>>({
  fields,
  value,
  onChange,
}: {
  fields: TextFieldSpec<T>[];
  value: T | undefined;
  onChange: (key: keyof T & string, next: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => {
        const current = typeof value?.[field.key] === "string" ? (value[field.key] as string) : "";
        return (
          <label key={field.key} className={field.multiline ? "sm:col-span-2" : undefined}>
            <span className="admin-label">{field.label}</span>
            {field.multiline ? (
              <textarea
                value={current}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="admin-input min-h-[84px] py-2"
              />
            ) : (
              <input
                value={current}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="admin-input"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function BenefitsList({
  value,
  defaults,
  onChange,
}: {
  value: string[] | undefined;
  defaults: string[];
  onChange: (next: string[] | undefined) => void;
}) {
  const items = value ?? [];
  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <span className="admin-label mb-0">Benefits list</span>
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-[#0b1f35] hover:bg-slate-50"
        >
          <Plus className="size-3.5" /> Add benefit
        </button>
      </div>
      {items.length ? (
        items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(event) => onChange(items.map((current, i) => (i === index ? event.target.value : current)))}
              placeholder={defaults[index] || "Benefit"}
              className="admin-input"
            />
            <button
              type="button"
              onClick={() => {
                const next = items.filter((_, i) => i !== index);
                onChange(next.length ? next : undefined);
              }}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              aria-label="Remove benefit"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-[11px] text-slate-500">
          No custom benefits. The default list is shown: {defaults.filter(Boolean).join(" · ") || "none"}.
        </p>
      )}
    </div>
  );
}

function RuleEditor({
  rule,
  defaults,
  onChange,
}: {
  rule: KeywordRule;
  defaults: Pick<SiteData, "hero" | "bookingCard" | "about">;
  onChange: (next: KeywordRule) => void;
}) {
  const [tab, setTab] = useState<OverrideTab>("hero");
  const [copied, setCopied] = useState(false);
  const firstTag = rule.tags[0] || "";
  const testPath = firstTag ? `/?utm_term=${encodeURIComponent(firstTag)}` : "";

  const patchOverride = (key: OverrideTab, patch: Record<string, unknown>) => {
    const merged = { ...(rule[key] || {}), ...patch } as Record<string, unknown>;
    for (const [field, value] of Object.entries(merged)) {
      if (value === undefined || value === "") delete merged[field];
    }
    onChange({ ...rule, [key]: Object.keys(merged).length ? merged : undefined });
  };

  const clearOverride = (key: OverrideTab) => onChange({ ...rule, [key]: undefined });

  const copyTestLink = async () => {
    if (!testPath) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${testPath}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const heroFields: TextFieldSpec<KeywordHeroOverride>[] = [
    { key: "eyebrow", label: "Eyebrow", placeholder: defaults.hero.eyebrow },
    { key: "heading", label: "Heading", placeholder: defaults.hero.heading },
    { key: "headingAccent", label: "Heading accent", placeholder: defaults.hero.headingAccent },
    { key: "primaryCtaLabel", label: "Primary button label", placeholder: defaults.hero.primaryCTA.label },
    { key: "secondaryCtaLabel", label: "Secondary button label", placeholder: defaults.hero.secondaryCTA.label },
    { key: "description", label: "Description", placeholder: defaults.hero.description, multiline: true },
  ];

  const cardFields: TextFieldSpec<KeywordBookingCardOverride>[] = [
    { key: "offerTitle", label: "Offer badge", placeholder: defaults.bookingCard.offerTitle },
    { key: "title", label: "Card title", placeholder: defaults.bookingCard.title },
    { key: "benefitsTitle", label: "Benefits title", placeholder: defaults.bookingCard.benefitsTitle || "" },
    { key: "propertyText", label: "Property text", placeholder: defaults.bookingCard.propertyText },
    { key: "pricePrefix", label: "Price prefix", placeholder: defaults.bookingCard.pricePrefix },
    { key: "price", label: "Price", placeholder: defaults.bookingCard.price },
    { key: "priceSuffix", label: "Price suffix", placeholder: defaults.bookingCard.priceSuffix },
    { key: "buttonLabel", label: "Button label", placeholder: defaults.bookingCard.button.label },
    { key: "description", label: "Description", placeholder: defaults.bookingCard.description, multiline: true },
  ];

  const aboutFields: TextFieldSpec<KeywordAboutOverride>[] = [
    { key: "label", label: "Section label", placeholder: defaults.about.label },
    { key: "heading", label: "Heading", placeholder: defaults.about.heading },
    { key: "headingAccent", label: "Heading accent", placeholder: defaults.about.headingAccent },
  ];

  return (
    <div className="space-y-4 border-t border-slate-200 px-4 pb-4 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="admin-label">Rule name (admin only)</span>
          <input
            value={rule.name}
            onChange={(event) => onChange({ ...rule, name: event.target.value.slice(0, 120) })}
            placeholder="e.g. 3 BHK campaign"
            className="admin-input"
          />
        </label>
        <div>
          <span className="admin-label">Match type</span>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(["exact", "contains"] as KeywordMatchType[]).map((match) => (
              <button
                key={match}
                type="button"
                onClick={() => onChange({ ...rule, match })}
                className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-medium transition-colors ${rule.match === match ? "bg-white text-[#0b1f35] shadow-sm" : "text-slate-500 hover:text-[#0b1f35]"}`}
              >
                {match === "exact" ? "Exact match" : "Contains"}
              </button>
            ))}
          </div>
          <span className="mt-1 block text-[10px] text-slate-500">
            {rule.match === "exact"
              ? "utm_term must equal a tag (case and extra spaces ignored)."
              : "utm_term only needs to include a tag, e.g. “villas” matches “3 bhk villas bangalore”."}
          </span>
        </div>
        <div className="sm:col-span-2">
          <span className="admin-label">Tags (Google Ads keywords)</span>
          <TagInput tags={rule.tags} onChange={(tags) => onChange({ ...rule, tags })} />
          <span className="mt-1 block text-[10px] text-slate-500">Press Enter or comma to add. Any one tag matching is enough.</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <span className="font-semibold text-[#0b1f35]">Test link:</span>
        {testPath ? (
          <>
            <code className="break-all rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">{testPath}</code>
            <button type="button" onClick={() => void copyTestLink()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold hover:bg-slate-100">
              <Copy className="size-3.5" /> {copied ? "Copied" : "Copy"}
            </button>
            <a href={testPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold hover:bg-slate-100">
              <ExternalLink className="size-3.5" /> Open
            </a>
            <span className="text-[10px] text-slate-500">Save first. Opening it also stores this keyword in your browser for 90 days.</span>
          </>
        ) : (
          <span>Add a tag to get a test link.</span>
        )}
      </div>

      <div>
        <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
          {(Object.keys(TAB_LABELS) as OverrideTab[]).map((key) => {
            const filledCount = countFilled(rule[key] as Record<string, unknown> | undefined);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`min-h-9 shrink-0 rounded-lg px-4 text-xs font-medium transition-colors ${tab === key ? "bg-white text-[#0b1f35] shadow-sm" : "text-slate-500 hover:text-[#0b1f35]"}`}
              >
                {TAB_LABELS[key]}
                {filledCount ? <span className="ml-1.5 rounded-full bg-[#b98945]/15 px-1.5 text-[10px] text-[#8a6430]">{filledCount}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">Blank fields keep the default content (shown as the placeholder).</p>
          <button
            type="button"
            onClick={() => clearOverride(tab)}
            disabled={!countFilled(rule[tab] as Record<string, unknown> | undefined)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Eraser className="size-3.5" /> Clear overrides
          </button>
        </div>

        {tab === "hero" ? (
          <OverrideTextFields fields={heroFields} value={rule.hero} onChange={(key, next) => patchOverride("hero", { [key]: next })} />
        ) : tab === "bookingCard" ? (
          <div className="grid gap-3">
            <OverrideTextFields fields={cardFields} value={rule.bookingCard} onChange={(key, next) => patchOverride("bookingCard", { [key]: next })} />
            <BenefitsList
              value={rule.bookingCard?.benefits}
              defaults={defaults.bookingCard.benefits}
              onChange={(benefits) => patchOverride("bookingCard", { benefits })}
            />
          </div>
        ) : (
          <div className="grid gap-3">
            <OverrideTextFields fields={aboutFields} value={rule.about} onChange={(key, next) => patchOverride("about", { [key]: next })} />
            <div key={rule.id}>
              <RichTextEditor
                label="Description (leave empty to keep the default)"
                value={rule.about?.description || ""}
                onChange={(html) => patchOverride("about", { description: hasRichText(html) ? html : undefined })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function KeywordContentEditor({
  value,
  defaults,
  onChange,
}: {
  value: KeywordContent | undefined;
  defaults: Pick<SiteData, "hero" | "bookingCard" | "about">;
  onChange: (next: KeywordContent) => void;
}) {
  const config: KeywordContent = { enabled: value?.enabled !== false, rules: value?.rules ?? [] };
  const [openId, setOpenId] = useState<string | null>(config.rules[0]?.id ?? null);

  const setRules = (rules: KeywordRule[]) => onChange({ ...config, rules });
  const patchRule = (id: string, next: KeywordRule) => setRules(config.rules.map((rule) => (rule.id === id ? next : rule)));

  const addRule = () => {
    const rule = emptyRule(config.rules.length);
    setRules([...config.rules, rule]);
    setOpenId(rule.id);
  };

  const duplicateRule = (index: number) => {
    const source = config.rules[index];
    const copy: KeywordRule = { ...structuredClone(source), id: createRuleId(), name: `${source.name || "Rule"} (copy)` };
    const next = [...config.rules];
    next.splice(index + 1, 0, copy);
    setRules(next);
    setOpenId(copy.id);
  };

  const moveRule = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= config.rules.length) return;
    const next = [...config.rules];
    [next[index], next[target]] = [next[target], next[index]];
    setRules(next);
  };

  const deleteRule = (index: number) => {
    const rule = config.rules[index];
    if (!window.confirm(`Delete “${rule.name || "this rule"}”? Its custom content will be removed.`)) return;
    setRules(config.rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] leading-5 text-slate-600">
        <p className="font-semibold text-[#0b1f35]">Show different Hero, Hero card and About copy per Google Ads keyword.</p>
        <p className="mt-1">
          When a visitor lands with <code className="font-mono text-[11px]">?utm_term=…</code> (or comes back later with the
          keyword saved from an earlier ad click), the first enabled rule with a matching tag replaces the filled-in fields below.
          Rules are checked top to bottom. Everything else on the page stays the same. Save the dashboard after editing.
        </p>
      </div>

      <CompactToggle label="Enable keyword content" checked={config.enabled !== false} onChange={(enabled) => onChange({ ...config, enabled })} />

      {config.rules.length ? (
        <div className="space-y-3">
          {config.rules.map((rule, index) => {
            const open = openId === rule.id;
            return (
              <div key={rule.id} className={`overflow-hidden rounded-xl border bg-white ${open ? "border-[#b98945]/50 shadow-sm" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <button type="button" onClick={() => setOpenId(open ? null : rule.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0b1f35] text-[11px] font-semibold text-white">{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-[#0b1f35]">{rule.name || "Untitled rule"}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {rule.match === "exact" ? "Exact" : "Contains"} · {rule.tags.length ? rule.tags.join(", ") : "No tags yet"}
                      </span>
                    </span>
                    <ChevronDown className={`ml-auto size-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  <CompactToggle label="Active" checked={rule.enabled} onChange={(enabled) => patchRule(rule.id, { ...rule, enabled })} />
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveRule(index, -1)} disabled={index === 0} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30" aria-label="Move up">
                      <ChevronUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => moveRule(index, 1)} disabled={index === config.rules.length - 1} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30" aria-label="Move down">
                      <ChevronDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => duplicateRule(index)} className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Duplicate rule">
                      <CopyPlus className="size-4" />
                    </button>
                    <button type="button" onClick={() => deleteRule(index)} className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50" aria-label="Delete rule">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {open ? <RuleEditor rule={rule} defaults={defaults} onChange={(next) => patchRule(rule.id, next)} /> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-[12px] text-slate-500">
          No keyword rules yet. Add one to start personalising the Hero, Hero card and About section.
        </p>
      )}

      <button
        type="button"
        onClick={addRule}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0b1f35] px-4 text-xs font-semibold text-white hover:bg-[#13304f]"
      >
        <Plus className="size-4" /> Add keyword rule
      </button>
    </div>
  );
}
