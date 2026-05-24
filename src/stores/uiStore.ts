import { create } from "zustand";
import type { ViewportKind } from "../utils/device";

type ThemeMode = "system" | "light";
type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";

type UiStore = {
  activeSurface: ActiveSurface;
  feedback: string | null;
  isCommandOpen: boolean;
  isMobileNavOpen: boolean;
  isQuickCaptureOpen: boolean;
  themeMode: ThemeMode;
  viewportKind: ViewportKind;
  setActiveSurface: (surface: ActiveSurface) => void;
  setFeedback: (message: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCommandOpen: (isOpen: boolean) => void;
  setMobileNavOpen: (isOpen: boolean) => void;
  setQuickCaptureOpen: (isOpen: boolean) => void;
  setViewportKind: (kind: ViewportKind) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  activeSurface: "home",
  feedback: null,
  isCommandOpen: false,
  isMobileNavOpen: false,
  isQuickCaptureOpen: false,
  themeMode: "system",
  viewportKind: "desktop",
  setActiveSurface: (activeSurface) => set({ activeSurface }),
  setFeedback: (feedback) => set({ feedback }),
  setThemeMode: (themeMode) => set({ themeMode }),
  setCommandOpen: (isCommandOpen) => set({ isCommandOpen }),
  setMobileNavOpen: (isMobileNavOpen) => set({ isMobileNavOpen }),
  setQuickCaptureOpen: (isQuickCaptureOpen) => set({ isQuickCaptureOpen }),
  setViewportKind: (viewportKind) => set({ viewportKind }),
}));
