import type { Report } from "../../features/reports/types";
import type { ReportId } from "../../types/id";
import { nowISO } from "../../utils/date";
import { createId } from "../../utils/id";
import { db } from "../client";

export type CreateReportInput = Omit<Report, "id" | "createdAt" | "updatedAt">;

export async function listReports(): Promise<Report[]> {
  return db.reports.orderBy("createdAt").reverse().toArray();
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const timestamp = nowISO();
  const report: Report = {
    id: createId("report"),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  };

  await db.reports.add(report);
  return report;
}

export async function updateReport(
  id: ReportId,
  patch: Partial<Omit<Report, "id" | "createdAt">>,
): Promise<Report | undefined> {
  await db.reports.update(id, {
    ...patch,
    updatedAt: nowISO(),
  });
  return db.reports.get(id);
}

export async function deleteReport(id: ReportId): Promise<void> {
  await db.reports.delete(id);
}
