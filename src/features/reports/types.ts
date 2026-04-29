import type { ISODateString } from "../../types/common";
import type { ReportId, TimelineNodeId } from "../../types/id";

export type ReportType = "weekly" | "monthly" | "yearly" | "custom";

export type Report = {
  id: ReportId;
  type: ReportType;
  title: string;
  content: string;
  periodStart: ISODateString;
  periodEnd: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  sourceNodeIds: TimelineNodeId[];
  model?: string;
};
