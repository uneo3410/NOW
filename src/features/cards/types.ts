import type { ISODateString } from "../../types/common";
import type { CardId, EdgeId } from "../../types/id";

export type CardType = "thought" | "todo";

export type Card = {
  id: CardId;
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
  fromCardId: CardId;
  toCardId: CardId;
  createdAt: ISODateString;
};

export type CreateCardInput = {
  type: CardType;
  content: string;
  x?: number;
  y?: number;
};
