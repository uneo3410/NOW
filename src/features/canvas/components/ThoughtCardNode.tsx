import type { Card } from "../../cards/types";

type ThoughtCardNodeProps = {
  card: Card;
};

export function ThoughtCardNode({ card }: ThoughtCardNodeProps) {
  return (
    <>
      <div className="mb-3 text-xs font-medium uppercase text-moss">Thought</div>
      <p className="line-clamp-6 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
        {card.content}
      </p>
    </>
  );
}
