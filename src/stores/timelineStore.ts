import { create } from "zustand";
import {
  createTimelineNode,
  deleteTimelineNode,
  listTimelineNodes,
  updateTimelineNode,
} from "../db/repositories/timelineRepository";
import type { CreateTimelineNodeInput, TimelineNode } from "../features/timeline/types";
import type { LoadState } from "../types/common";
import type { TimelineNodeId } from "../types/id";
import { sortByNewest } from "../utils/date";

type TimelineStore = {
  nodes: TimelineNode[];
  status: LoadState;
  error?: string;
  loadNodes: () => Promise<void>;
  addNode: (input: CreateTimelineNodeInput) => Promise<TimelineNode>;
  patchNode: (
    id: TimelineNodeId,
    patch: Partial<Omit<TimelineNode, "id" | "createdAt">>,
  ) => Promise<void>;
  removeNode: (id: TimelineNodeId) => Promise<void>;
};

export const useTimelineStore = create<TimelineStore>((set) => ({
  nodes: [],
  status: "idle",
  async loadNodes() {
    set({ status: "loading", error: undefined });
    try {
      set({ nodes: await listTimelineNodes(), status: "success" });
    } catch (error) {
      set({ error: String(error), status: "error" });
    }
  },
  async addNode(input) {
    const node = await createTimelineNode(input);
    set((state) => ({ nodes: sortByNewest([...state.nodes, node]) }));
    return node;
  },
  async patchNode(id, patch) {
    const node = await updateTimelineNode(id, patch);
    if (!node) return;
    set((state) => ({
      nodes: sortByNewest(state.nodes.map((item) => (item.id === id ? node : item))),
    }));
  },
  async removeNode(id) {
    await deleteTimelineNode(id);
    set((state) => ({ nodes: state.nodes.filter((node) => node.id !== id) }));
  },
}));
