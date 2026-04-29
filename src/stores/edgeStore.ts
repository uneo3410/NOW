import { create } from "zustand";
import type { Edge } from "../features/cards/types";
import type { LoadState } from "../types/common";
import type { EdgeId } from "../types/id";
import {
  createEdge,
  deleteEdge,
  listEdges,
  type CreateEdgeInput,
} from "../db/repositories/edgeRepository";

type EdgeStore = {
  edges: Edge[];
  status: LoadState;
  error?: string;
  loadEdges: () => Promise<void>;
  addEdge: (input: CreateEdgeInput) => Promise<Edge>;
  removeEdge: (id: EdgeId) => Promise<void>;
};

export const useEdgeStore = create<EdgeStore>((set) => ({
  edges: [],
  status: "idle",
  async loadEdges() {
    set({ status: "loading", error: undefined });
    try {
      set({ edges: await listEdges(), status: "success" });
    } catch (error) {
      set({ error: String(error), status: "error" });
    }
  },
  async addEdge(input) {
    const edge = await createEdge(input);
    set((state) => ({ edges: [...state.edges, edge] }));
    return edge;
  },
  async removeEdge(id) {
    await deleteEdge(id);
    set((state) => ({ edges: state.edges.filter((edge) => edge.id !== id) }));
  },
}));
