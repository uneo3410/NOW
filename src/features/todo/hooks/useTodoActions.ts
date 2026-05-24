import { useCallback, useState } from "react";
import { useCardStore } from "../../../stores/cardStore";
import { useEdgeStore } from "../../../stores/edgeStore";
import { useTimelineStore } from "../../../stores/timelineStore";
import { useUiStore } from "../../../stores/uiStore";
import type { CardId } from "../../../types/id";
import { completeTodoCard } from "../services/todoService";

export function useTodoActions() {
  const [pendingTodoIds, setPendingTodoIds] = useState<Set<CardId>>(() => new Set());
  const removeCard = useCardStore((state) => state.removeCard);
  const setCardError = useCardStore((state) => state.setError);
  const removeEdgesByCardId = useEdgeStore((state) => state.removeEdgesByCardId);
  const addTimelineNode = useTimelineStore((state) => state.addNode);
  const setFeedback = useUiStore((state) => state.setFeedback);

  const completeTodo = useCallback(
    async (cardId: CardId) => {
      if (pendingTodoIds.has(cardId)) {
        return null;
      }

      setPendingTodoIds((current) => new Set(current).add(cardId));
      setCardError(null);

      try {
        const result = await completeTodoCard(cardId);
        removeCard(result.card.id);
        removeEdgesByCardId(result.card.id);
        addTimelineNode(result.timelineNode);
        setFeedback("已保存到时间线");
        window.setTimeout(() => {
          setFeedback(null);
        }, 1800);
        return result;
      } catch (error) {
        setCardError(error instanceof Error ? error.message : String(error));
        return null;
      } finally {
        setPendingTodoIds((current) => {
          const next = new Set(current);
          next.delete(cardId);
          return next;
        });
      }
    },
    [
      addTimelineNode,
      pendingTodoIds,
      removeCard,
      removeEdgesByCardId,
      setCardError,
      setFeedback,
    ],
  );

  return {
    completeTodo,
    pendingTodoIds,
  };
}
