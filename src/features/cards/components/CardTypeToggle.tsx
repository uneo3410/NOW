import type { CardType } from "../types";

type CardTypeToggleProps = {
  value: CardType;
  onChange: (value: CardType) => void;
};

const options: Array<{ label: string; value: CardType }> = [
  { label: "想法", value: "thought" },
  { label: "Todo", value: "todo" },
  { label: "便签", value: "sticky" },
];

export function CardTypeToggle({ onChange, value }: CardTypeToggleProps) {
  return (
    <div className="grid grid-cols-3 rounded-full border border-line bg-white/50 p-1">
      {options.map((option) => (
        <button
          className={[
            "min-h-9 rounded-full px-4 text-sm font-medium transition",
            option.value === value ? "bg-ink text-surface shadow-soft" : "text-muted hover:text-ink",
          ].join(" ")}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
