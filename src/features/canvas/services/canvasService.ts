import {
  create as createEdgeRecord,
  listByDayId as listEdgesByDayId,
  remove as removeEdge,
  removeByCardIdAndDayId,
} from "../../../db/repositories/edgeRepository";
import type { Card, CreateCardInput, Edge } from "../../cards/types";
import type { DayWorkspace } from "../../day/types";
import type { CardId, EdgeId } from "../../../types/id";
import {
  createCard,
  deleteCard,
  listCardsByDayId,
  updateCard,
} from "../../cards/services/cardService";
import { nowISO } from "../../../utils/date";
import { createId } from "../../../utils/id";
import type { CanvasPosition } from "../types";

type CreateCanvasEdgeInput = {
  fromCardId: CardId;
  fromHandleId?: string;
  toCardId: CardId;
  toHandleId?: string;
};

export async function loadCanvasByDay(
  workspace: DayWorkspace,
): Promise<{ cards: Card[]; edges: Edge[] }> {
  const [cards, edges] = await Promise.all([
    listCardsByDayId(workspace.id),
    listEdgesByDayId(workspace.id),
  ]);
  const visibleCards = cards.filter((card) => !card.completedAt && !card.archivedAt);
  const visibleCardIds = new Set(visibleCards.map((card) => card.id));
  const visibleEdges = edges.filter(
    (edge) => visibleCardIds.has(edge.fromCardId) && visibleCardIds.has(edge.toCardId),
  );

  return { cards: visibleCards, edges: visibleEdges };
}

export async function createCanvasCard(
  input: CreateCardInput,
  workspace: DayWorkspace,
): Promise<Card> {
  return createCard(input, workspace);
}

export async function updateCardPosition(
  cardId: CardId,
  position: CanvasPosition,
): Promise<Card> {
  return updateCard(cardId, {
    x: position.x,
    y: position.y,
  });
}

export async function deleteCanvasCard(cardId: CardId, workspace: DayWorkspace): Promise<void> {
  await removeByCardIdAndDayId(cardId, workspace.id);
  await deleteCard(cardId);
}

export async function createCanvasEdge(
  input: CreateCanvasEdgeInput,
  workspace: DayWorkspace,
): Promise<Edge> {
  const edge: Edge = {
    id: createId("edge"),
    dayId: workspace.id,
    date: workspace.date,
    fromCardId: input.fromCardId,
    fromHandleId: input.fromHandleId,
    toCardId: input.toCardId,
    toHandleId: input.toHandleId,
    createdAt: nowISO(),
  };

  return createEdgeRecord(edge);
}

export async function deleteCanvasEdge(edgeId: EdgeId): Promise<void> {
  await removeEdge(edgeId);
}
