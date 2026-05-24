import type { ThemeAsset } from "../../features/timeline/theme/types";
import type { ThemeAssetId } from "../../types/id";
import { nowISO } from "../../utils/date";
import { createId } from "../../utils/id";
import { db } from "../client";

export async function getById(id: ThemeAssetId): Promise<ThemeAsset | undefined> {
  return db.themeAssets.get(id);
}

export async function createFromFile(
  kind: ThemeAsset["kind"],
  file: File,
): Promise<ThemeAsset> {
  const timestamp = nowISO();
  const asset: ThemeAsset = {
    id: createId("asset"),
    kind,
    blob: file,
    mimeType: file.type || "application/octet-stream",
    name: file.name,
    size: file.size,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.themeAssets.add(asset);
  return asset;
}

export async function remove(id: ThemeAssetId): Promise<void> {
  await db.themeAssets.delete(id);
}
