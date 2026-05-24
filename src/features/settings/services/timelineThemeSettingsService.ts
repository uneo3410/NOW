import {
  get as getSetting,
  set as setSetting,
} from "../../../db/repositories/settingRepository";
import {
  createFromFile,
  remove as removeThemeAsset,
} from "../../../db/repositories/themeAssetRepository";
import {
  getById as getTimelineThemeById,
  list as listStoredTimelineThemes,
  remove as removeTimelineTheme,
  upsert as upsertTimelineTheme,
} from "../../../db/repositories/timelineThemeRepository";
import type { TimelineThemeId } from "../../../types/id";
import { createId } from "../../../utils/id";
import {
  cloneTimelineTheme,
  createLocalTimelineThemeDraft,
  defaultTimelineTheme,
} from "../../timeline/theme/defaultTheme";
import {
  DEFAULT_TIMELINE_THEME_ID,
  LOCAL_TIMELINE_THEME_ID,
  type TimelineThemeConfig,
  type TimelineThemeRecord,
} from "../../timeline/theme/types";

type SaveTimelineThemeInput = {
  activate?: boolean;
  cursorFile?: File | null;
  theme: TimelineThemeConfig;
  wallpaperFile?: File | null;
};

export type TimelineThemeOption = {
  id: TimelineThemeId;
  isDefault: boolean;
  name: string;
  updatedAt?: string;
};

export async function getActiveTimelineTheme(): Promise<TimelineThemeConfig> {
  const setting = await getSetting("activeTimelineThemeId");
  const activeThemeId = setting?.value || DEFAULT_TIMELINE_THEME_ID;

  return getTimelineThemeByIdOrDefault(activeThemeId);
}

export async function getActiveTimelineThemeId(): Promise<TimelineThemeId> {
  const setting = await getSetting("activeTimelineThemeId");
  return setting?.value || DEFAULT_TIMELINE_THEME_ID;
}

export async function setActiveTimelineTheme(id: TimelineThemeId): Promise<void> {
  await setSetting("activeTimelineThemeId", id);
}

export async function getLocalTimelineThemeDraft(): Promise<TimelineThemeConfig> {
  const existing = await getTimelineThemeById(LOCAL_TIMELINE_THEME_ID);

  if (existing) {
    return stripTimelineThemeRecord(existing);
  }

  return createLocalTimelineThemeDraft();
}

export async function saveLocalTimelineTheme({
  activate = true,
  cursorFile,
  theme,
  wallpaperFile,
}: SaveTimelineThemeInput): Promise<TimelineThemeRecord> {
  const previous = await getTimelineThemeById(theme.id);
  const nextTheme = sanitizeTimelineThemeForStorage({
    ...cloneTimelineTheme(theme),
    id: LOCAL_TIMELINE_THEME_ID,
  });

  if (nextTheme.wallpaper.type === "image" && wallpaperFile) {
    const asset = await createFromFile("wallpaper", wallpaperFile);
    nextTheme.wallpaper = {
      ...nextTheme.wallpaper,
      assetId: asset.id,
      imageUrl: undefined,
      type: "image",
    };
  }

  if (nextTheme.cursor.type === "image" && cursorFile) {
    const asset = await createFromFile("cursor", cursorFile);
    nextTheme.cursor = {
      ...nextTheme.cursor,
      assetId: asset.id,
      imageUrl: undefined,
      type: "image",
    };
  }

  const record = await upsertTimelineTheme(nextTheme);

  if (activate) {
    await setActiveTimelineTheme(record.id);
  }

  await removeReplacedAssets(previous, record);
  return record;
}

export async function listTimelineThemeOptions(): Promise<TimelineThemeOption[]> {
  const storedThemes = await listStoredTimelineThemes();

  return [
    {
      id: DEFAULT_TIMELINE_THEME_ID,
      isDefault: true,
      name: defaultTimelineTheme.name,
    },
    ...storedThemes.map((theme) => ({
      id: theme.id,
      isDefault: false,
      name: theme.name,
      updatedAt: theme.updatedAt,
    })),
  ];
}

export async function getTimelineThemeDraftById(
  id: TimelineThemeId,
): Promise<TimelineThemeConfig> {
  if (id === DEFAULT_TIMELINE_THEME_ID) {
    return cloneTimelineTheme(defaultTimelineTheme);
  }

  const existing = await getTimelineThemeById(id);
  return existing ? stripTimelineThemeRecord(existing) : cloneTimelineTheme(defaultTimelineTheme);
}

export function createTimelineThemeDraftFromBase(
  baseTheme: TimelineThemeConfig,
): TimelineThemeConfig {
  const draft = sanitizeTimelineThemeForStorage({
    ...cloneTimelineTheme(baseTheme),
    id: createId("theme"),
    name: `${baseTheme.name || "Timeline Theme"} Copy`,
  });

  draft.wallpaper.assetId = baseTheme.wallpaper.assetId;
  draft.cursor.assetId = baseTheme.cursor.assetId;
  return draft;
}

export async function saveTimelineTheme({
  activate = true,
  cursorFile,
  theme,
  wallpaperFile,
}: SaveTimelineThemeInput): Promise<TimelineThemeRecord> {
  const themeToSave =
    theme.id === DEFAULT_TIMELINE_THEME_ID
      ? {
          ...cloneTimelineTheme(theme),
          id: createId("theme"),
          name:
            theme.name === defaultTimelineTheme.name
              ? "自定义时间线主题"
              : theme.name,
        }
      : cloneTimelineTheme(theme);
  const previous = await getTimelineThemeById(themeToSave.id);
  const nextTheme = sanitizeTimelineThemeForStorage(themeToSave);

  if (nextTheme.wallpaper.type === "image" && wallpaperFile) {
    const asset = await createFromFile("wallpaper", wallpaperFile);
    nextTheme.wallpaper = {
      ...nextTheme.wallpaper,
      assetId: asset.id,
      imageUrl: undefined,
      type: "image",
    };
  }

  if (nextTheme.cursor.type === "image" && cursorFile) {
    const asset = await createFromFile("cursor", cursorFile);
    nextTheme.cursor = {
      ...nextTheme.cursor,
      assetId: asset.id,
      imageUrl: undefined,
      type: "image",
    };
  }

  const record = await upsertTimelineTheme(nextTheme);

  if (activate) {
    await setActiveTimelineTheme(record.id);
  }

  await removeReplacedAssets(previous, record);
  return record;
}

export async function deleteTimelineTheme(id: TimelineThemeId): Promise<void> {
  if (id === DEFAULT_TIMELINE_THEME_ID) {
    return;
  }

  const theme = await getTimelineThemeById(id);
  await removeTimelineTheme(id);
  await Promise.all(
    [theme?.wallpaper.assetId, theme?.cursor.assetId]
      .filter((assetId): assetId is string => Boolean(assetId))
      .map((assetId) => removeThemeAsset(assetId)),
  );

  const activeThemeId = await getActiveTimelineThemeId();

  if (activeThemeId === id) {
    await activateDefaultTimelineTheme();
  }
}

export async function activateDefaultTimelineTheme(): Promise<void> {
  await setActiveTimelineTheme(DEFAULT_TIMELINE_THEME_ID);
}

async function getTimelineThemeByIdOrDefault(id: TimelineThemeId): Promise<TimelineThemeConfig> {
  if (id === DEFAULT_TIMELINE_THEME_ID) {
    return cloneTimelineTheme(defaultTimelineTheme);
  }

  const storedTheme = await getTimelineThemeById(id);

  if (!storedTheme) {
    return cloneTimelineTheme(defaultTimelineTheme);
  }

  return stripTimelineThemeRecord(storedTheme);
}

function stripTimelineThemeRecord(record: TimelineThemeRecord): TimelineThemeConfig {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...theme } = record;
  return sanitizeTimelineThemeForStorage(theme);
}

function sanitizeTimelineThemeForStorage(theme: TimelineThemeConfig): TimelineThemeConfig {
  const inputTheme = cloneTimelineTheme(theme);
  const sanitized: TimelineThemeConfig = {
    ...cloneTimelineTheme(defaultTimelineTheme),
    ...inputTheme,
    beam: {
      ...defaultTimelineTheme.beam,
      ...inputTheme.beam,
    },
    card: {
      ...defaultTimelineTheme.card,
      ...inputTheme.card,
    },
    cursor: {
      ...defaultTimelineTheme.cursor,
      ...inputTheme.cursor,
      hotspot: {
        ...defaultTimelineTheme.cursor.hotspot,
        ...inputTheme.cursor?.hotspot,
      },
    },
    depth: {
      ...defaultTimelineTheme.depth,
      ...inputTheme.depth,
    },
    halo: {
      ...defaultTimelineTheme.halo,
      ...inputTheme.halo,
    },
    nowInput: {
      ...defaultTimelineTheme.nowInput,
      ...inputTheme.nowInput,
    },
    particles: {
      ...defaultTimelineTheme.particles,
      ...inputTheme.particles,
    },
    wallpaper: {
      ...defaultTimelineTheme.wallpaper,
      ...inputTheme.wallpaper,
    },
  };

  sanitized.version = 1;
  sanitized.wallpaper.blur = clamp(sanitized.wallpaper.blur, 0, 28);
  sanitized.wallpaper.dim = clamp(sanitized.wallpaper.dim, 0, 0.72);
  sanitized.wallpaper.imageUrl = undefined;

  if (sanitized.wallpaper.type !== "image") {
    sanitized.wallpaper.assetId = undefined;
  }

  sanitized.particles.density = clamp(sanitized.particles.density, 4500, 60000);
  sanitized.particles.glow = clamp(sanitized.particles.glow, 0, 18);
  sanitized.particles.maxCount = Math.round(clamp(sanitized.particles.maxCount, 42, 260));
  sanitized.particles.mobileMaxCount = Math.round(clamp(sanitized.particles.mobileMaxCount, 16, 120));
  sanitized.particles.pointerForce = clamp(sanitized.particles.pointerForce, 0, 4);
  sanitized.particles.pointerRadius = clamp(sanitized.particles.pointerRadius, 0, 220);
  sanitized.particles.speed = clamp(sanitized.particles.speed, 0, 0.42);
  sanitized.particles.breathAmplitude = clamp(sanitized.particles.breathAmplitude, 0, 0.5);
  sanitized.particles.alphaRange = normalizeRange(sanitized.particles.alphaRange, 0.03, 0.58);
  sanitized.particles.sizeRange = normalizeRange(sanitized.particles.sizeRange, 0.7, 5.4);

  sanitized.beam.focusGap = clamp(sanitized.beam.focusGap, 4, 24);
  sanitized.beam.glintBlur = clamp(sanitized.beam.glintBlur, 0, 8);
  sanitized.beam.glintGlow = clamp(sanitized.beam.glintGlow, 0, 3);
  sanitized.beam.glintHeight = clamp(sanitized.beam.glintHeight, 24, 180);
  sanitized.beam.glintOpacity = clamp(sanitized.beam.glintOpacity, 0, 1);
  sanitized.beam.glintWidth = clamp(sanitized.beam.glintWidth, 4, 36);
  sanitized.beam.glowIntensity = clamp(sanitized.beam.glowIntensity, 0, 1);
  sanitized.beam.lineOpacity = clamp(sanitized.beam.lineOpacity, 0.32, 1);

  sanitized.halo.dotFocusScale = clamp(sanitized.halo.dotFocusScale, 0, 0.9);
  sanitized.halo.glowIntensity = clamp(sanitized.halo.glowIntensity, 0, 1.4);
  sanitized.halo.nowStrokeWidth = clamp(sanitized.halo.nowStrokeWidth, 1, 5);
  sanitized.halo.opacity = clamp(sanitized.halo.opacity, 0, 1);
  sanitized.halo.strokeWidth = clamp(sanitized.halo.strokeWidth, 1, 4);

  sanitized.depth.fadeRange = clamp(sanitized.depth.fadeRange, 36, 140);
  sanitized.depth.focusRange = clamp(sanitized.depth.focusRange, 8, 44);
  sanitized.depth.maxBlur = clamp(sanitized.depth.maxBlur, 0, 2);
  sanitized.depth.maxOpacityLoss = clamp(sanitized.depth.maxOpacityLoss, 0, 0.35);
  sanitized.depth.maxScaleLoss = clamp(sanitized.depth.maxScaleLoss, 0, 0.05);

  sanitized.card.blur = clamp(sanitized.card.blur, 0, 54);
  sanitized.card.radius = clamp(sanitized.card.radius, 6, 24);
  sanitized.nowInput.blur = clamp(sanitized.nowInput.blur, 0, 54);

  sanitized.cursor.imageUrl = undefined;
  sanitized.cursor.size = clamp(sanitized.cursor.size, 16, 96);
  sanitized.cursor.hotspot = {
    x: clamp(sanitized.cursor.hotspot.x, 0, sanitized.cursor.size),
    y: clamp(sanitized.cursor.hotspot.y, 0, sanitized.cursor.size),
  };

  if (sanitized.cursor.type !== "image") {
    sanitized.cursor.assetId = undefined;
  }

  return sanitized;
}

async function removeReplacedAssets(
  previous: TimelineThemeRecord | undefined,
  next: TimelineThemeRecord,
) {
  const staleAssetIds = [
    previous?.wallpaper.assetId &&
    previous.wallpaper.assetId !== next.wallpaper.assetId
      ? previous.wallpaper.assetId
      : null,
    previous?.cursor.assetId && previous.cursor.assetId !== next.cursor.assetId
      ? previous.cursor.assetId
      : null,
  ].filter((assetId): assetId is string => Boolean(assetId));

  await Promise.all(staleAssetIds.map((assetId) => removeThemeAsset(assetId)));
}

function normalizeRange(range: [number, number], min: number, max: number): [number, number] {
  const start = clamp(Math.min(range[0], range[1]), min, max);
  const end = clamp(Math.max(range[0], range[1]), min, max);

  return [start, end];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
