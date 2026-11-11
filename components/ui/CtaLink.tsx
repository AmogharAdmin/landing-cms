"use client";

import { useSiteData } from "@/components/providers/SiteDataProvider";
import { resolveCtaHref } from "@/lib/cta";
import type { LeadClickSource } from "@/lib/lead-click-source";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import type { Cta } from "@/types/site";

type CtaLinkProps = {
  cta: Cta;
  variant?: ButtonVariant;
  className?: string;
  showArrow?: boolean;
  fullWidth?: boolean;
  style?: React.CSSProperties;
  leadClickSource?: LeadClickSource;
};

export function CtaLink({
  cta,
  variant = "primary",
  className,
  showArrow = true,
  fullWidth,
  style,
  leadClickSource,
}: CtaLinkProps) {
  const siteData = useSiteData();
  return (
    <Button
      href={resolveCtaHref(cta, siteData.site)}
      variant={variant}
      className={className}
      showArrow={showArrow}
      fullWidth={fullWidth}
      backgroundType={cta.backgroundType}
      backgroundColor={cta.backgroundColor}
      backgroundGradient={cta.backgroundGradient}
      textColor={cta.textColor}
      style={style}
      leadClickSource={leadClickSource}
    >
      {cta.label}
    </Button>
  );
}
