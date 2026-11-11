import type { LifestyleCard as LifestyleCardType } from "@/types/site";
import { Icon } from "@/components/ui/Icon";
import { textStyle } from "@/lib/typography";

export function LifestyleCard({ cards }: { cards: LifestyleCardType[] }) {
  return (
    <div className="w-[min(540px,88vw)] rounded-xl bg-white px-2 py-4 shadow-[0_18px_40px_rgba(11,31,53,0.14)] sm:px-4 sm:py-5">
      <ul
        className="grid divide-x divide-[#eee8df] text-center"
        style={{ gridTemplateColumns: `repeat(${Math.max(cards.length, 1)}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => (
          <li key={card.title} className="px-1.5 sm:px-3">
            <Icon name={card.icon} className="mx-auto mb-1.5 size-6 text-[var(--color-secondary)] sm:mb-2 sm:size-7" style={card.iconColor ? { color: card.iconColor } : undefined} />
            <p
              className="text-[13px] font-semibold leading-none text-[var(--color-secondary)] sm:text-[14px]"
              style={{
                ...textStyle(card, "title"),
                ...(card.titleColor || card.textColor ? { color: card.titleColor || card.textColor } : {}),
              }}
            >
              {card.title}
            </p>
            <p
              className="mt-1 text-[10px] leading-tight text-[var(--color-muted)] sm:text-[12px]"
              style={{
                ...textStyle(card, "subtitle"),
                ...(card.subtitleColor || card.textColor ? { color: card.subtitleColor || card.textColor } : {}),
              }}
            >
              {card.subtitle}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
