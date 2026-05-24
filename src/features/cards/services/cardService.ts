import {
  create,
  getById,
  list,
  listByDate,
  listByDayId,
  remove,
  update,
} from "../../../db/repositories/cardRepository";
import type { Card, CreateCardInput } from "../types";
import type { DayWorkspace, LocalDateString } from "../../day/types";
import type { CardId } from "../../../types/id";
import { nowISO } from "../../../utils/date";
import { createId } from "../../../utils/id";

export async function listCards(): Promise<Card[]> {
  return list();
}

export async function listCardsByDate(date: LocalDateString): Promise<Card[]> {
  return listByDate(date);
}

export async function listCardsByDayId(dayId: string): Promise<Card[]> {
  return listByDayId(dayId);
}

export async function getCardById(id: CardId): Promise<Card | undefined> {
  return getById(id);
}

export async function createCard(input: CreateCardInput, workspace: DayWorkspace): Promise<Card> {
  const timestamp = nowISO();
  const card: Card = {
    id: createId("card"),
    dayId: workspace.id,
    date: workspace.date,
    type: input.type,
    content: input.content.trim(),
    x: input.x ?? 0,
    y: input.y ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return create(card);
}

export async function updateCard(id: CardId, patch: Partial<Card>): Promise<Card> {
  return update(id, {
    ...patch,
    updatedAt: nowISO(),
  });
}

export async function deleteCard(id: CardId): Promise<void> {
  await remove(id);
}
