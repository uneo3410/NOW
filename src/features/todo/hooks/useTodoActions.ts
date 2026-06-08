import { useCallback, useState } from "react";
import { useCardStore } from "../../../stores/cardStore";
import { useTimelineStore } from "../../../stores/timelineStore";
import { useUiStore } from "../../../stores/uiStore";
import type { CardId } from "../../../types/id";
import type { DayWorkspace } from "../../day/types";
import { completeTodoCard } from "../services/todoService";

export function useTodoActions() {
  const [pendingTodoIds, setPendingTodoIds] = useState<Set<CardId>>(() => new Set());
  const updateCard = useCardStore((state) => state.updateCard);
  const setCardError = useCardStore((state) => state.setError);
  const addTimelineNode = useTimelineStore((state) => state.addNode);
  const setFeedback = useUiStore((state) => state.setFeedback);

  const completeTodo = useCallback(
    async (cardId: CardId, workspace: DayWorkspace | null) => {
      if (pendingTodoIds.has(cardId)) {
        return null;
      }

      if (!workspace) {
        setCardError("当前日期工作区还没有准备好。");
        return null;
      }

      setPendingTodoIds((current) => new Set(current).add(cardId));
      setCardError(null);

      try {
        const result = await completeTodoCard(cardId, workspace);
        updateCard(result.card.id, result.card);

        if (result.createdTimelineNode && result.timelineNode.date === workspace.date) {
          addTimelineNode(result.timelineNode);
        }

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
      setCardError,
      setFeedback,
      updateCard,
    ],
  );

  return {
    completeTodo,
    pendingTodoIds,
  };
}
