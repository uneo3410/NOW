import type { Card } from "../../cards/types";

type TodoCardNodeProps = {
  card: Card;
  isPending: boolean;
  onComplete: () => void;
};

export function TodoCardNode({ card, isPending, onComplete }: TodoCardNodeProps) {
  const isCompleted = Boolean(card.completedAt);

  return (
    <>
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase text-ember">
        <button
          aria-label={isCompleted ? "Todo 已完成" : "完成 Todo"}
          className={[
            "nodrag nopan grid size-5 shrink-0 place-items-center rounded-full border-2 border-ember/70 bg-surface transition",
            "hover:border-ember hover:bg-ember/10 focus:outline-none focus:ring-4 focus:ring-ember/20",
            isPending ? "scale-90 cursor-wait opacity-55" : "",
            isCompleted ? "cursor-default bg-ember text-white" : "cursor-pointer",
          ].join(" ")}
          disabled={isPending || isCompleted}
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
              "material-symbols-outlined text-[14px] leading-none transition",
              isPending ? "animate-pulse opacity-80" : "",
              isCompleted ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            check
          </span>
        </button>
        <span>{isPending ? "Saving" : isCompleted ? "Done" : "Todo"}</span>
      </div>
      <p className="line-clamp-6 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
        {card.content}
      </p>
    </>
  );
}
