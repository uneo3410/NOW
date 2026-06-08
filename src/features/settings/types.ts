import type { ISODateString } from "../../types/common";

export type SettingKey = "activeTimelineThemeId" | "canvas.viewport.global";

export type SettingRecord = {
  key: SettingKey;
  updatedAt: ISODateString;
  value: string;
};
