import type { Card, CreateCardInput } from "../../features/cards/types";
import type { CardId } from "../../types/id";
import { nowISO } from "../../utils/date";
import { createId } from "../../utils/id";
import { db } from "../client";

export async function listCards(): Promise<Card[]> {
  return db.cards.orderBy("createdAt").toArray();
}

export async function getCard(id: CardId): Promise<Card | undefined> {
  return db.cards.get(id);
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const timestamp = nowISO();
  const card: Card = {
    id: createId("card"),
    type: input.type,
    content: input.content,
    x: input.x ?? 0,
    y: input.y ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.cards.add(card);
  return card;
}

export async function updateCard(id: CardId, patch: Partial<Omit<Card, "id" | "createdAt">>) {
  await db.cards.update(id, {
    ...patch,
    updatedAt: nowISO(),
  });
  return db.cards.get(id);
}

export async function deleteCard(id: CardId): Promise<void> {
  await db.cards.delete(id);
}
