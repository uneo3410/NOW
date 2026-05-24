import { useCallback } from "react";
import type { DayWorkspace } from "../../day/types";
import {
  createTimelineNode,
  deleteTimelineNode,
  listTimelineNodesByDay,
  updateTimelineNode,
} from "../services/timelineService";
import type { CreateTimelineNodeInput, TimelineNode } from "../types";
import type { TimelineNodeId } from "../../../types/id";
import { useTimelineStore } from "../../../stores/timelineStore";

export function useTimelineActions(workspace: DayWorkspace | null) {
  const nodes = useTimelineStore((state) => state.nodes);
  const isLoading = useTimelineStore((state) => state.isLoading);
  const error = useTimelineStore((state) => state.error);
  const setNodes = useTimelineStore((state) => state.setNodes);
  const addNode = useTimelineStore((state) => state.addNode);
  const updateNode = useTimelineStore((state) => state.updateNode);
  const removeNode = useTimelineStore((state) => state.removeNode);
  const setLoading = useTimelineStore((state) => state.setLoading);
  const setError = useTimelineStore((state) => state.setError);

  const loadNodes = useCallback(async () => {
    if (!workspace) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setNodes(await listTimelineNodesByDay(workspace));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setNodes, workspace]);

  const createNode = useCallback(
    async (input: CreateTimelineNodeInput) => {
      if (!workspace) {
        setError("当前日期工作区还没有准备好。");
        return null;
      }

      const content = input.content.trim();

      if (!content) {
        setError("时间节点内容不能为空。");
        return null;
      }

      setError(null);
      const node = await createTimelineNode({ ...input, content }, workspace);
      addNode(node);
      return node;
    },
    [addNode, setError, workspace],
  );

  const updateExistingNode = useCallback(
    async (id: TimelineNodeId, patch: Partial<TimelineNode>) => {
      const content = typeof patch.content === "string" ? patch.content.trim() : patch.content;

      if (content === "") {
        setError("时间节点内容不能为空。");
        return null;
      }

      setError(null);
      const node = await updateTimelineNode(id, { ...patch, content });
      updateNode(id, node);
      return node;
    },
    [setError, updateNode],
  );

  const deleteExistingNode = useCallback(
    async (id: TimelineNodeId) => {
      setError(null);
      await deleteTimelineNode(id);
      removeNode(id);
    },
    [removeNode, setError],
  );

  return {
    createNode,
    deleteNode: deleteExistingNode,
    error,
    isLoading,
    loadNodes,
    nodes,
    updateNode: updateExistingNode,
  };
}
