import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { Card } from "../../cards/types";
import { useTodoActions } from "../../todo/hooks/useTodoActions";
import { ThoughtCardNode } from "./ThoughtCardNode";
import { TodoCardNode } from "./TodoCardNode";

type CardNodeData = {
  card: Card;
};

export function CardNode({ data, selected }: NodeProps) {
  const { card } = data as CardNodeData;
  const { completeTodo, pendingTodoIds } = useTodoActions();
  const isTodoPending = pendingTodoIds.has(card.id);

  return (
    <article
      className={[
        "canvas-card-node relative w-64 rounded-[1.35rem] border bg-white/75 p-4 shadow-soft backdrop-blur transition",
        card.type === "todo" ? "border-ember/35" : "border-line",
        selected ? "is-selected ring-4 ring-moss/20" : "",
        isTodoPending ? "scale-95 opacity-60" : "",
      ].join(" ")}
    >
      {[
        ["top", Position.Top],
        ["right", Position.Right],
        ["bottom", Position.Bottom],
        ["left", Position.Left],
      ].map(([id, position]) => (
        <Handle
          className="canvas-card-handle !size-4 !border-2 !border-surface !bg-moss !opacity-0 !transition"
          id={id as string}
          isConnectableEnd
          isConnectableStart
          key={id as string}
          position={position as Position}
          type="source"
        />
      ))}
      <div className="max-w-full">
        {card.type === "todo" ? (
          <TodoCardNode
            card={card}
            isPending={isTodoPending}
            onComplete={() => {
              void completeTodo(card.id);
            }}
          />
        ) : (
          <ThoughtCardNode card={card} />
        )}
      </div>
    </article>
  );
}
