import type { CSSProperties } from "react";

export type ButtonBackgroundType = "plain" | "gradient";

export type ButtonBackgroundSource = {
  backgroundType?: ButtonBackgroundType | string;
  backgroundColor?: string;
  backgroundGradient?: string;
};

export type ButtonGradientPreset = {
  id: string;
  label: string;
  description: string;
  css: string;
  category?: string;
};

export type CustomButtonGradient = {
  id: string;
  label: string;
  description?: string;
  css: string;
  angle?: number;
  color1?: string;
  color2?: string;
  color3?: string;
};

/** Quick picks shown inline in the button editor. */
export const FEATURED_GRADIENT_IDS = [
  "golden",
  "dark-golden",
  "light-golden",
  "metallic",
  "bronze",
  "champagne",
  "rose-gold",
  "graphite-gold",
] as const;

/** Built-in button gradients — golds plus a broad multi-color set. */
export const BUTTON_GRADIENT_PRESETS: ButtonGradientPreset[] = [
  // Featured golds / metals
  { id: "golden", label: "Golden", description: "Classic brand gold", category: "Gold", css: "linear-gradient(135deg, #E8C47A 0%, #B98945 48%, #9A6F2E 100%)" },
  { id: "dark-golden", label: "Dark golden", description: "Deep antique gold", category: "Gold", css: "linear-gradient(135deg, #C9A050 0%, #8B6914 45%, #5C4508 100%)" },
  { id: "light-golden", label: "Light golden", description: "Soft champagne gold", category: "Gold", css: "linear-gradient(135deg, #F7E9C8 0%, #E0C080 50%, #D4A84B 100%)" },
  { id: "metallic", label: "Metallic", description: "Shiny gold metal", category: "Gold", css: "linear-gradient(135deg, #F8F4EC 0%, #D4AF37 32%, #AA8C2C 62%, #F0E6C8 100%)" },
  { id: "bronze", label: "Bronze", description: "Warm bronze metal", category: "Gold", css: "linear-gradient(135deg, #D4A574 0%, #CD7F32 42%, #8B5A2B 100%)" },
  { id: "champagne", label: "Champagne", description: "Pale elegant gold", category: "Gold", css: "linear-gradient(135deg, #FFF8EE 0%, #F0D9B0 45%, #C9A86C 100%)" },
  { id: "rose-gold", label: "Rose gold", description: "Blush metallic", category: "Gold", css: "linear-gradient(135deg, #F7D6D0 0%, #E8B4B8 42%, #B76E79 100%)" },
  { id: "graphite-gold", label: "Graphite gold", description: "Dark with gold edge", category: "Gold", css: "linear-gradient(135deg, #2C3340 0%, #B98945 48%, #141820 100%)" },
  { id: "amber-glow", label: "Amber glow", description: "Bright amber wash", category: "Gold", css: "linear-gradient(135deg, #FFE08A 0%, #F5A623 50%, #C9790D 100%)" },
  { id: "copper", label: "Copper", description: "Polished copper", category: "Gold", css: "linear-gradient(135deg, #E8A87C 0%, #C46B3A 45%, #8A3B1D 100%)" },

  // Blues
  { id: "ocean", label: "Ocean", description: "Deep sea blue", category: "Blue", css: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)" },
  { id: "navy-sky", label: "Navy sky", description: "Night to sky", category: "Blue", css: "linear-gradient(135deg, #0B1F35 0%, #1E5F8A 55%, #4BA3C3 100%)" },
  { id: "azure", label: "Azure", description: "Clear azure", category: "Blue", css: "linear-gradient(135deg, #2193B0 0%, #6DD5ED 100%)" },
  { id: "indigo-wave", label: "Indigo wave", description: "Indigo blend", category: "Blue", css: "linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #818CF8 100%)" },
  { id: "ice-blue", label: "Ice blue", description: "Cool icy blue", category: "Blue", css: "linear-gradient(135deg, #E0F2FE 0%, #7DD3FC 45%, #0284C7 100%)" },
  { id: "midnight-blue", label: "Midnight blue", description: "Dark navy fade", category: "Blue", css: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #334155 100%)" },
  { id: "teal-blue", label: "Teal blue", description: "Blue-teal mix", category: "Blue", css: "linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)" },
  { id: "royal-blue", label: "Royal blue", description: "Bold royal", category: "Blue", css: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 55%, #93C5FD 100%)" },

  // Greens
  { id: "forest", label: "Forest", description: "Deep forest green", category: "Green", css: "linear-gradient(135deg, #134E4A 0%, #0F766E 45%, #2DD4BF 100%)" },
  { id: "emerald", label: "Emerald", description: "Rich emerald", category: "Green", css: "linear-gradient(135deg, #064E3B 0%, #059669 50%, #34D399 100%)" },
  { id: "mint", label: "Mint", description: "Fresh mint", category: "Green", css: "linear-gradient(135deg, #ECFDF5 0%, #6EE7B7 45%, #10B981 100%)" },
  { id: "lime-glow", label: "Lime glow", description: "Bright lime", category: "Green", css: "linear-gradient(135deg, #A3E635 0%, #65A30D 55%, #3F6212 100%)" },
  { id: "olive", label: "Olive", description: "Muted olive", category: "Green", css: "linear-gradient(135deg, #A3A189 0%, #6B705C 50%, #3F4238 100%)" },
  { id: "moss", label: "Moss", description: "Earth moss", category: "Green", css: "linear-gradient(135deg, #84CC16 0%, #4D7C0F 50%, #365314 100%)" },
  { id: "seafoam", label: "Seafoam", description: "Soft seafoam", category: "Green", css: "linear-gradient(135deg, #CCFBF1 0%, #5EEAD4 40%, #0D9488 100%)" },

  // Purples / pinks
  { id: "violet", label: "Violet", description: "Deep violet", category: "Purple", css: "linear-gradient(135deg, #5B21B6 0%, #8B5CF6 50%, #C4B5FD 100%)" },
  { id: "orchid", label: "Orchid", description: "Orchid bloom", category: "Purple", css: "linear-gradient(135deg, #C026D3 0%, #E879F9 55%, #F5D0FE 100%)" },
  { id: "lavender", label: "Lavender", description: "Soft lavender", category: "Purple", css: "linear-gradient(135deg, #EDE9FE 0%, #A78BFA 45%, #7C3AED 100%)" },
  { id: "magenta", label: "Magenta", description: "Bold magenta", category: "Purple", css: "linear-gradient(135deg, #9D174D 0%, #DB2777 50%, #F9A8D4 100%)" },
  { id: "plum", label: "Plum", description: "Dark plum", category: "Purple", css: "linear-gradient(135deg, #4A044E 0%, #86198F 50%, #D946EF 100%)" },
  { id: "berry", label: "Berry", description: "Berry crush", category: "Purple", css: "linear-gradient(135deg, #BE185D 0%, #FB7185 55%, #FECDD3 100%)" },
  { id: "fuchsia-sky", label: "Fuchsia sky", description: "Pink to purple", category: "Purple", css: "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)" },

  // Reds / oranges
  { id: "crimson", label: "Crimson", description: "Deep crimson", category: "Warm", css: "linear-gradient(135deg, #7F1D1D 0%, #DC2626 50%, #FCA5A5 100%)" },
  { id: "sunset", label: "Sunset", description: "Warm sunset", category: "Warm", css: "linear-gradient(135deg, #F97316 0%, #EF4444 50%, #EC4899 100%)" },
  { id: "coral", label: "Coral", description: "Soft coral", category: "Warm", css: "linear-gradient(135deg, #FFEDD5 0%, #FB923C 45%, #EA580C 100%)" },
  { id: "tangerine", label: "Tangerine", description: "Bright tangerine", category: "Warm", css: "linear-gradient(135deg, #FDBA74 0%, #F97316 50%, #C2410C 100%)" },
  { id: "ember", label: "Ember", description: "Glowing ember", category: "Warm", css: "linear-gradient(135deg, #450A0A 0%, #B91C1C 45%, #F59E0B 100%)" },
  { id: "peach", label: "Peach", description: "Peachy glow", category: "Warm", css: "linear-gradient(135deg, #FFF7ED 0%, #FDBA74 40%, #FB7185 100%)" },
  { id: "fire", label: "Fire", description: "Hot fire blend", category: "Warm", css: "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #EAB308 100%)" },

  // Neutrals / darks
  { id: "slate", label: "Slate", description: "Cool slate", category: "Neutral", css: "linear-gradient(135deg, #334155 0%, #64748B 50%, #CBD5E1 100%)" },
  { id: "charcoal", label: "Charcoal", description: "Soft charcoal", category: "Neutral", css: "linear-gradient(135deg, #18181B 0%, #3F3F46 55%, #71717A 100%)" },
  { id: "silver", label: "Silver", description: "Polished silver", category: "Neutral", css: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 45%, #475569 100%)" },
  { id: "smoke", label: "Smoke", description: "Smoky gray", category: "Neutral", css: "linear-gradient(135deg, #1F2937 0%, #6B7280 50%, #D1D5DB 100%)" },
  { id: "ink", label: "Ink", description: "Deep ink black", category: "Neutral", css: "linear-gradient(135deg, #020617 0%, #1E293B 55%, #334155 100%)" },
  { id: "pearl", label: "Pearl", description: "Soft pearl", category: "Neutral", css: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)" },

  // Multi / vivid
  { id: "aurora", label: "Aurora", description: "Northern lights", category: "Vivid", css: "linear-gradient(135deg, #22D3EE 0%, #A78BFA 50%, #F472B6 100%)" },
  { id: "rainbow", label: "Rainbow", description: "Soft rainbow", category: "Vivid", css: "linear-gradient(135deg, #F87171 0%, #FBBF24 25%, #34D399 50%, #60A5FA 75%, #C084FC 100%)" },
  { id: "candy", label: "Candy", description: "Candy swirl", category: "Vivid", css: "linear-gradient(135deg, #FB7185 0%, #A78BFA 50%, #38BDF8 100%)" },
  { id: "neon", label: "Neon", description: "Neon night", category: "Vivid", css: "linear-gradient(135deg, #22C55E 0%, #06B6D4 50%, #8B5CF6 100%)" },
  { id: "tropical", label: "Tropical", description: "Tropical punch", category: "Vivid", css: "linear-gradient(135deg, #FACC15 0%, #FB923C 40%, #F43F5E 100%)" },
  { id: "lagoon", label: "Lagoon", description: "Tropical lagoon", category: "Vivid", css: "linear-gradient(135deg, #67E8F9 0%, #2DD4BF 45%, #4ADE80 100%)" },
  { id: "cosmos", label: "Cosmos", description: "Space cosmos", category: "Vivid", css: "linear-gradient(135deg, #0F172A 0%, #4C1D95 45%, #DB2777 100%)" },
  { id: "flare", label: "Flare", description: "Solar flare", category: "Vivid", css: "linear-gradient(135deg, #FDE68A 0%, #F97316 40%, #BE123C 100%)" },
];

export const FEATURED_GRADIENT_PRESETS = BUTTON_GRADIENT_PRESETS.filter((preset) =>
  (FEATURED_GRADIENT_IDS as readonly string[]).includes(preset.id),
);

export function isCssGradientValue(value?: string): boolean {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("linear-gradient(") || trimmed.startsWith("radial-gradient(") || trimmed.startsWith("conic-gradient(");
}

export function customGradientKey(id: string) {
  return id.startsWith("custom:") ? id : `custom:${id}`;
}

export function parseCustomGradientId(value?: string): string | null {
  if (!value?.startsWith("custom:")) return null;
  const id = value.slice("custom:".length).trim();
  return id || null;
}

export function buildLinearGradientCss(
  angle: number,
  color1: string,
  color2: string,
  color3?: string,
): string {
  const safeAngle = Number.isFinite(angle) ? Math.min(360, Math.max(0, angle)) : 135;
  const c1 = color1.trim() || "#B98945";
  const c2 = color2.trim() || "#9A6F2E";
  const c3 = color3?.trim();
  if (c3) return `linear-gradient(${safeAngle}deg, ${c1} 0%, ${c2} 50%, ${c3} 100%)`;
  return `linear-gradient(${safeAngle}deg, ${c1} 0%, ${c2} 100%)`;
}

export function findButtonGradientPreset(
  id?: string,
  customGradients: CustomButtonGradient[] = [],
): ButtonGradientPreset | undefined {
  if (!id) return undefined;
  if (isCssGradientValue(id)) {
    return { id: "raw-css", label: "Custom", description: "Custom CSS gradient", css: id.trim() };
  }
  const builtin = BUTTON_GRADIENT_PRESETS.find((preset) => preset.id === id);
  if (builtin) return builtin;

  const customId = parseCustomGradientId(id) || id;
  const custom = customGradients.find((item) => item.id === customId);
  if (custom) {
    return {
      id: customGradientKey(custom.id),
      label: custom.label,
      description: custom.description || "Saved custom gradient",
      css: custom.css,
      category: "Custom",
    };
  }
  return undefined;
}

export function resolveButtonBackgroundType(source: ButtonBackgroundSource): ButtonBackgroundType {
  if (source.backgroundType === "gradient") return "gradient";
  return "plain";
}

function gradientStyle(css: string): CSSProperties {
  return {
    backgroundImage: css,
    backgroundColor: "transparent",
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
  };
}

/** CSS for a button fill — solid color or preset / custom / raw gradient. */
export function resolveButtonBackgroundStyle(
  source: ButtonBackgroundSource,
  customGradients: CustomButtonGradient[] = [],
): CSSProperties {
  const type = resolveButtonBackgroundType(source);
  if (type === "gradient") {
    const preset = findButtonGradientPreset(source.backgroundGradient, customGradients);
    if (preset) return gradientStyle(preset.css);
  }
  const color = source.backgroundColor?.trim();
  if (color) {
    // Theme fill tokens (and raw gradient CSS) need the `background` shorthand so
    // gradients resolve; plain hex stays on backgroundColor for Tailwind compatibility.
    if (color.includes("--fill-") || /gradient\(/i.test(color)) {
      return { background: color };
    }
    return { backgroundColor: color, backgroundImage: "none" };
  }
  return {};
}

export function hasCustomButtonBackground(
  source: ButtonBackgroundSource,
  customGradients: CustomButtonGradient[] = [],
): boolean {
  if (resolveButtonBackgroundType(source) === "gradient") {
    return Boolean(findButtonGradientPreset(source.backgroundGradient, customGradients));
  }
  return Boolean(source.backgroundColor?.trim());
}

export function listGradientCategories(presets: ButtonGradientPreset[] = BUTTON_GRADIENT_PRESETS) {
  const categories: string[] = [];
  for (const preset of presets) {
    const category = preset.category || "Other";
    if (!categories.includes(category)) categories.push(category);
  }
  return categories;
}
