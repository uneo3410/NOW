import type { Table } from "dexie";
import type { Card, Edge } from "../features/cards/types";
import type { DayWorkspace } from "../features/day/types";
import type { Report } from "../features/reports/types";
import type { SettingRecord } from "../features/settings/types";
import type { ThemeAsset, TimelineThemeRecord } from "../features/timeline/theme/types";
import type { TimelineNode } from "../features/timeline/types";

export const DB_NAME = "now-timeline";
export const DB_VERSION = 3;

export const stores = {
  dayWorkspaces: "id, date, createdAt, updatedAt",
  cards: "id, dayId, date, type, createdAt, updatedAt, completedAt, archivedAt",
  edges: "id, dayId, date, fromCardId, toCardId, createdAt",
  timelineNodes: "id, dayId, date, happenedAt, createdAt, source, sourceCardId",
  reports: "id, type, periodStart, periodEnd, createdAt",
  settings: "key, updatedAt",
  themeAssets: "id, kind, createdAt, updatedAt",
  timelineThemes: "id, name, createdAt, updatedAt",
} as const;

export type NowTimelineTables = {
  dayWorkspaces: Table<DayWorkspace, string>;
  cards: Table<Card, string>;
  edges: Table<Edge, string>;
  timelineNodes: Table<TimelineNode, string>;
  reports: Table<Report, string>;
  settings: Table<SettingRecord, string>;
  themeAssets: Table<ThemeAsset, string>;
  timelineThemes: Table<TimelineThemeRecord, string>;
};
