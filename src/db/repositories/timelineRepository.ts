import type { TimelineNode } from "../../features/timeline/types";
import type { LocalDateString } from "../../features/day/types";
import type { CardId, TimelineNodeId } from "../../types/id";
import { db } from "../client";

export async function list(): Promise<TimelineNode[]> {
  return db.timelineNodes.toArray();
}

export async function listByDate(date: LocalDateString): Promise<TimelineNode[]> {
  return db.timelineNodes.where("date").equals(date).sortBy("happenedAt");
}

export async function listByDayId(dayId: string): Promise<TimelineNode[]> {
  return db.timelineNodes.where("dayId").equals(dayId).sortBy("happenedAt");
}

export async function listBySourceCardId(sourceCardId: CardId): Promise<TimelineNode[]> {
  return db.timelineNodes.where("sourceCardId").equals(sourceCardId).sortBy("happenedAt");
}

export async function create(node: TimelineNode): Promise<TimelineNode> {
  await db.timelineNodes.add(node);
  return node;
}

export async function put(node: TimelineNode): Promise<TimelineNode> {
  await db.timelineNodes.put(node);
  return node;
}

export async function getById(id: TimelineNodeId): Promise<TimelineNode | undefined> {
  return db.timelineNodes.get(id);
}

export async function update(
  id: TimelineNodeId,
  patch: Partial<TimelineNode>,
): Promise<TimelineNode> {
  await db.timelineNodes.update(id, patch);
  const node = await getById(id);

  if (!node) {
    throw new Error(`Timeline node not found: ${id}`);
  }

  return node;
}

export async function remove(id: TimelineNodeId): Promise<void> {
  await db.timelineNodes.delete(id);
}
