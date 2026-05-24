import { useCallback, useState } from "react";
import { createCanvasCard } from "../../canvas/services/canvasService";
import type { CardType } from "../../cards/types";
import { useDayWorkspace } from "../../day/hooks/useDayWorkspace";
import { todayLocalDate } from "../../../utils/date";

type QuickCaptureInput = {
  content: string;
  type: CardType;
};

export function useQuickCapture() {
  const today = todayLocalDate();
  const { error: workspaceError, isLoading, workspace } = useDayWorkspace(today);
  const [createdCount, setCreatedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const createCapture = useCallback(
    async ({ content, type }: QuickCaptureInput) => {
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        setError("先写下一点内容。");
        return null;
      }

      if (!workspace) {
        setError("今天的工作区还没有准备好。");
        return null;
      }

      setError(null);
      const offset = createdCount * 36;
      const card = await createCanvasCard(
        {
          content: trimmedContent,
          type,
          x: 80 + offset,
          y: 80 + offset,
        },
        workspace,
      );

      setCreatedCount((count) => count + 1);
      setFeedback(type === "todo" ? "已放进今日 Todo" : "已放进今日画布");
      window.setTimeout(() => setFeedback(null), 1800);
      return card;
    },
    [createdCount, workspace],
  );

  return {
    createCapture,
    date: today,
    error: error ?? workspaceError,
    feedback,
    isLoading,
    workspace,
  };
}
