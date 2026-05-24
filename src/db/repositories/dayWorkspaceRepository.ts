import type { DayWorkspace, LocalDateString } from "../../features/day/types";
import type { DayWorkspaceId } from "../../types/id";
import { nowISO } from "../../utils/date";
import { createId } from "../../utils/id";
import { db } from "../client";

export async function getByDate(date: LocalDateString): Promise<DayWorkspace | undefined> {
  return db.dayWorkspaces.where("date").equals(date).first();
}

export async function create(workspace: DayWorkspace): Promise<DayWorkspace> {
  await db.dayWorkspaces.add(workspace);
  return workspace;
}

export async function getOrCreateByDate(date: LocalDateString): Promise<DayWorkspace> {
  const existing = await getByDate(date);

  if (existing) {
    return existing;
  }

  const timestamp = nowISO();
  return create({
    id: createId("day"),
    date,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function update(
  id: DayWorkspaceId,
  patch: Partial<DayWorkspace>,
): Promise<DayWorkspace> {
  await db.dayWorkspaces.update(id, {
    ...patch,
    updatedAt: nowISO(),
  });
  const workspace = await db.dayWorkspaces.get(id);

  if (!workspace) {
    throw new Error(`Day workspace not found: ${id}`);
  }

  return workspace;
}

export async function list(): Promise<DayWorkspace[]> {
  return db.dayWorkspaces.orderBy("date").toArray();
}

export async function backfillLegacyRecordsToWorkspace(workspace: DayWorkspace): Promise<void> {
  await db.transaction("rw", db.cards, db.edges, db.timelineNodes, async () => {
    const [legacyCards, legacyEdges, legacyNodes] = await Promise.all([
      db.cards.filter((card) => !card.dayId || !card.date).toArray(),
      db.edges.filter((edge) => !edge.dayId || !edge.date).toArray(),
      db.timelineNodes.filter((node) => !node.dayId || !node.date).toArray(),
    ]);

    await Promise.all([
      ...legacyCards.map((card) =>
        db.cards.update(card.id, {
          dayId: workspace.id,
          date: workspace.date,
        }),
      ),
      ...legacyEdges.map((edge) =>
        db.edges.update(edge.id, {
          dayId: workspace.id,
          date: workspace.date,
        }),
      ),
      ...legacyNodes.map((node) =>
        db.timelineNodes.update(node.id, {
          dayId: workspace.id,
          date: workspace.date,
        }),
      ),
    ]);
  });
}
