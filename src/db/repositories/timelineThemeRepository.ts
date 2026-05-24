import type {
  TimelineThemeConfig,
  TimelineThemeRecord,
} from "../../features/timeline/theme/types";
import type { TimelineThemeId } from "../../types/id";
import { nowISO } from "../../utils/date";
import { db } from "../client";

export async function getById(
  id: TimelineThemeId,
): Promise<TimelineThemeRecord | undefined> {
  return db.timelineThemes.get(id);
}

export async function list(): Promise<TimelineThemeRecord[]> {
  return db.timelineThemes.orderBy("updatedAt").reverse().toArray();
}

export async function upsert(theme: TimelineThemeConfig): Promise<TimelineThemeRecord> {
  const existing = await getById(theme.id);
  const timestamp = nowISO();
  const record: TimelineThemeRecord = {
    ...theme,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await db.timelineThemes.put(record);
  return record;
}

export async function remove(id: TimelineThemeId): Promise<void> {
  await db.timelineThemes.delete(id);
}
