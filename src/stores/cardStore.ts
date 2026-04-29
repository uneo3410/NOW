import { create } from "zustand";
import type { Card, CreateCardInput } from "../features/cards/types";
import type { LoadState } from "../types/common";
import type { CardId } from "../types/id";
import {
  createCard,
  deleteCard,
  listCards,
  updateCard,
} from "../db/repositories/cardRepository";

type CardStore = {
  cards: Card[];
  status: LoadState;
  error?: string;
  loadCards: () => Promise<void>;
  addCard: (input: CreateCardInput) => Promise<Card>;
  patchCard: (id: CardId, patch: Partial<Omit<Card, "id" | "createdAt">>) => Promise<void>;
  removeCard: (id: CardId) => Promise<void>;
};

export const useCardStore = create<CardStore>((set) => ({
  cards: [],
  status: "idle",
  async loadCards() {
    set({ status: "loading", error: undefined });
    try {
      set({ cards: await listCards(), status: "success" });
    } catch (error) {
      set({ error: String(error), status: "error" });
    }
  },
  async addCard(input) {
    const card = await createCard(input);
    set((state) => ({ cards: [...state.cards, card] }));
    return card;
  },
  async patchCard(id, patch) {
    const card = await updateCard(id, patch);
    if (!card) return;
    set((state) => ({
      cards: state.cards.map((item) => (item.id === id ? card : item)),
    }));
  },
  async removeCard(id) {
    await deleteCard(id);
    set((state) => ({ cards: state.cards.filter((card) => card.id !== id) }));
  },
}));
