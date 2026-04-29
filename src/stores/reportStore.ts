import { create } from "zustand";
import {
  createReport,
  deleteReport,
  listReports,
  updateReport,
  type CreateReportInput,
} from "../db/repositories/reportRepository";
import type { Report } from "../features/reports/types";
import type { LoadState } from "../types/common";
import type { ReportId } from "../types/id";

type ReportStore = {
  reports: Report[];
  status: LoadState;
  error?: string;
  loadReports: () => Promise<void>;
  addReport: (input: CreateReportInput) => Promise<Report>;
  patchReport: (id: ReportId, patch: Partial<Omit<Report, "id" | "createdAt">>) => Promise<void>;
  removeReport: (id: ReportId) => Promise<void>;
};

export const useReportStore = create<ReportStore>((set) => ({
  reports: [],
  status: "idle",
  async loadReports() {
    set({ status: "loading", error: undefined });
    try {
      set({ reports: await listReports(), status: "success" });
    } catch (error) {
      set({ error: String(error), status: "error" });
    }
  },
  async addReport(input) {
    const report = await createReport(input);
    set((state) => ({ reports: [report, ...state.reports] }));
    return report;
  },
  async patchReport(id, patch) {
    const report = await updateReport(id, patch);
    if (!report) return;
    set((state) => ({
      reports: state.reports.map((item) => (item.id === id ? report : item)),
    }));
  },
  async removeReport(id) {
    await deleteReport(id);
    set((state) => ({ reports: state.reports.filter((report) => report.id !== id) }));
  },
}));
