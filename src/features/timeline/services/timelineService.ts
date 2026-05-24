import {
  create,
  getById,
  list,
  listByDate,
  listByDayId,
  listBySourceCardId,
  remove,
  update,
} from "../../../db/repositories/timelineRepository";
import type { Card } from "../../cards/types";
import type { CreateTimelineNodeInput, TimelineNode } from "../types";
import type { DayWorkspace, LocalDateString } from "../../day/types";
import type { CardId, TimelineNodeId } from "../../../types/id";
import { nowISO, sortByNewest } from "../../../utils/date";
import { createId } from "../../../utils/id";

export async function listTimelineNodes(): Promise<TimelineNode[]> {
  const nodes = await list();
  return sortByNewest(nodes);
}

export async function listTimelineNodesByDate(date: LocalDateString): Promise<TimelineNode[]> {
  const nodes = await listByDate(date);
  return sortByNewest(nodes);
}

export async function listTimelineNodesByDay(
  workspace: DayWorkspace,
): Promise<TimelineNode[]> {
  const nodes = await listByDayId(workspace.id);
  return sortByNewest(nodes);
}

export async function getTimelineNodeById(
  id: TimelineNodeId,
): Promise<TimelineNode | undefined> {
  return getById(id);
}

export async function listTimelineNodesBySourceCardId(
  sourceCardId: CardId,
): Promise<TimelineNode[]> {
  const nodes = await listBySourceCardId(sourceCardId);
  return sortByNewest(nodes);
}

export async function createTimelineNode(
  input: CreateTimelineNodeInput,
  workspace: DayWorkspace,
): Promise<TimelineNode> {
  const timestamp = nowISO();
  const happenedAt = input.happenedAt ?? timestamp;
  const node: TimelineNode = {
    id: createId("node"),
    dayId: workspace.id,
    date: workspace.date,
    content: input.content.trim(),
    happenedAt,
    createdAt: timestamp,
    updatedAt: timestamp,
    source: input.source ?? "manual",
    sourceCardId: input.sourceCardId,
    tags: input.tags,
  };

  return create(node);
}

export async function createTimelineNodeFromTodoCard(
  card: Card,
  completedAt: string,
): Promise<TimelineNode> {
  const content = card.content.trim();

  if (!content) {
    throw new Error("Todo 内容为空，不能生成时间线节点。");
  }

  const node: TimelineNode = {
    id: createId("node"),
    dayId: card.dayId,
    date: card.date,
    content,
    happenedAt: completedAt,
    createdAt: completedAt,
    updatedAt: completedAt,
    source: "todo-card",
    sourceCardId: card.id,
  };

  return create(node);
}

export async function updateTimelineNode(
  id: TimelineNodeId,
  patch: Partial<TimelineNode>,
): Promise<TimelineNode> {
  return update(id, {
    ...patch,
    updatedAt: nowISO(),
  });
}

export async function deleteTimelineNode(id: TimelineNodeId): Promise<void> {
  await remove(id);
}
