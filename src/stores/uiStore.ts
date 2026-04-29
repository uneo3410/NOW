import { create } from "zustand";

type ThemeMode = "system" | "light";
type ActiveSurface = "home" | "timeline" | "canvas" | "reports" | "settings";

type UiStore = {
  activeSurface: ActiveSurface;
  themeMode: ThemeMode;
  isCommandOpen: boolean;
  setActiveSurface: (surface: ActiveSurface) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setCommandOpen: (isOpen: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  activeSurface: "home",
  themeMode: "system",
  isCommandOpen: false,
  setActiveSurface: (activeSurface) => set({ activeSurface }),
  setThemeMode: (themeMode) => set({ themeMode }),
  setCommandOpen: (isCommandOpen) => set({ isCommandOpen }),
}));
