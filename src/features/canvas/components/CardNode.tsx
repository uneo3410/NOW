import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { Card } from "../../cards/types";
import type { DayWorkspace } from "../../day/types";
import { useTodoActions } from "../../todo/hooks/useTodoActions";
import { StickyCardNode } from "./StickyCardNode";
import { ThoughtCardNode } from "./ThoughtCardNode";
import { TodoCardNode } from "./TodoCardNode";

type CardNodeData = {
  card: Card;
  workspace: DayWorkspace | null;
};

export function CardNode({ data, selected }: NodeProps) {
  const { card, workspace } = data as CardNodeData;
  const { completeTodo, pendingTodoIds } = useTodoActions();
  const isTodoPending = pendingTodoIds.has(card.id);
  const isSticky = card.type === "sticky";

  return (
    <article
      className={[
        "canvas-card-node relative w-64 border transition",
        isSticky
          ? "rounded-[1.1rem] border-transparent bg-transparent p-0"
          : "rounded-[1.35rem] border bg-white/75 p-4 shadow-soft backdrop-blur",
        isSticky ? "" : card.type === "todo" ? "border-ember/35" : "border-line",
        selected ? "is-selected ring-4 ring-moss/20" : "",
        isTodoPending ? "scale-95 opacity-60" : "",
      ].join(" ")}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
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
              void completeTodo(card.id, workspace);
            }}
          />
        ) : (
          card.type === "sticky" ? <StickyCardNode card={card} /> : <ThoughtCardNode card={card} />
        )}
      </div>
    </article>
  );
}
