import type { ISODateString } from "../../types/common";
import type { CardAssetId, CardId, DayWorkspaceId, EdgeId } from "../../types/id";
import type { LocalDateString } from "../day/types";

export type CardType = "thought" | "todo" | "sticky";

export type CardStyleVariant = "paper" | "glass" | "photo" | "tape";

export type CardImageFilter = "none" | "soft" | "mono" | "warm";

export type CardImageStyle = {
  filter?: CardImageFilter;
  rotate?: number;
  scale?: number;
  x?: number;
  y?: number;
};

export type CardStyle = {
  variant: CardStyleVariant;
  color?: string;
  backgroundImageId?: CardAssetId;
  image?: CardImageStyle;
};

export type Card = {
  id: CardId;
  dayId: DayWorkspaceId;
  date: LocalDateString;
  type: CardType;
  content: string;
  style?: CardStyle;
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
  style?: CardStyle;
  x?: number;
  y?: number;
};
