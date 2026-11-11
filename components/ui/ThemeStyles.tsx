import { themeToCssVars } from "@/lib/theme";
import type { CustomButtonGradient, Theme } from "@/types/site";

export function ThemeStyles({
  theme,
  customGradients = [],
}: {
  theme: Theme;
  customGradients?: CustomButtonGradient[];
}) {
  return <style dangerouslySetInnerHTML={{ __html: themeToCssVars(theme, customGradients) }} />;
}
