import type { ISODateString } from "../../types/common";
import type { CardId, DayWorkspaceId, EdgeId } from "../../types/id";
import type { LocalDateString } from "../day/types";

export type CardType = "thought" | "todo";

export type Card = {
  id: CardId;
  dayId: DayWorkspaceId;
  date: LocalDateString;
  type: CardType;
  content: string;
  x: number;
  y: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  completedAt?: ISODateString;
  archivedAt?: ISODateString;
};

export type Edge = {
  id: EdgeId;
  dayId: DayWorkspaceId;
  date: LocalDateString;
  fromCardId: CardId;
  toCardId: CardId;
  fromHandleId?: string;
  toHandleId?: string;
  createdAt: ISODateString;
};

export type CreateCardInput = {
  type: CardType;
  content: string;
  x?: number;
  y?: number;
};
