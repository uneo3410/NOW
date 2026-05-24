import type { SettingKey, SettingRecord } from "../../features/settings/types";
import { nowISO } from "../../utils/date";
import { db } from "../client";

export async function get(key: SettingKey): Promise<SettingRecord | undefined> {
  return db.settings.get(key);
}

export async function set(key: SettingKey, value: string): Promise<SettingRecord> {
  const record: SettingRecord = {
    key,
    updatedAt: nowISO(),
    value,
  };

  await db.settings.put(record);
  return record;
}

export async function remove(key: SettingKey): Promise<void> {
  await db.settings.delete(key);
}
