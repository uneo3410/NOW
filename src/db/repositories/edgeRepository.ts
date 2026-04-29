import type { Edge } from "../../features/cards/types";
import type { CardId, EdgeId } from "../../types/id";
import { nowISO } from "../../utils/date";
import { createId } from "../../utils/id";
import { db } from "../client";

export type CreateEdgeInput = {
  fromCardId: CardId;
  toCardId: CardId;
};

export async function listEdges(): Promise<Edge[]> {
  return db.edges.orderBy("createdAt").toArray();
}

export async function createEdge(input: CreateEdgeInput): Promise<Edge> {
  const edge: Edge = {
    id: createId("edge"),
    fromCardId: input.fromCardId,
    toCardId: input.toCardId,
    createdAt: nowISO(),
  };

  await db.edges.add(edge);
  return edge;
}

export async function deleteEdge(id: EdgeId): Promise<void> {
  await db.edges.delete(id);
}

export async function deleteEdgesForCard(cardId: CardId): Promise<void> {
  const edgeIds = await db.edges
    .filter((edge) => edge.fromCardId === cardId || edge.toCardId === cardId)
    .primaryKeys();

  await db.edges.bulkDelete(edgeIds as EdgeId[]);
}
