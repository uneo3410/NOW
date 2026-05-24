import Dexie from "dexie";
import type { Card, Edge } from "../features/cards/types";
import type { DayWorkspace } from "../features/day/types";
import type { Report } from "../features/reports/types";
import type { SettingRecord } from "../features/settings/types";
import type { ThemeAsset, TimelineThemeRecord } from "../features/timeline/theme/types";
import type { TimelineNode } from "../features/timeline/types";
import { DB_NAME, DB_VERSION, stores } from "./schema";

class NowTimelineDatabase extends Dexie {
  dayWorkspaces!: Dexie.Table<DayWorkspace, string>;
  cards!: Dexie.Table<Card, string>;
  edges!: Dexie.Table<Edge, string>;
  timelineNodes!: Dexie.Table<TimelineNode, string>;
  reports!: Dexie.Table<Report, string>;
  settings!: Dexie.Table<SettingRecord, string>;
  themeAssets!: Dexie.Table<ThemeAsset, string>;
  timelineThemes!: Dexie.Table<TimelineThemeRecord, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores(stores);
  }
}

export const db = new NowTimelineDatabase();
