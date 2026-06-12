import type { ISODateString } from "../../../types/common";
import type { ThemeAssetId, TimelineThemeId } from "../../../types/id";

export const DEFAULT_TIMELINE_THEME_ID = "timeline-default";
export const LOCAL_TIMELINE_THEME_ID = "timeline-custom-local";

export type TimelineWallpaperTheme = {
  assetId?: ThemeAssetId;
  blur: number;
  dim: number;
  fit: "cover" | "contain";
  imageUrl?: string;
  position: string;
  type: "default" | "image";
};

export type TimelineParticleTheme = {
  alphaRange: [number, number];
  breathAmplitude: number;
  color: string;
  density: number;
  enabled: boolean;
  glow: number;
  glowColor: string;
  maxCount: number;
  mobileMaxCount: number;
  pointerForce: number;
  pointerRadius: number;
  sizeRange: [number, number];
  speed: number;
};

export type TimelineBeamTheme = {
  focusGap: number;
  glowColor: string;
  glowIntensity: number;
  glintBlur: number;
  glintColor: string;
  glintGlow: number;
  glintHeight: number;
  glintOpacity: number;
  glintWidth: number;
  lineColor: string;
  lineOpacity: number;
};

export type TimelineHaloTheme = {
  color: string;
  dotColor: string;
  dotFocusScale: number;
  glowColor: string;
  glowIntensity: number;
  nowColor: string;
  nowDotColor: string;
  nowStrokeWidth: number;
  opacity: number;
  strokeWidth: number;
};

export type TimelineDepthTheme = {
  enabled: boolean;
  fadeRange: number;
  focusRange: number;
  maxBlur: number;
  maxOpacityLoss: number;
  maxScaleLoss: number;
};

export type TimelineCardTheme = {
  accentColor: string;
  background: string;
  backgroundHover: string;
  blur: number;
  border: string;
  radius: number;
  shadow: string;
  shadowHover: string;
  textColor: string;
  timeColor: string;
};

export type TimelineNowInputTheme = {
  background: string;
  backgroundHover: string;
  blur: number;
  border: string;
  buttonBackground: string;
  buttonTextColor: string;
  placeholderColor: string;
  textColor: string;
};

export type TimelineCursorTheme = {
  assetId?: ThemeAssetId;
  hotspot: { x: number; y: number };
  imageUrl?: string;
  size: number;
  type: "default" | "image";
};

export type TimelineThemeConfig = {
  beam: TimelineBeamTheme;
  card: TimelineCardTheme;
  cursor: TimelineCursorTheme;
  depth: TimelineDepthTheme;
  halo: TimelineHaloTheme;
  id: TimelineThemeId;
  name: string;
  nowInput: TimelineNowInputTheme;
  particles: TimelineParticleTheme;
  version: 1;
  wallpaper: TimelineWallpaperTheme;
};

export type ResolvedTimelineThemeConfig = TimelineThemeConfig & {
  cursor: TimelineCursorTheme & { imageUrl?: string };
  wallpaper: TimelineWallpaperTheme & { imageUrl?: string };
};

export type TimelineThemeRecord = TimelineThemeConfig & {
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type ThemeAsset = {
  blob: Blob;
  createdAt: ISODateString;
  id: ThemeAssetId;
  kind: "wallpaper" | "cursor" | "card-background";
  mimeType: string;
  name: string;
  size: number;
  updatedAt: ISODateString;
};
