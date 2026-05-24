import { create } from "zustand";
import type { TimelineThemeConfig } from "../features/timeline/theme/types";

type TimelineThemePreviewStore = {
  bumpThemeRevision: () => void;
  clearPreviewTheme: () => void;
  previewTheme: TimelineThemeConfig | null;
  setPreviewTheme: (theme: TimelineThemeConfig) => void;
  themeRevision: number;
};

export const useTimelineThemePreviewStore = create<TimelineThemePreviewStore>((set) => ({
  bumpThemeRevision: () => set((state) => ({ themeRevision: state.themeRevision + 1 })),
  clearPreviewTheme: () => set({ previewTheme: null }),
  previewTheme: null,
  setPreviewTheme: (previewTheme) => set({ previewTheme }),
  themeRevision: 0,
}));
