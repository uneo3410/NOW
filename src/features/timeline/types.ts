import type { ISODateString } from "../../types/common";
import type { CardId, DayWorkspaceId, TimelineNodeId } from "../../types/id";
import type { LocalDateString } from "../day/types";

export type TimelineNodeSource = "manual" | "todo-card" | "import" | "system";

export type TimelineNode = {
  id: TimelineNodeId;
  dayId: DayWorkspaceId;
  date: LocalDateString;
  content: string;
  happenedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  source: TimelineNodeSource;
  sourceCardId?: CardId;
  tags?: string[];
};

export type CreateTimelineNodeInput = {
  content: string;
  happenedAt?: ISODateString;
  source?: TimelineNodeSource;
  sourceCardId?: CardId;
  tags?: string[];
};
