import type { ISODateString } from "../../types/common";
import type { CardId, TimelineNodeId } from "../../types/id";

export type TimelineNodeSource = "manual" | "todo-card" | "import" | "system";

export type TimelineNode = {
  id: TimelineNodeId;
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
