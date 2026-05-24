import { create } from "zustand";
import type { Edge } from "../features/cards/types";
import type { CardId, EdgeId } from "../types/id";

type EdgeStore = {
  edges: Edge[];
  setEdges: (edges: Edge[]) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (id: EdgeId) => void;
  removeEdgesByCardId: (cardId: CardId) => void;
};

export const useEdgeStore = create<EdgeStore>((set) => ({
  edges: [],
  setEdges: (edges) => set({ edges }),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  removeEdge: (id) => set((state) => ({ edges: state.edges.filter((edge) => edge.id !== id) })),
  removeEdgesByCardId: (cardId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.fromCardId !== cardId && edge.toCardId !== cardId),
    })),
}));
