import type { CardId, EdgeId } from "../../types/id";

export type CanvasViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CanvasSelection = {
  cardIds: CardId[];
  edgeIds: EdgeId[];
};
