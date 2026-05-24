import { getById as getThemeAssetById } from "../../../db/repositories/themeAssetRepository";
import type { ResolvedTimelineThemeConfig, TimelineThemeConfig } from "./types";

export type ResolvedTimelineThemeResult = {
  config: ResolvedTimelineThemeConfig;
  revoke: () => void;
};

export async function resolveTimelineTheme(
  theme: TimelineThemeConfig,
): Promise<ResolvedTimelineThemeResult> {
  const objectUrls: string[] = [];
  const resolved: ResolvedTimelineThemeConfig = {
    ...theme,
    wallpaper: { ...theme.wallpaper },
    cursor: { ...theme.cursor },
  };

  if (theme.wallpaper.type === "image" && theme.wallpaper.assetId) {
    const asset = await getThemeAssetById(theme.wallpaper.assetId);

    if (asset) {
      const imageUrl = URL.createObjectURL(asset.blob);
      objectUrls.push(imageUrl);
      resolved.wallpaper.imageUrl = imageUrl;
    }
  }

  if (theme.cursor.type === "image" && theme.cursor.assetId) {
    const asset = await getThemeAssetById(theme.cursor.assetId);

    if (asset) {
      const imageUrl = URL.createObjectURL(asset.blob);
      objectUrls.push(imageUrl);
      resolved.cursor.imageUrl = imageUrl;
    }
  }

  return {
    config: resolved,
    revoke: () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}
