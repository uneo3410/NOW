import { create } from "zustand";
import type { CanvasSelection, CanvasViewport } from "../features/canvas/types";

type CanvasMode = "idle" | "creating-card" | "connecting";

type CanvasStore = {
  viewport: CanvasViewport;
  selection: CanvasSelection;
  mode: CanvasMode;
  setViewport: (viewport: CanvasViewport) => void;
  setSelection: (selection: CanvasSelection) => void;
  setMode: (mode: CanvasMode) => void;
  clearSelection: () => void;
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  selection: { cardIds: [], edgeIds: [] },
  mode: "idle",
  setViewport: (viewport) => set({ viewport }),
  setSelection: (selection) => set({ selection }),
  setMode: (mode) => set({ mode }),
  clearSelection: () => set({ selection: { cardIds: [], edgeIds: [] } }),
}));
