import type { TimelineThemeConfig } from "./types";
import { DEFAULT_TIMELINE_THEME_ID, LOCAL_TIMELINE_THEME_ID } from "./types";

export const defaultTimelineTheme: TimelineThemeConfig = {
  id: DEFAULT_TIMELINE_THEME_ID,
  name: "Default Timeline",
  version: 1,
  wallpaper: {
    blur: 0,
    dim: 0,
    fit: "cover",
    position: "center",
    type: "default",
  },
  particles: {
    alphaRange: [0.16, 0.42],
    breathAmplitude: 0.28,
    color: "rgba(0, 176, 204, 1)",
    density: 9500,
    enabled: true,
    glow: 9,
    glowColor: "rgba(0, 227, 253, 1)",
    maxCount: 190,
    mobileMaxCount: 96,
    pointerForce: 1.65,
    pointerRadius: 132,
    sizeRange: [1.1, 3.2],
    speed: 0.16,
  },
  beam: {
    focusGap: 12,
    glowColor: "rgba(0, 227, 253, 1)",
    glowIntensity: 0.64,
    glintBlur: 1.8,
    glintColor: "rgba(255, 255, 255, 1)",
    glintGlow: 1,
    glintHeight: 74,
    glintOpacity: 0.78,
    glintWidth: 12,
    lineColor: "rgba(0, 227, 253, 1)",
    lineOpacity: 0.95,
  },
  halo: {
    color: "rgba(255, 255, 255, 0.94)",
    dotColor: "rgba(0, 227, 253, 0.9)",
    dotFocusScale: 0.58,
    glowColor: "rgba(210, 250, 255, 0.46)",
    glowIntensity: 1,
    nowColor: "rgba(255, 255, 255, 0.94)",
    nowDotColor: "rgba(0, 86, 198, 1)",
    nowStrokeWidth: 2.5,
    opacity: 0.94,
    strokeWidth: 2,
  },
  depth: {
    enabled: true,
    fadeRange: 86,
    focusRange: 22,
    maxBlur: 0.85,
    maxOpacityLoss: 0.14,
    maxScaleLoss: 0.018,
  },
  card: {
    accentColor: "#005f6d",
    background: "rgba(255, 255, 255, 0.48)",
    backgroundHover: "rgba(255, 255, 255, 0.56)",
    blur: 34,
    border: "rgba(255, 255, 255, 0.7)",
    radius: 12,
    shadow:
      "0 18px 54px rgba(0,64,112,0.10), inset 0 1px 0 rgba(255,255,255,0.72), inset 0 0 0 1px rgba(255,255,255,0.42)",
    shadowHover:
      "0 22px 60px rgba(0,64,112,0.13), inset 0 1px 0 rgba(255,255,255,0.78), inset 0 0 0 1px rgba(255,255,255,0.46)",
    textColor: "#303747",
    timeColor: "#005f6d",
  },
  nowInput: {
    background: "rgba(255, 255, 255, 0.56)",
    backgroundHover: "rgba(255, 255, 255, 0.64)",
    blur: 44,
    border: "rgba(255, 255, 255, 0.7)",
    buttonBackground: "rgba(255, 255, 255, 0.6)",
    buttonTextColor: "#0056c6",
    placeholderColor: "#c2c6d8",
    textColor: "#191c1e",
  },
  cursor: {
    hotspot: { x: 0, y: 0 },
    size: 32,
    type: "default",
  },
};

export function cloneTimelineTheme(theme: TimelineThemeConfig): TimelineThemeConfig {
  return JSON.parse(JSON.stringify(theme)) as TimelineThemeConfig;
}

export function createLocalTimelineThemeDraft(): TimelineThemeConfig {
  return {
    ...cloneTimelineTheme(defaultTimelineTheme),
    id: LOCAL_TIMELINE_THEME_ID,
    name: "Local Custom Timeline",
    wallpaper: {
      ...defaultTimelineTheme.wallpaper,
      assetId: undefined,
      imageUrl: undefined,
    },
    cursor: {
      ...defaultTimelineTheme.cursor,
      assetId: undefined,
      imageUrl: undefined,
    },
  };
}
