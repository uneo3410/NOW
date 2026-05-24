import { create } from "zustand";
import type { TimelineNode } from "../features/timeline/types";
import type { TimelineNodeId } from "../types/id";
import { sortByNewest } from "../utils/date";

type TimelineStore = {
  nodes: TimelineNode[];
  isLoading: boolean;
  error: string | null;
  setNodes: (nodes: TimelineNode[]) => void;
  addNode: (node: TimelineNode) => void;
  updateNode: (id: TimelineNodeId, patch: Partial<TimelineNode>) => void;
  removeNode: (id: TimelineNodeId) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
};

export const useTimelineStore = create<TimelineStore>((set) => ({
  nodes: [],
  isLoading: false,
  error: null,
  setNodes: (nodes) => set({ nodes: sortByNewest(nodes) }),
  addNode: (node) => set((state) => ({ nodes: sortByNewest([...state.nodes, node]) })),
  updateNode: (id, patch) =>
    set((state) => ({
      nodes: sortByNewest(
        state.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
      ),
    })),
  removeNode: (id) => set((state) => ({ nodes: state.nodes.filter((node) => node.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
