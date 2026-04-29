import type { EntityId } from "./id";

export type ISODateString = string;

export type EntityBase = {
  id: EntityId;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
};

export type LoadState = "idle" | "loading" | "success" | "error";

export type RepositoryResult<T> = Promise<T>;
