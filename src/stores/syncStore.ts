import { create } from "zustand";
import type { ISODateString, LoadState } from "../types/common";

type SyncStore = {
  status: LoadState;
  lastExportedAt?: ISODateString;
  lastImportedAt?: ISODateString;
  error?: string;
  setStatus: (status: LoadState) => void;
  markExported: (timestamp: ISODateString) => void;
  markImported: (timestamp: ISODateString) => void;
  setError: (error?: string) => void;
};

export const useSyncStore = create<SyncStore>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
  markExported: (lastExportedAt) => set({ lastExportedAt, status: "success" }),
  markImported: (lastImportedAt) => set({ lastImportedAt, status: "success" }),
  setError: (error) => set({ error, status: error ? "error" : "idle" }),
}));
