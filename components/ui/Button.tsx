"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { isExternalHref } from "@/lib/cta";
import {
  hasCustomButtonBackground,
  resolveButtonBackgroundStyle,
  type ButtonBackgroundSource,
} from "@/lib/button-background";
import { useCustomButtonGradients } from "@/components/providers/SiteDataProvider";
import { leadClickHandler, type LeadClickSource } from "@/lib/lead-click-source";
import { leadCtaGtmDomAttrs } from "@/lib/lead-form-gtm";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "outline"
  | "whatsapp"
  | "ghost";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  showArrow?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  backgroundColor?: string;
  backgroundType?: ButtonBackgroundSource["backgroundType"];
  backgroundGradient?: string;
  textColor?: string;
  leadClickSource?: LeadClickSource;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "[background:var(--fill-primary-button)] text-[var(--color-primary-button-text)] hover:[background:var(--fill-accent)] shadow-[0_10px_24px_rgba(185,137,69,0.22)]",
  secondary:
    "[background:var(--fill-secondary-button)] text-[var(--color-secondary-button-text)] border border-white/70 hover:[background:white] hover:text-[var(--color-primary)]",
  dark: "[background:var(--fill-primary)] text-white hover:[background:var(--fill-dark)]",
  outline:
    "bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)]/20 hover:border-[var(--color-primary)] hover:[background:var(--fill-primary)] hover:text-white",
  whatsapp:
    "[background:var(--fill-whatsapp)] text-white hover:brightness-110 shadow-[0_10px_24px_rgba(46,125,79,0.18)]",
  ghost:
    "bg-transparent text-[var(--color-secondary)] hover:[background:var(--fill-primary)] hover:text-white px-3 py-2 rounded",
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className,
  showArrow = true,
  type = "button",
  ariaLabel,
  fullWidth,
  style,
  backgroundColor,
  backgroundType,
  backgroundGradient,
  textColor,
  leadClickSource,
}: ButtonProps) {
  const customGradients = useCustomButtonGradients();
  const backgroundSource: ButtonBackgroundSource = {
    backgroundType,
    backgroundColor,
    backgroundGradient,
  };
  const customBg = hasCustomButtonBackground(backgroundSource, customGradients);
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-[13px] font-semibold tracking-[0.01em] transition-all duration-300 ease-out",
    variants[variant],
    customBg && "hover:brightness-105",
    fullWidth && "w-full",
    className,
  );

  const inlineStyle: React.CSSProperties = {
    ...resolveButtonBackgroundStyle(backgroundSource, customGradients),
    ...(textColor ? { color: textColor } : {}),
    ...style,
  };

  const content = (
    <>
      <span>{children}</span>
      {showArrow ? <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" /> : null}
    </>
  );

  if (href) {
    const external = isExternalHref(href);
    const gtmAttrs = leadClickSource ? leadCtaGtmDomAttrs(leadClickSource) : undefined;
    return (
      <a
        href={href}
        className={classes}
        style={inlineStyle}
        aria-label={ariaLabel}
        onClick={leadClickHandler(href, leadClickSource, onClick)}
        target={external && href.startsWith("http") ? "_blank" : undefined}
        rel={external && href.startsWith("http") ? "noopener noreferrer" : undefined}
        {...gtmAttrs}
      >
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} style={inlineStyle} aria-label={ariaLabel}>
      {content}
    </button>
  );
}
