import type { ISODateString } from "../../types/common";

export type SettingKey = "activeTimelineThemeId";

export type SettingRecord = {
  key: SettingKey;
  updatedAt: ISODateString;
  value: string;
};
