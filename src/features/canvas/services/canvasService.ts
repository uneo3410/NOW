import {
  create as createEdgeRecord,
  list as listEdgeRecords,
  put as putEdgeRecord,
  remove as removeEdge,
  removeByCardId,
} from "../../../db/repositories/edgeRepository";
import { put as putCardRecord } from "../../../db/repositories/cardRepository";
import { get as getSetting, set as setSetting } from "../../../db/repositories/settingRepository";
import type { Card, CardStyle, CreateCardInput, Edge } from "../../cards/types";
import type { DayWorkspace } from "../../day/types";
import type { CardId, EdgeId } from "../../../types/id";
import {
  createCard,
  deleteCard,
  listCards,
  updateCard,
} from "../../cards/services/cardService";
import { nowISO } from "../../../utils/date";
import { createId } from "../../../utils/id";
import type { CanvasPosition, CanvasViewport } from "../types";

type CreateCanvasEdgeInput = {
  fromCardId: CardId;
  fromHandleId?: string;
  toCardId: CardId;
  toHandleId?: string;
};

const GLOBAL_CANVAS_VIEWPORT_SETTING_KEY = "canvas.viewport.global";

export async function loadGlobalCanvas(): Promise<{
  cards: Card[];
  edges: Edge[];
  viewport: CanvasViewport | null;
}> {
  const [cards, edges, viewport] = await Promise.all([
    listCards(),
    listEdgeRecords(),
    loadGlobalCanvasViewport(),
  ]);
  const visibleCards = cards;
  const visibleCardIds = new Set(visibleCards.map((card) => card.id));
  const visibleEdges = edges.filter(
    (edge) => visibleCardIds.has(edge.fromCardId) && visibleCardIds.has(edge.toCardId),
  );

  return { cards: visibleCards, edges: visibleEdges, viewport };
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

export async function updateCanvasCardContent(cardId: CardId, content: string): Promise<Card> {
  return updateCard(cardId, {
    content: content.trim(),
  });
}

export async function updateCanvasCardStyle(cardId: CardId, style: CardStyle): Promise<Card> {
  return updateCard(cardId, {
    style,
  });
}

export async function deleteCanvasCard(cardId: CardId): Promise<void> {
  await removeByCardId(cardId);
  await deleteCard(cardId);
}

export async function restoreCanvasCard(card: Card): Promise<Card> {
  return putCardRecord(card);
}

export async function restoreCanvasEdges(edges: Edge[]): Promise<Edge[]> {
  return Promise.all(edges.map((edge) => putEdgeRecord(edge)));
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

export async function loadGlobalCanvasViewport(): Promise<CanvasViewport | null> {
  const record = await getSetting(GLOBAL_CANVAS_VIEWPORT_SETTING_KEY);
  return parseCanvasViewport(record?.value);
}

export async function saveGlobalCanvasViewport(viewport: CanvasViewport): Promise<CanvasViewport> {
  await setSetting(GLOBAL_CANVAS_VIEWPORT_SETTING_KEY, JSON.stringify(viewport));
  return viewport;
}

function parseCanvasViewport(value: string | undefined): CanvasViewport | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<CanvasViewport>;

    if (
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      typeof parsed.zoom === "number" &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y) &&
      Number.isFinite(parsed.zoom)
    ) {
      return {
        x: parsed.x,
        y: parsed.y,
        zoom: parsed.zoom,
      };
    }
  } catch {
    return null;
  }

  return null;
}
