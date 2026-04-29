import type { CreateTimelineNodeInput, TimelineNode } from "../../features/timeline/types";
import type { TimelineNodeId } from "../../types/id";
import { nowISO, sortByNewest } from "../../utils/date";
import { createId } from "../../utils/id";
import { db } from "../client";

export async function listTimelineNodes(): Promise<TimelineNode[]> {
  const nodes = await db.timelineNodes.toArray();
  return sortByNewest(nodes);
}

export async function createTimelineNode(input: CreateTimelineNodeInput): Promise<TimelineNode> {
  const timestamp = nowISO();
  const node: TimelineNode = {
    id: createId("node"),
    content: input.content,
    happenedAt: input.happenedAt ?? timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: input.source ?? "manual",
    sourceCardId: input.sourceCardId,
    tags: input.tags,
  };

  await db.timelineNodes.add(node);
  return node;
}

export async function updateTimelineNode(
  id: TimelineNodeId,
  patch: Partial<Omit<TimelineNode, "id" | "createdAt">>,
): Promise<TimelineNode | undefined> {
  await db.timelineNodes.update(id, {
    ...patch,
    updatedAt: nowISO(),
  });
  return db.timelineNodes.get(id);
}

export async function deleteTimelineNode(id: TimelineNodeId): Promise<void> {
  await db.timelineNodes.delete(id);
}
