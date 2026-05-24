import type { ISODateString } from "../../types/common";
import type { DayWorkspaceId } from "../../types/id";
import type { CanvasViewport } from "../canvas/types";

export type LocalDateString = string;

export type DayWorkspace = {
  id: DayWorkspaceId;
  date: LocalDateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  canvasViewport?: CanvasViewport;
};
