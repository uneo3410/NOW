import type { Card } from "../../cards/types";

type TodoCardNodeProps = {
  card: Card;
  isPending: boolean;
  onComplete: () => void;
};

export function TodoCardNode({ card, isPending, onComplete }: TodoCardNodeProps) {
  return (
    <>
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-ember">
        <button
          aria-label="完成 Todo"
          className={[
            "nodrag nopan grid size-5 shrink-0 place-items-center rounded-full border-2 border-ember/70 bg-surface transition",
            "hover:border-ember hover:bg-ember/10 focus:outline-none focus:ring-4 focus:ring-ember/20",
            isPending ? "scale-90 cursor-wait opacity-55" : "cursor-pointer",
          ].join(" ")}
          disabled={isPending}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onComplete();
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          type="button"
        >
          <span
            className={[
              "size-2 rounded-full bg-ember transition",
              isPending ? "animate-pulse opacity-80" : "opacity-0",
            ].join(" ")}
          />
        </button>
        <span>{isPending ? "Saving" : "Todo"}</span>
      </div>
      <p className="line-clamp-6 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
        {card.content}
      </p>
    </>
  );
}
