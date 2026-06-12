import {
  createFromFile,
  getById,
} from "../../../db/repositories/themeAssetRepository";
import type { CardAssetId } from "../../../types/id";
import type { ThemeAsset } from "../../timeline/theme/types";

const MAX_CARD_IMAGE_BYTES = 6 * 1024 * 1024;

export async function createCardBackgroundAsset(file: File): Promise<ThemeAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("只能上传图片文件。");
  }

  if (file.size > MAX_CARD_IMAGE_BYTES) {
    throw new Error("图片不能超过 6MB。");
  }

  return createFromFile("card-background", file);
}

export async function createCardAssetObjectUrl(assetId: CardAssetId): Promise<string | null> {
  const asset = await getById(assetId);

  if (!asset || !asset.mimeType.startsWith("image/")) {
    return null;
  }

  return URL.createObjectURL(asset.blob);
}
