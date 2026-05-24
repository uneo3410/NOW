import {
  backfillLegacyRecordsToWorkspace,
  getOrCreateByDate,
  update,
} from "../../../db/repositories/dayWorkspaceRepository";
import type { DayWorkspace, LocalDateString } from "../types";
import type { CanvasViewport } from "../../canvas/types";
import { isLocalDateString, todayLocalDate } from "../../../utils/date";

let didBackfillLegacyRecords = false;

export function resolveDate(input?: string | null): LocalDateString {
  if (input && isLocalDateString(input)) {
    return input;
  }

  return todayLocalDate();
}

export async function getOrCreateDayWorkspace(dateInput?: string | null): Promise<DayWorkspace> {
  const date = resolveDate(dateInput);
  const workspace = await getOrCreateByDate(date);
  await backfillLegacyRecordsToToday();
  return workspace;
}

export async function updateDayWorkspaceViewport(
  workspace: DayWorkspace,
  canvasViewport: CanvasViewport,
): Promise<DayWorkspace> {
  return update(workspace.id, { canvasViewport });
}

async function backfillLegacyRecordsToToday(): Promise<void> {
  if (didBackfillLegacyRecords) {
    return;
  }

  didBackfillLegacyRecords = true;
  const todayWorkspace = await getOrCreateByDate(todayLocalDate());
  await backfillLegacyRecordsToWorkspace(todayWorkspace);
}
