import { create } from "zustand";
import type { CanvasViewport } from "../features/canvas/types";
import type { CardId, EdgeId } from "../types/id";

type CanvasStore = {
  viewport: CanvasViewport;
  selectedCardId: CardId | null;
  selectedEdgeId: EdgeId | null;
  setViewport: (viewport: CanvasViewport) => void;
  setSelectedCardId: (id: CardId | null) => void;
  setSelectedEdgeId: (id: EdgeId | null) => void;
  clearSelection: () => void;
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedCardId: null,
  selectedEdgeId: null,
  setViewport: (viewport) => set({ viewport }),
  setSelectedCardId: (selectedCardId) =>
    set((state) => ({
      selectedCardId,
      selectedEdgeId: selectedCardId ? null : state.selectedEdgeId,
    })),
  setSelectedEdgeId: (selectedEdgeId) =>
    set((state) => ({
      selectedEdgeId,
      selectedCardId: selectedEdgeId ? null : state.selectedCardId,
    })),
  clearSelection: () => set({ selectedCardId: null, selectedEdgeId: null }),
}));
