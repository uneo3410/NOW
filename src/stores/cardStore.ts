import { create } from "zustand";
import type { Card } from "../features/cards/types";
import type { CardId } from "../types/id";

type CardStore = {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (id: CardId, patch: Partial<Card>) => void;
  removeCard: (id: CardId) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
};

export const useCardStore = create<CardStore>((set) => ({
  cards: [],
  isLoading: false,
  error: null,
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  updateCard: (id, patch) =>
    set((state) => ({
      cards: state.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
    })),
  removeCard: (id) => set((state) => ({ cards: state.cards.filter((card) => card.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
