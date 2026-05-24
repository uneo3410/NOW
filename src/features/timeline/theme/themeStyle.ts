import type { CSSProperties } from "react";
import type { ResolvedTimelineThemeConfig, TimelineThemeConfig } from "./types";

export function getTimelineThemeStyle(
  theme: TimelineThemeConfig | ResolvedTimelineThemeConfig,
): CSSProperties {
  return {
    "--timeline-beam-glint-color": theme.beam.glintColor,
    "--timeline-beam-glint-blur": `${theme.beam.glintBlur}px`,
    "--timeline-beam-glint-height": `${theme.beam.glintHeight}px`,
    "--timeline-beam-glint-shadow-blur": `${16 * theme.beam.glintGlow}px`,
    "--timeline-beam-glint-shadow-spread": `${3 * theme.beam.glintGlow}px`,
    "--timeline-beam-glint-opacity": String(theme.beam.glintOpacity),
    "--timeline-beam-glint-width": `${theme.beam.glintWidth}px`,
    "--timeline-beam-glow-color": theme.beam.glowColor,
    "--timeline-beam-glow-intensity": String(theme.beam.glowIntensity),
    "--timeline-beam-line-color": theme.beam.lineColor,
    "--timeline-beam-line-opacity": String(theme.beam.lineOpacity),
    "--timeline-card-accent": theme.card.accentColor,
    "--timeline-card-bg": theme.card.background,
    "--timeline-card-bg-hover": theme.card.backgroundHover,
    "--timeline-card-blur": `${theme.card.blur}px`,
    "--timeline-card-border": theme.card.border,
    "--timeline-card-radius": `${theme.card.radius}px`,
    "--timeline-card-shadow": theme.card.shadow,
    "--timeline-card-shadow-hover": theme.card.shadowHover,
    "--timeline-card-text": theme.card.textColor,
    "--timeline-card-time": theme.card.timeColor,
    "--timeline-halo-color": theme.halo.color,
    "--timeline-halo-glow-color": theme.halo.glowColor,
    "--timeline-halo-opacity": String(theme.halo.opacity),
    "--timeline-halo-stroke-width": `${theme.halo.strokeWidth}px`,
    "--timeline-now-halo-color": theme.halo.nowColor,
    "--timeline-now-halo-stroke-width": `${theme.halo.nowStrokeWidth}px`,
    "--timeline-now-input-bg": theme.nowInput.background,
    "--timeline-now-input-bg-hover": theme.nowInput.backgroundHover,
    "--timeline-now-input-blur": `${theme.nowInput.blur}px`,
    "--timeline-now-input-border": theme.nowInput.border,
    "--timeline-now-input-button-bg": theme.nowInput.buttonBackground,
    "--timeline-now-input-button-text": theme.nowInput.buttonTextColor,
    "--timeline-now-input-placeholder": theme.nowInput.placeholderColor,
    "--timeline-now-input-text": theme.nowInput.textColor,
  } as CSSProperties;
}

export function getTimelineCursorStyle(theme: ResolvedTimelineThemeConfig): CSSProperties {
  if (theme.cursor.type !== "image" || !theme.cursor.imageUrl) {
    return {};
  }

  const size = Math.max(16, Math.min(128, theme.cursor.size));
  const hotspotX = Math.max(0, Math.min(size, theme.cursor.hotspot.x));
  const hotspotY = Math.max(0, Math.min(size, theme.cursor.hotspot.y));

  return {
    "--timeline-cursor": `url("${theme.cursor.imageUrl}") ${hotspotX} ${hotspotY}, auto`,
    cursor: `url("${theme.cursor.imageUrl}") ${hotspotX} ${hotspotY}, auto`,
  } as CSSProperties;
}
