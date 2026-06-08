import type { Card } from "../../cards/types";
import type { DayWorkspace } from "../../day/types";
import type { TimelineNode } from "../../timeline/types";
import type { CardId } from "../../../types/id";
import { getCardById, updateCard } from "../../cards/services/cardService";
import {
  createTimelineNodeFromTodoCard,
  listTimelineNodesBySourceCardId,
} from "../../timeline/services/timelineService";
import { toISOWithLocalDateTime } from "../../../utils/date";

type CompleteTodoCardResult = {
  card: Card;
  createdTimelineNode: boolean;
  timelineNode: TimelineNode;
};

const completionRequests = new Map<string, Promise<CompleteTodoCardResult>>();

export async function completeTodoCard(
  cardId: CardId,
  workspace: DayWorkspace,
): Promise<CompleteTodoCardResult> {
  const requestKey = `${cardId}:${workspace.id}`;
  const pendingRequest = completionRequests.get(requestKey);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = completeTodoCardOnce(cardId, workspace);
  completionRequests.set(requestKey, request);

  try {
    return await request;
  } finally {
    completionRequests.delete(requestKey);
  }
}

async function completeTodoCardOnce(
  cardId: CardId,
  workspace: DayWorkspace,
): Promise<CompleteTodoCardResult> {
  const card = await getCardById(cardId);

  if (!card) {
    throw new Error(`Todo card not found: ${cardId}`);
  }

  if (card.type !== "todo") {
    throw new Error("只有 Todo 卡片可以被完成。");
  }

  const existingNode = await findExistingTodoTimelineNode(card.id);

  if (card.completedAt) {
    if (existingNode) {
      return {
        card,
        createdTimelineNode: false,
        timelineNode: existingNode,
      };
    }

    const timelineNode = await createTimelineNodeFromTodoCard(card, card.completedAt, workspace);

    return {
      card,
      createdTimelineNode: true,
      timelineNode,
    };
  }

  if (existingNode) {
    const completedAt = existingNode.happenedAt;
    const updatedCard = await updateCard(card.id, {
      completedAt,
      archivedAt: undefined,
    });

    return {
      card: updatedCard,
      createdTimelineNode: false,
      timelineNode: existingNode,
    };
  }

  const completedAt = toISOWithLocalDateTime(workspace.date);
  const timelineNode = await createTimelineNodeFromTodoCard(card, completedAt, workspace);
  const updatedCard = await updateCard(card.id, {
    completedAt,
    archivedAt: undefined,
  });

  return {
    card: updatedCard,
    createdTimelineNode: true,
    timelineNode,
  };
}

async function findExistingTodoTimelineNode(cardId: CardId): Promise<TimelineNode | undefined> {
  const nodes = await listTimelineNodesBySourceCardId(cardId);
  return nodes.find((node) => node.source === "todo-card");
}
