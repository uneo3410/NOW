import { useCallback, useState } from "react";
import type { OnConnect, OnEdgesDelete, OnNodesDelete, OnSelectionChangeFunc } from "@xyflow/react";
import type { Card, CardStyle, CreateCardInput } from "../../cards/types";
import type { DayWorkspace } from "../../day/types";
import type { CardId, EdgeId } from "../../../types/id";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useCardStore } from "../../../stores/cardStore";
import { useEdgeStore } from "../../../stores/edgeStore";
import {
  createCanvasCard,
  createCanvasEdge,
  deleteCanvasCard,
  deleteCanvasEdge,
  loadGlobalCanvas,
  saveGlobalCanvasViewport,
  updateCanvasCardContent,
  updateCanvasCardStyle,
  updateCardPosition,
} from "../services/canvasService";
import type { CanvasPosition, CanvasViewport } from "../types";

export function useCanvasActions(workspace: DayWorkspace | null) {
  const [persistedViewport, setPersistedViewport] = useState<CanvasViewport | null>(null);
  const cards = useCardStore((state) => state.cards);
  const isLoading = useCardStore((state) => state.isLoading);
  const error = useCardStore((state) => state.error);
  const setCards = useCardStore((state) => state.setCards);
  const addCard = useCardStore((state) => state.addCard);
  const updateCard = useCardStore((state) => state.updateCard);
  const removeCard = useCardStore((state) => state.removeCard);
  const setLoading = useCardStore((state) => state.setLoading);
  const setError = useCardStore((state) => state.setError);
  const edges = useEdgeStore((state) => state.edges);
  const setEdges = useEdgeStore((state) => state.setEdges);
  const addEdge = useEdgeStore((state) => state.addEdge);
  const removeEdge = useEdgeStore((state) => state.removeEdge);
  const removeEdgesByCardId = useEdgeStore((state) => state.removeEdgesByCardId);
  const viewport = useCanvasStore((state) => state.viewport);
  const selectedCardId = useCanvasStore((state) => state.selectedCardId);
  const selectedEdgeId = useCanvasStore((state) => state.selectedEdgeId);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const setSelectedCardId = useCanvasStore((state) => state.setSelectedCardId);
  const setSelectedEdgeId = useCanvasStore((state) => state.setSelectedEdgeId);
  const clearSelection = useCanvasStore((state) => state.clearSelection);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const canvas = await loadGlobalCanvas();
      setCards(canvas.cards);
      setEdges(canvas.edges);
      setPersistedViewport(canvas.viewport);
      if (canvas.viewport) {
        setViewport(canvas.viewport);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [setCards, setEdges, setError, setLoading, setViewport]);

  const createCard = useCallback(
    async (input: CreateCardInput) => {
      if (!workspace) {
        setError("当前日期工作区还没有准备好。");
        return null;
      }

      const content = input.content.trim();

      if (!content) {
        setError("卡片内容不能为空。");
        return null;
      }

      setError(null);
      const card = await createCanvasCard({ ...input, content }, workspace);
      addCard(card);
      return card;
    },
    [addCard, setError, workspace],
  );

  const saveCardPosition = useCallback(
    async (cardId: CardId, position: CanvasPosition) => {
      const card = await updateCardPosition(cardId, position);
      updateCard(cardId, card);
      return card;
    },
    [updateCard],
  );

  const updateCardContent = useCallback(
    async (cardId: CardId, content: string) => {
      const nextContent = content.trim();

      if (!nextContent) {
        setError("卡片内容不能为空。");
        return null;
      }

      setError(null);
      const card = await updateCanvasCardContent(cardId, nextContent);
      updateCard(cardId, card);
      return card;
    },
    [setError, updateCard],
  );

  const updateCardStyle = useCallback(
    async (cardId: CardId, style: CardStyle) => {
      setError(null);
      const card = await updateCanvasCardStyle(cardId, style);
      updateCard(cardId, card);
      return card;
    },
    [setError, updateCard],
  );

  const deleteCard = useCallback(
    async (cardId: CardId) => {
      await deleteCanvasCard(cardId);
      removeEdgesByCardId(cardId);
      removeCard(cardId);
      clearSelection();
    },
    [clearSelection, removeCard, removeEdgesByCardId],
  );

  const connectCards = useCallback<OnConnect>(
    async (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }

      if (!workspace) {
        setError("当前日期工作区还没有准备好。");
        return;
      }

      const exists = edges.some(
        (edge) =>
          edge.fromCardId === connection.source &&
          edge.toCardId === connection.target &&
          edge.fromHandleId === (connection.sourceHandle ?? undefined) &&
          edge.toHandleId === (connection.targetHandle ?? undefined),
      );

      if (exists) {
        return;
      }

      const edge = await createCanvasEdge({
        fromCardId: connection.source,
        fromHandleId: connection.sourceHandle ?? undefined,
        toCardId: connection.target,
        toHandleId: connection.targetHandle ?? undefined,
      }, workspace);
      addEdge(edge);
    },
    [addEdge, edges, setError, workspace],
  );

  const deleteEdge = useCallback(
    async (edgeId: EdgeId) => {
      await deleteCanvasEdge(edgeId);
      removeEdge(edgeId);
      clearSelection();
    },
    [clearSelection, removeEdge],
  );

  const deleteSelected = useCallback(async () => {
    if (selectedCardId) {
      await deleteCard(selectedCardId);
      return;
    }

    if (selectedEdgeId) {
      await deleteEdge(selectedEdgeId);
    }
  }, [deleteCard, deleteEdge, selectedCardId, selectedEdgeId]);

  const handleNodesDelete = useCallback<OnNodesDelete>(
    (nodes) => {
      void Promise.all(nodes.map((node) => deleteCard(node.id as CardId)));
    },
    [deleteCard],
  );

  const handleEdgesDelete = useCallback<OnEdgesDelete>(
    (deletedEdges) => {
      void Promise.all(deletedEdges.map((edge) => deleteEdge(edge.id as EdgeId)));
    },
    [deleteEdge],
  );

  const handleSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes, edges: selectedEdges }) => {
      setSelectedCardId(nodes[0]?.id ? (nodes[0].id as CardId) : null);
      setSelectedEdgeId(selectedEdges[0]?.id ? (selectedEdges[0].id as EdgeId) : null);
    },
    [setSelectedCardId, setSelectedEdgeId],
  );

  const saveViewport = useCallback(
    async (nextViewport: { x: number; y: number; zoom: number }) => {
      setViewport(nextViewport);
      setPersistedViewport(nextViewport);
      await saveGlobalCanvasViewport(nextViewport);
    },
    [setViewport],
  );

  function getNextCardPosition(): Pick<Card, "x" | "y"> {
    const index = cards.length;
    return {
      x: 80 + (index % 4) * 72,
      y: 80 + Math.floor(index / 4) * 64,
    };
  }

  return {
    cards,
    clearSelection,
    connectCards,
    createCard,
    deleteEdge,
    deleteSelected,
    edges,
    error,
    getNextCardPosition,
    handleEdgesDelete,
    handleNodesDelete,
    handleSelectionChange,
    isLoading,
    load,
    persistedViewport,
    saveCardPosition,
    selectedCardId,
    selectedEdgeId,
    saveViewport,
    updateCardStyle,
    updateCardContent,
    viewport,
  };
}
