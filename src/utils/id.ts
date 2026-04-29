import type { EntityId } from "../types/id";

export function createId(prefix?: string): EntityId {
  const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return prefix ? `${prefix}_${id}` : id;
}
