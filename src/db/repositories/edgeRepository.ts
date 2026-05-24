import type { Edge } from "../../features/cards/types";
import type { LocalDateString } from "../../features/day/types";
import type { CardId, EdgeId } from "../../types/id";
import { db } from "../client";

export async function list(): Promise<Edge[]> {
  return db.edges.orderBy("createdAt").toArray();
}

export async function listByDate(date: LocalDateString): Promise<Edge[]> {
  return db.edges.where("date").equals(date).sortBy("createdAt");
}

export async function listByDayId(dayId: string): Promise<Edge[]> {
  return db.edges.where("dayId").equals(dayId).sortBy("createdAt");
}

export async function create(edge: Edge): Promise<Edge> {
  await db.edges.add(edge);
  return edge;
}

export async function put(edge: Edge): Promise<Edge> {
  await db.edges.put(edge);
  return edge;
}

export async function getById(id: EdgeId): Promise<Edge | undefined> {
  return db.edges.get(id);
}

export async function getByCardId(cardId: CardId): Promise<Edge[]> {
  return db.edges
    .filter((edge) => edge.fromCardId === cardId || edge.toCardId === cardId)
    .toArray();
}

export async function getByCardIdAndDayId(cardId: CardId, dayId: string): Promise<Edge[]> {
  return db.edges
    .where("dayId")
    .equals(dayId)
    .filter((edge) => edge.fromCardId === cardId || edge.toCardId === cardId)
    .toArray();
}

export async function remove(id: EdgeId): Promise<void> {
  await db.edges.delete(id);
}

export async function removeByCardId(cardId: CardId): Promise<void> {
  const edgeIds = await db.edges
    .filter((edge) => edge.fromCardId === cardId || edge.toCardId === cardId)
    .primaryKeys();

  await db.edges.bulkDelete(edgeIds as EdgeId[]);
}

export async function removeByCardIdAndDayId(cardId: CardId, dayId: string): Promise<void> {
  const edgeIds = await db.edges
    .where("dayId")
    .equals(dayId)
    .filter((edge) => edge.fromCardId === cardId || edge.toCardId === cardId)
    .primaryKeys();

  await db.edges.bulkDelete(edgeIds as EdgeId[]);
}
