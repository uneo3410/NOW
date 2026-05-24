import type { Card } from "../../features/cards/types";
import type { LocalDateString } from "../../features/day/types";
import type { CardId } from "../../types/id";
import { db } from "../client";

export async function list(): Promise<Card[]> {
  return db.cards.orderBy("createdAt").toArray();
}

export async function listByDate(date: LocalDateString): Promise<Card[]> {
  return db.cards.where("date").equals(date).sortBy("createdAt");
}

export async function listByDayId(dayId: string): Promise<Card[]> {
  return db.cards.where("dayId").equals(dayId).sortBy("createdAt");
}

export async function getById(id: CardId): Promise<Card | undefined> {
  return db.cards.get(id);
}

export async function create(card: Card): Promise<Card> {
  await db.cards.add(card);
  return card;
}

export async function update(id: CardId, patch: Partial<Card>): Promise<Card> {
  await db.cards.update(id, patch);
  const card = await getById(id);

  if (!card) {
    throw new Error(`Card not found: ${id}`);
  }

  return card;
}

export async function remove(id: CardId): Promise<void> {
  await db.cards.delete(id);
}
