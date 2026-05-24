import { create } from "zustand";

export type UndoableAction = {
  label: string;
  redo: () => Promise<void>;
  undo: () => Promise<void>;
};

type UndoStore = {
  isApplying: boolean;
  pushAction: (action: UndoableAction) => void;
  redo: () => Promise<UndoableAction | null>;
  redoStack: UndoableAction[];
  undo: () => Promise<UndoableAction | null>;
  undoStack: UndoableAction[];
};

const MAX_UNDO_HISTORY = 50;

export const useUndoStore = create<UndoStore>((set, get) => ({
  isApplying: false,
  pushAction: (action) =>
    set((state) => ({
      redoStack: [],
      undoStack: [...state.undoStack, action].slice(-MAX_UNDO_HISTORY),
    })),
  redo: async () => {
    const redoStack = get().redoStack;
    const action = redoStack[redoStack.length - 1];

    if (!action || get().isApplying) {
      return null;
    }

    set((state) => ({
      isApplying: true,
      redoStack: state.redoStack.slice(0, -1),
    }));

    try {
      await action.redo();
      set((state) => ({
        undoStack: [...state.undoStack, action].slice(-MAX_UNDO_HISTORY),
      }));
      return action;
    } finally {
      set({ isApplying: false });
    }
  },
  redoStack: [],
  undo: async () => {
    const undoStack = get().undoStack;
    const action = undoStack[undoStack.length - 1];

    if (!action || get().isApplying) {
      return null;
    }

    set((state) => ({
      isApplying: true,
      undoStack: state.undoStack.slice(0, -1),
    }));

    try {
      await action.undo();
      set((state) => ({
        redoStack: [...state.redoStack, action].slice(-MAX_UNDO_HISTORY),
      }));
      return action;
    } finally {
      set({ isApplying: false });
    }
  },
  undoStack: [],
}));
