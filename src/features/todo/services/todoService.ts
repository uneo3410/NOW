import type { Card } from "../../cards/types";
import type { TimelineNode } from "../../timeline/types";
import type { CardId } from "../../../types/id";
import { getCardById, updateCard } from "../../cards/services/cardService";
import {
  createTimelineNodeFromTodoCard,
  listTimelineNodesBySourceCardId,
} from "../../timeline/services/timelineService";
import { nowISO } from "../../../utils/date";

type CompleteTodoCardResult = {
  card: Card;
  timelineNode: TimelineNode;
};

const completionRequests = new Map<CardId, Promise<CompleteTodoCardResult>>();

export async function completeTodoCard(cardId: CardId): Promise<CompleteTodoCardResult> {
  const pendingRequest = completionRequests.get(cardId);

  if (pendingRequest) {
    return pendingRequest;
  }

  const request = completeTodoCardOnce(cardId);
  completionRequests.set(cardId, request);

  try {
    return await request;
  } finally {
    completionRequests.delete(cardId);
  }
}

async function completeTodoCardOnce(cardId: CardId): Promise<CompleteTodoCardResult> {
  const card = await getCardById(cardId);

  if (!card) {
    throw new Error(`Todo card not found: ${cardId}`);
  }

  if (card.type !== "todo") {
    throw new Error("只有 Todo 卡片可以被完成。");
  }

  const existingNode = await findExistingTodoTimelineNode(card.id);

  if (card.completedAt) {
    return {
      card,
      timelineNode: existingNode ?? (await createTimelineNodeFromTodoCard(card, card.completedAt)),
    };
  }

  if (existingNode) {
    const completedAt = existingNode.happenedAt;
    const updatedCard = await updateCard(card.id, {
      completedAt,
      archivedAt: completedAt,
    });

    return {
      card: updatedCard,
      timelineNode: existingNode,
    };
  }

  const completedAt = nowISO();
  const timelineNode = await createTimelineNodeFromTodoCard(card, completedAt);
  const updatedCard = await updateCard(card.id, {
    completedAt,
    archivedAt: completedAt,
  });

  return {
    card: updatedCard,
    timelineNode,
  };
}

async function findExistingTodoTimelineNode(cardId: CardId): Promise<TimelineNode | undefined> {
  const nodes = await listTimelineNodesBySourceCardId(cardId);
  return nodes.find((node) => node.source === "todo-card");
}
