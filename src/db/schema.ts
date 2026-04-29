import type { Table } from "dexie";
import type { Card, Edge } from "../features/cards/types";
import type { Report } from "../features/reports/types";
import type { TimelineNode } from "../features/timeline/types";

export const DB_NAME = "now-timeline";
export const DB_VERSION = 1;

export const stores = {
  cards: "id, type, createdAt, updatedAt, completedAt, archivedAt",
  edges: "id, fromCardId, toCardId, createdAt",
  timelineNodes: "id, happenedAt, createdAt, source, sourceCardId",
  reports: "id, type, periodStart, periodEnd, createdAt",
} as const;

export type NowTimelineTables = {
  cards: Table<Card, string>;
  edges: Table<Edge, string>;
  timelineNodes: Table<TimelineNode, string>;
  reports: Table<Report, string>;
};
