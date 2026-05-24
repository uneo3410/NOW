import {
  type CSSProperties,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  useEdgesState,
  useNodesState,
  type Edge as FlowEdge,
  type Node as FlowNode,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { CardNode } from "../../canvas/components/CardNode";
import { useCanvasActions } from "../../canvas/hooks/useCanvasActions";
import {
  deleteCanvasCard,
  deleteCanvasEdge,
  restoreCanvasCard,
  restoreCanvasEdges,
} from "../../canvas/services/canvasService";
import type { Card, Edge as CanvasEdge } from "../../cards/types";
import type { DayWorkspace } from "../../day/types";
import { useTodoActions } from "../../todo/hooks/useTodoActions";
import { useViewportKind } from "../../../hooks/useViewportKind";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useUndoStore } from "../../../stores/undoStore";
import { useUiStore } from "../../../stores/uiStore";
import type { CardId, EdgeId, TimelineNodeId } from "../../../types/id";
import { useTimelineActions } from "../hooks/useTimelineActions";
import { defaultTimelineTheme } from "../theme/defaultTheme";
import { getTimelineCursorStyle, getTimelineThemeStyle } from "../theme/themeStyle";
import type {
  ResolvedTimelineThemeConfig,
  TimelineBeamTheme,
  TimelineParticleTheme,
  TimelineThemeConfig,
} from "../theme/types";
import type { CreateTimelineNodeInput, TimelineNode } from "../types";
import {
  deleteTimelineNode as deleteTimelineNodeRecord,
  restoreTimelineNode,
} from "../services/timelineService";
import { TimelineCreateInput } from "./TimelineCreateInput";
import { TimelineNodeCard } from "./TimelineNodeCard";

type TimelineCanvasSurfaceProps = {
  entryMode?: "timeline" | "canvas";
  themeConfig?: ResolvedTimelineThemeConfig | TimelineThemeConfig;
  workspace: DayWorkspace | null;
};

type TimelineCanvasSurfaceInnerProps = TimelineCanvasSurfaceProps;

type CanvasMenuState = {
  clientX: number;
  clientY: number;
  flowPosition: { x: number; y: number };
  kind: "blank" | "selection";
};

type CreationDraft = {
  cardId?: CardId;
  clientX: number;
  clientY: number;
  flowPosition: { x: number; y: number };
  initialContent?: string;
  kind: "timeline" | "todo" | "thought" | "edit-card";
};

type TimelineMetrics = {
  axisX: number;
  cardWidth: number;
  closedNowOffset: number;
  focusRange: number;
  nodeGap: number;
  nowWidth: number;
  nowY: number;
  openNowOffset: number;
};

type ViewportSize = {
  height: number;
  width: number;
};

type LongPressState = {
  clientX: number;
  clientY: number;
  pointerId: number;
  timerId: number;
};

const nodeTypes = {
  card: CardNode,
};

const LONG_PRESS_DELAY_MS = 520;
const LONG_PRESS_MOVE_TOLERANCE = 12;
const PARTICLE_DENSITY_BOOST = 1.7;

export function TimelineCanvasSurface(props: TimelineCanvasSurfaceProps) {
  return (
    <ReactFlowProvider>
      <TimelineCanvasSurfaceInner {...props} />
    </ReactFlowProvider>
  );
}

function TimelineCanvasSurfaceInner({
  entryMode = "timeline",
  themeConfig,
  workspace,
}: TimelineCanvasSurfaceInnerProps) {
  const theme = themeConfig ?? defaultTimelineTheme;
  const viewportKind = useViewportKind();
  const isMobile = viewportKind === "mobile";
  const feedback = useUiStore((state) => state.feedback);
  const setFeedback = useUiStore((state) => state.setFeedback);
  const setThemeEditorOpen = useUiStore((state) => state.setThemeEditorOpen);
  const setTimelineCanvasChromeVisible = useUiStore(
    (state) => state.setTimelineCanvasChromeVisible,
  );
  const canRedo = useUndoStore((state) => state.redoStack.length > 0);
  const canUndo = useUndoStore((state) => state.undoStack.length > 0);
  const isApplyingUndo = useUndoStore((state) => state.isApplying);
  const pushUndoAction = useUndoStore((state) => state.pushAction);
  const redoLastAction = useUndoStore((state) => state.redo);
  const undoLastAction = useUndoStore((state) => state.undo);
  const setSelectedCardId = useCanvasStore((state) => state.setSelectedCardId);
  const setSelectedEdgeId = useCanvasStore((state) => state.setSelectedEdgeId);
  const { completeTodo } = useTodoActions();
  const {
    cards,
    clearSelection,
    connectCards,
    createCard,
    deleteSelected,
    edges,
    error: canvasError,
    handleEdgesDelete,
    handleNodesDelete,
    handleSelectionChange,
    isLoading: isCanvasLoading,
    load,
    saveCardPosition,
    saveViewport,
    selectedCardId,
    selectedEdgeId,
    updateCardContent,
  } = useCanvasActions(workspace);
  const {
    createNode,
    deleteNode,
    error: timelineError,
    isLoading: isTimelineLoading,
    loadNodes,
    nodes,
    updateNode,
  } = useTimelineActions(workspace);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesStateWithCards(cards, selectedCardId);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesStateWithCanvasEdges(
    edges,
    selectedEdgeId,
  );
  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => getViewportSize());
  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const [isNowDialogOpen, setIsNowDialogOpen] = useState(true);
  const [beamFocusY, setBeamFocusY] = useState(0);
  const [menuState, setMenuState] = useState<CanvasMenuState | null>(null);
  const [creationDraft, setCreationDraft] = useState<CreationDraft | null>(null);
  const flowRef = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
  const longPressRef = useRef<LongPressState | null>(null);
  const metrics = useMemo(
    () => getTimelineMetrics(viewportSize, viewportKind),
    [viewportKind, viewportSize],
  );
  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId),
    [cards, selectedCardId],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId),
    [edges, selectedEdgeId],
  );
  const themeStyle = {
    ...getTimelineThemeStyle(theme),
    ...getTimelineCursorStyle(theme),
  };
  const surfaceTitle = entryMode === "canvas" ? "时间画布" : "时间线";

  useEffect(() => {
    void loadNodes();
    void load();
  }, [load, loadNodes]);

  useEffect(() => {
    setFlowNodes(cardsToFlowNodes(cards, selectedCardId));
  }, [cards, selectedCardId, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(edgesToFlowEdges(edges, selectedEdgeId));
  }, [edges, selectedEdgeId, setFlowEdges]);

  useEffect(() => {
    function handleResize() {
      const nextSize = getViewportSize();
      setViewportSize(nextSize);
      setBeamFocusY((current) => current || getTimelineMetrics(nextSize, viewportKind).nowY);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      clearLongPress();
    };
  }, [viewportKind]);

  useEffect(() => {
    setBeamFocusY((current) => current || metrics.nowY);
  }, [metrics.nowY]);

  useEffect(() => {
    setTimelineCanvasChromeVisible(isChromeVisible);

    return () => {
      setTimelineCanvasChromeVisible(true);
    };
  }, [isChromeVisible, setTimelineCanvasChromeVisible]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function refreshSurface() {
    await Promise.all([load(), loadNodes()]);
  }

  function getFlowPosition(clientX: number, clientY: number) {
    return (
      flowRef.current?.screenToFlowPosition({ x: clientX, y: clientY }) ?? {
        x: clientX,
        y: clientY,
      }
    );
  }

  function updateBeamFocusFromClientY(clientY: number) {
    setBeamFocusY(getFlowPosition(0, clientY).y);
  }

  function openBlankMenu(clientX: number, clientY: number) {
    clearSelection();
    setMenuState({
      clientX,
      clientY,
      flowPosition: getFlowPosition(clientX, clientY),
      kind: "blank",
    });
  }

  function openSelectionMenu(clientX: number, clientY: number) {
    setMenuState({
      clientX,
      clientY,
      flowPosition: getFlowPosition(clientX, clientY),
      kind: "selection",
    });
  }

  function closeMenu() {
    setMenuState(null);
  }

  function startCreation(kind: CreationDraft["kind"], initialContent = "") {
    const anchor = menuState ?? {
      clientX: viewportSize.width / 2,
      clientY: viewportSize.height / 2,
      flowPosition: getFlowPosition(viewportSize.width / 2, viewportSize.height / 2),
      kind: "blank" as const,
    };
    setCreationDraft({
      cardId: kind === "edit-card" ? selectedCard?.id : undefined,
      clientX: anchor.clientX,
      clientY: anchor.clientY,
      flowPosition: anchor.flowPosition,
      initialContent,
      kind,
    });
    closeMenu();
  }

  async function createCardWithUndo(
    input: { content: string; type: "thought" | "todo"; x: number; y: number },
    label: string,
  ) {
    if (!workspace) {
      return null;
    }

    const card = (await createCard(input)) as Card | null;

    if (!card) {
      return null;
    }

    pushUndoAction({
      label,
      redo: async () => {
        await restoreCanvasCard(card);
      },
      undo: async () => {
        await deleteCanvasCard(card.id, workspace);
      },
    });

    return card;
  }

  async function createTimelineNodeWithUndo(
    input: CreateTimelineNodeInput,
    label = "创建时间卡片",
  ) {
    const node = (await createNode(input)) as TimelineNode | null;

    if (!node) {
      return null;
    }

    pushUndoAction({
      label,
      redo: async () => {
        await restoreTimelineNode(node);
      },
      undo: async () => {
        await deleteTimelineNodeRecord(node.id);
      },
    });

    return node;
  }

  async function handleCreationSubmit(draft: CreationDraft, content: string) {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    if (draft.kind === "timeline") {
      await createTimelineNodeWithUndo({ content: trimmedContent });
    } else if (draft.kind === "edit-card" && draft.cardId) {
      await updateCardContent(draft.cardId, trimmedContent);
    } else {
      await createCardWithUndo(
        {
          content: trimmedContent,
          type: draft.kind === "todo" ? "todo" : "thought",
          x: Math.round(draft.flowPosition.x - 128),
          y: Math.round(draft.flowPosition.y - 64),
        },
        draft.kind === "todo" ? "创建 Todo" : "创建想法卡片",
      );
    }

    setCreationDraft(null);
  }

  async function handlePaste() {
    if (!menuState) {
      return;
    }

    try {
      const text = await navigator.clipboard?.readText();

      if (text?.trim()) {
        await createCardWithUndo(
          {
            content: text.trim().slice(0, 220),
            type: "thought",
            x: Math.round(menuState.flowPosition.x - 128),
            y: Math.round(menuState.flowPosition.y - 64),
          },
          "粘贴创建想法卡片",
        );
        closeMenu();
        showFeedback("已从剪贴板创建想法卡片");
        return;
      }
    } catch {
      // Fall through to the manual composer.
    }

    startCreation("thought");
  }

  async function handleCopySelected() {
    if (!selectedCard && !selectedEdge) {
      return;
    }

    const text = selectedCard
      ? selectedCard.content
      : `${selectedEdge?.fromCardId ?? ""} -> ${selectedEdge?.toCardId ?? ""}`;

    try {
      await navigator.clipboard?.writeText(text);
      showFeedback("已复制");
    } catch {
      showFeedback("复制失败");
    }

    closeMenu();
  }

  async function handleDeleteSelected() {
    if (!workspace) {
      return;
    }

    const cardSnapshot = selectedCard ? { ...selectedCard } : null;
    const edgeSnapshot = selectedEdge ? { ...selectedEdge } : null;
    const connectedEdges = cardSnapshot
      ? edges
          .filter(
            (edge) => edge.fromCardId === cardSnapshot.id || edge.toCardId === cardSnapshot.id,
          )
          .map((edge) => ({ ...edge }))
      : [];

    await deleteSelected();

    if (cardSnapshot) {
      pushUndoAction({
        label: "删除卡片",
        redo: async () => {
          await deleteCanvasCard(cardSnapshot.id, workspace);
        },
        undo: async () => {
          await restoreCanvasCard(cardSnapshot);
          await restoreCanvasEdges(connectedEdges);
        },
      });
    } else if (edgeSnapshot) {
      pushUndoAction({
        label: "删除连线",
        redo: async () => {
          await deleteCanvasEdge(edgeSnapshot.id);
        },
        undo: async () => {
          await restoreCanvasEdges([edgeSnapshot]);
        },
      });
    }

    closeMenu();
  }

  async function handleCompleteSelectedTodo() {
    if (!selectedCard || selectedCard.type !== "todo") {
      return;
    }

    const previousCard = { ...selectedCard };
    const existingTodoNodeIds = new Set(
      nodes
        .filter((node) => node.source === "todo-card" && node.sourceCardId === selectedCard.id)
        .map((node) => node.id),
    );
    const result = await completeTodo(selectedCard.id);

    if (result) {
      const createdTimelineNode = !existingTodoNodeIds.has(result.timelineNode.id);

      pushUndoAction({
        label: "完成 Todo",
        redo: async () => {
          await restoreCanvasCard(result.card);

          if (createdTimelineNode) {
            await restoreTimelineNode(result.timelineNode);
          }
        },
        undo: async () => {
          await restoreCanvasCard(previousCard);

          if (createdTimelineNode) {
            await deleteTimelineNodeRecord(result.timelineNode.id);
          }
        },
      });
    }

    clearSelection();
    closeMenu();
  }

  async function handleDeleteTimelineNode(node: TimelineNode) {
    await deleteNode(node.id);
    pushUndoAction({
      label: "删除时间卡片",
      redo: async () => {
        await deleteTimelineNodeRecord(node.id);
      },
      undo: async () => {
        await restoreTimelineNode(node);
      },
    });
  }

  async function handleBeforeFlowDelete({
    edges: deletedFlowEdges,
    nodes: deletedFlowNodes,
  }: {
    edges: FlowEdge[];
    nodes: FlowNode[];
  }) {
    if (!workspace) {
      return false;
    }

    const deletedCardIds = new Set(deletedFlowNodes.map((node) => node.id as CardId));
    const deletedEdgeIds = new Set(deletedFlowEdges.map((edge) => edge.id as EdgeId));
    const cardSnapshots = cards
      .filter((card) => deletedCardIds.has(card.id))
      .map((card) => ({ ...card }));
    const edgeSnapshots = edges
      .filter(
        (edge) =>
          deletedEdgeIds.has(edge.id) ||
          deletedCardIds.has(edge.fromCardId) ||
          deletedCardIds.has(edge.toCardId),
      )
      .map((edge) => ({ ...edge }));

    if (cardSnapshots.length === 0 && edgeSnapshots.length === 0) {
      return true;
    }

    pushUndoAction({
      label: cardSnapshots.length > 0 ? "删除卡片" : "删除连线",
      redo: async () => {
        await Promise.all(edgeSnapshots.map((edge) => deleteCanvasEdge(edge.id)));
        await Promise.all(cardSnapshots.map((card) => deleteCanvasCard(card.id, workspace)));
      },
      undo: async () => {
        await Promise.all(cardSnapshots.map((card) => restoreCanvasCard(card)));
        await restoreCanvasEdges(edgeSnapshots);
      },
    });

    return true;
  }

  async function handleUndo() {
    try {
      const action = await undoLastAction();

      if (action) {
        await refreshSurface();
        clearSelection();
        showFeedback(`已撤销：${action.label}`);
      }
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "撤销失败");
    }
  }

  async function handleRedo() {
    try {
      const action = await redoLastAction();

      if (action) {
        await refreshSurface();
        clearSelection();
        showFeedback(`已重做：${action.label}`);
      }
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : "重做失败");
    }
  }

  function handleFitView() {
    if (cards.length > 0) {
      void flowRef.current?.fitView({ duration: 360, padding: 0.24 });
      return;
    }

    void flowRef.current?.setCenter(metrics.axisX + 240, metrics.nowY, {
      duration: 360,
      zoom: 1,
    });
  }

  function handleResetView() {
    const viewport = getInitialViewport(viewportKind);
    void flowRef.current?.setViewport(viewport, { duration: 260 });
    void saveViewport(viewport);
  }

  function handlePaneContextMenu(event: ReactMouseEvent | MouseEvent) {
    event.preventDefault();
    openBlankMenu(event.clientX, event.clientY);
  }

  function handleNodeContextMenu(event: ReactMouseEvent, node: FlowNode) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedCardId(node.id as CardId);
    openSelectionMenu(event.clientX, event.clientY);
  }

  function handleEdgeContextMenu(event: ReactMouseEvent, edge: FlowEdge) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedEdgeId(edge.id as EdgeId);
    openSelectionMenu(event.clientX, event.clientY);
  }

  function handleSurfacePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    updateBeamFocusFromClientY(event.clientY);

    if (event.pointerType !== "touch" || isInteractiveSurfaceTarget(event.target)) {
      return;
    }

    clearLongPress();
    const timerId = window.setTimeout(() => {
      longPressRef.current = null;
      openBlankMenu(event.clientX, event.clientY);
    }, LONG_PRESS_DELAY_MS);

    longPressRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerId: event.pointerId,
      timerId,
    };
  }

  function handleSurfacePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    updateBeamFocusFromClientY(event.clientY);

    const longPress = longPressRef.current;

    if (!longPress || longPress.pointerId !== event.pointerId) {
      return;
    }

    const distance = Math.hypot(event.clientX - longPress.clientX, event.clientY - longPress.clientY);

    if (distance > LONG_PRESS_MOVE_TOLERANCE) {
      clearLongPress();
    }
  }

  function handleSurfacePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (longPressRef.current?.pointerId === event.pointerId) {
      clearLongPress();
    }
  }

  function clearLongPress() {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current.timerId);
      longPressRef.current = null;
    }
  }

  return (
    <div
      className="relative h-dvh min-h-dvh overflow-hidden bg-white text-ink selection:bg-primary-soft selection:text-[#001945]"
      onPointerCancel={handleSurfacePointerUp}
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={handleSurfacePointerMove}
      onPointerUp={handleSurfacePointerUp}
      style={themeStyle}
    >
      <TimelineWallpaperLayer config={theme.wallpaper} />
      <TimelineParticleCanvas config={theme.particles} />

      <ReactFlow<FlowNode, FlowEdge>
        className="timeline-canvas-flow relative z-10"
        colorMode="light"
        connectionMode={ConnectionMode.Loose}
        defaultViewport={workspace?.canvasViewport ?? getInitialViewport(viewportKind)}
        deleteKeyCode={["Backspace", "Delete"]}
        edges={flowEdges}
        edgesReconnectable={false}
        fitView={entryMode === "canvas" && cards.length > 0 && !workspace?.canvasViewport}
        maxZoom={2.4}
        minZoom={0.35}
        nodes={flowNodes}
        nodeTypes={nodeTypes}
        noPanClassName="nopan"
        noWheelClassName="nowheel"
        onConnect={connectCards}
        onEdgeContextMenu={handleEdgeContextMenu}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={handleEdgesDelete}
        onInit={(instance) => {
          flowRef.current = instance;
          if (workspace?.canvasViewport) {
            instance.setViewport(workspace.canvasViewport, { duration: 0 });
          } else if (entryMode === "timeline") {
            instance.setCenter(metrics.axisX + 240, metrics.nowY, { duration: 0, zoom: 1 });
          }
        }}
        onMoveEnd={(_, viewport) => {
          void saveViewport(viewport);
        }}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeDragStop={(_, node) => {
          void saveCardPosition(node.id as CardId, node.position);
        }}
        onBeforeDelete={(params) => handleBeforeFlowDelete(params)}
        onNodesChange={onNodesChange}
        onNodesDelete={handleNodesDelete}
        onPaneClick={() => {
          closeMenu();
        }}
        onPaneContextMenu={handlePaneContextMenu}
        onPaneMouseMove={(event) => updateBeamFocusFromClientY(event.clientY)}
        onSelectionChange={handleSelectionChange}
        paneClickDistance={6}
        panOnDrag
        preventScrolling
        proOptions={{ hideAttribution: true }}
        zoomOnPinch
        zoomOnScroll
      >
        {isChromeVisible ? (
          <Background
            bgColor="transparent"
            color="rgba(139, 182, 255, 0.34)"
            gap={32}
            lineWidth={0.7}
            variant={BackgroundVariant.Dots}
          />
        ) : null}
        <ViewportPortal>
          <TimelineLayer
            beamFocusY={beamFocusY || metrics.nowY}
            createNode={createTimelineNodeWithUndo}
            deleteNode={handleDeleteTimelineNode}
            error={timelineError}
            isLoading={isTimelineLoading}
            isNowDialogOpen={isNowDialogOpen}
            metrics={metrics}
            nodes={nodes}
            setIsNowDialogOpen={setIsNowDialogOpen}
            theme={theme}
            updateNode={updateNode}
          />
        </ViewportPortal>
      </ReactFlow>

      <TimelineCanvasChrome
        canDelete={Boolean(selectedCardId || selectedEdgeId)}
        canRedo={canRedo}
        canUndo={canUndo}
        entryMode={entryMode}
        isApplyingUndo={isApplyingUndo}
        isChromeVisible={isChromeVisible}
        onCreate={() => {
          setCreationDraft({
            clientX: viewportSize.width / 2,
            clientY: viewportSize.height / 2,
            flowPosition: getFlowPosition(viewportSize.width / 2, viewportSize.height / 2),
            kind: "thought",
          });
        }}
        onDelete={() => void handleDeleteSelected()}
        onFitView={handleFitView}
        onOpenSettings={() => setThemeEditorOpen(true)}
        onRedo={() => void handleRedo()}
        onResetView={handleResetView}
        onToggleChrome={() => setIsChromeVisible((value) => !value)}
        onUndo={() => void handleUndo()}
        onZoomIn={() => void flowRef.current?.zoomIn({ duration: 180 })}
        onZoomOut={() => void flowRef.current?.zoomOut({ duration: 180 })}
        selectedKind={selectedCardId ? "card" : selectedEdgeId ? "edge" : null}
        title={surfaceTitle}
        workspaceDate={workspace?.date}
      />

      {menuState ? (
        <TimelineCanvasContextMenu
          isMobile={isMobile}
          menu={menuState}
          onClose={closeMenu}
          onCompleteTodo={() => void handleCompleteSelectedTodo()}
          onCopy={() => void handleCopySelected()}
          onCreateThought={() => startCreation("thought")}
          onCreateTimeline={() => startCreation("timeline")}
          onCreateTodo={() => startCreation("todo")}
          onDelete={() => void handleDeleteSelected()}
          onEdit={() => startCreation("edit-card", selectedCard?.content ?? "")}
          onFitView={() => {
            handleFitView();
            closeMenu();
          }}
          onHideChrome={() => {
            setIsChromeVisible(false);
            closeMenu();
          }}
          onPaste={() => void handlePaste()}
          onResetView={() => {
            handleResetView();
            closeMenu();
          }}
          onUnselect={() => {
            clearSelection();
            closeMenu();
          }}
          selectedCard={selectedCard}
          selectedEdgeId={selectedEdgeId}
        />
      ) : null}

      {creationDraft ? (
        <TimelineCanvasComposer
          draft={creationDraft}
          isMobile={isMobile}
          onCancel={() => setCreationDraft(null)}
          onSubmit={(content) => void handleCreationSubmit(creationDraft, content)}
        />
      ) : null}

      {isCanvasLoading || isTimelineLoading ? (
        <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-surface/20 backdrop-blur-[2px]">
          <div className="rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm text-muted shadow-soft backdrop-blur">
            正在展开时间画布。
          </div>
        </div>
      ) : null}

      {canvasError ? (
        <div className="pointer-events-none fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+5rem)] z-50 rounded-2xl border border-ember/25 bg-white/[0.82] px-4 py-3 text-sm text-ember shadow-soft backdrop-blur md:left-auto md:right-8 md:max-w-md">
          {canvasError}
        </div>
      ) : null}

      {feedback ? (
        <div
          className={[
            "pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 rounded-full border border-moss/25 bg-white/88 px-4 py-2 text-sm font-medium text-moss shadow-soft backdrop-blur",
            isChromeVisible
              ? "bottom-[calc(env(safe-area-inset-bottom)+4.75rem)]"
              : "bottom-[calc(env(safe-area-inset-bottom)+1.25rem)]",
          ].join(" ")}
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}

function useNodesStateWithCards(cards: Card[], selectedCardId: CardId | null) {
  return useNodesState<FlowNode>(cardsToFlowNodes(cards, selectedCardId));
}

function useEdgesStateWithCanvasEdges(edges: CanvasEdge[], selectedEdgeId: EdgeId | null) {
  return useEdgesState<FlowEdge>(edgesToFlowEdges(edges, selectedEdgeId));
}

function TimelineCanvasChrome({
  canDelete,
  canRedo,
  canUndo,
  entryMode,
  isApplyingUndo,
  isChromeVisible,
  onCreate,
  onDelete,
  onFitView,
  onOpenSettings,
  onRedo,
  onResetView,
  onToggleChrome,
  onUndo,
  onZoomIn,
  onZoomOut,
  selectedKind,
  title,
  workspaceDate,
}: {
  canDelete: boolean;
  canRedo: boolean;
  canUndo: boolean;
  entryMode: "timeline" | "canvas";
  isApplyingUndo: boolean;
  isChromeVisible: boolean;
  onCreate: () => void;
  onDelete: () => void;
  onFitView: () => void;
  onOpenSettings: () => void;
  onRedo: () => void;
  onResetView: () => void;
  onToggleChrome: () => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  selectedKind: "card" | "edge" | null;
  title: string;
  workspaceDate?: string;
}) {
  if (!isChromeVisible) {
    return (
      <button
        aria-label="显示时间画布工具"
        className="fixed right-[calc(env(safe-area-inset-right)+1rem)] top-[calc(env(safe-area-inset-top)+1rem)] z-50 grid size-11 place-items-center rounded-full border border-white/70 bg-white/[0.62] text-primary shadow-glass backdrop-blur-[28px] transition hover:bg-white"
        onClick={onToggleChrome}
        type="button"
      >
        <span className="material-symbols-outlined text-[22px]">fullscreen_exit</span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed left-[calc(env(safe-area-inset-left)+1rem)] top-[calc(env(safe-area-inset-top)+1rem)] z-50 hidden rounded-2xl border border-white/70 bg-white/[0.56] px-4 py-3 shadow-glass backdrop-blur-[28px] md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">
          {entryMode === "canvas" ? "Canvas" : "Timeline"}
        </p>
        <h1 className="mt-1 text-base font-semibold text-ink">{title}</h1>
        {workspaceDate ? (
          <p className="mt-1 text-xs font-medium text-primary">{workspaceDate}</p>
        ) : null}
      </div>

      <div className="fixed right-[calc(env(safe-area-inset-right)+0.75rem)] top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex max-w-[calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)-1.5rem)] flex-wrap justify-end gap-1.5 rounded-[1.75rem] border border-white/70 bg-white/[0.58] p-1.5 shadow-glass backdrop-blur-[28px] sm:right-[calc(env(safe-area-inset-right)+1rem)] sm:top-[calc(env(safe-area-inset-top)+1rem)] sm:gap-2 sm:rounded-full sm:p-2">
        <IconButton icon="add" label="新建卡片" onClick={onCreate} />
        <IconButton icon="center_focus_strong" label="适应视图" onClick={onFitView} />
        <IconButton icon="restart_alt" label="重置视图" onClick={onResetView} />
        <IconButton icon="palette" label="自定义主题" onClick={onOpenSettings} />
        <IconButton icon="fullscreen" label="隐藏工具 UI" onClick={onToggleChrome} />
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-50 hidden flex-col gap-2 rounded-full border border-white/70 bg-white/[0.58] p-2 shadow-glass backdrop-blur-[28px] md:flex">
        <IconButton icon="zoom_in" label="放大" onClick={onZoomIn} />
        <IconButton icon="zoom_out" label="缩小" onClick={onZoomOut} />
        <IconButton
          disabled={!canDelete}
          icon="delete"
          label={selectedKind === "edge" ? "删除所选连线" : "删除所选卡片"}
          onClick={onDelete}
        />
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.85rem)] left-1/2 z-50 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/70 bg-white/[0.58] p-1.5 shadow-glass backdrop-blur-[28px]">
        <IconButton
          disabled={!canUndo || isApplyingUndo}
          icon="undo"
          label="撤销"
          onClick={onUndo}
        />
        <IconButton
          disabled={!canRedo || isApplyingUndo}
          icon="redo"
          label="重做"
          onClick={onRedo}
        />
      </div>

      {selectedKind ? (
        <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/70 bg-white/[0.76] px-4 py-2 text-xs font-medium text-muted shadow-soft backdrop-blur md:bottom-[calc(env(safe-area-inset-bottom)+5rem)]">
          已选中{selectedKind === "edge" ? "连线" : "卡片"}，可右键打开操作菜单
        </div>
      ) : null}
    </>
  );
}

function IconButton({
  disabled = false,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-white/70 hover:text-[var(--timeline-card-accent)] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
    </button>
  );
}

function TimelineCanvasContextMenu({
  isMobile,
  menu,
  onClose,
  onCompleteTodo,
  onCopy,
  onCreateThought,
  onCreateTimeline,
  onCreateTodo,
  onDelete,
  onEdit,
  onFitView,
  onHideChrome,
  onPaste,
  onResetView,
  onUnselect,
  selectedCard,
  selectedEdgeId,
}: {
  isMobile: boolean;
  menu: CanvasMenuState;
  onClose: () => void;
  onCompleteTodo: () => void;
  onCopy: () => void;
  onCreateThought: () => void;
  onCreateTimeline: () => void;
  onCreateTodo: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onFitView: () => void;
  onHideChrome: () => void;
  onPaste: () => void;
  onResetView: () => void;
  onUnselect: () => void;
  selectedCard?: Card;
  selectedEdgeId: EdgeId | null;
}) {
  const isSelectionMenu = menu.kind === "selection" && (selectedCard || selectedEdgeId);
  const actions = isSelectionMenu
    ? [
        ...(selectedCard
          ? [{ icon: "edit", label: "编辑", onClick: onEdit }]
          : []),
        { icon: "content_copy", label: "复制", onClick: onCopy },
        ...(selectedCard?.type === "todo"
          ? [{ icon: "check_circle", label: "完成 Todo", onClick: onCompleteTodo }]
          : []),
        { icon: "delete", label: "删除", onClick: onDelete, tone: "danger" as const },
        { icon: "close", label: "取消选择", onClick: onUnselect },
      ]
    : [
        { icon: "schedule", label: "时间卡片", onClick: onCreateTimeline },
        { icon: "checklist", label: "Todo", onClick: onCreateTodo },
        { icon: "sticky_note_2", label: "想法卡片", onClick: onCreateThought },
        { icon: "content_paste", label: "粘贴", onClick: onPaste },
        { icon: "center_focus_strong", label: "适应视图", onClick: onFitView },
        { icon: "restart_alt", label: "重置缩放", onClick: onResetView },
        { icon: "fullscreen", label: "隐藏 UI", onClick: onHideChrome },
      ];

  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] overflow-y-auto rounded-[1.75rem] border border-white/70 bg-white/[0.78] p-2 shadow-[0_18px_60px_rgba(0,50,88,0.2)] backdrop-blur-[34px]">
          <div className="mb-2 flex justify-center">
            <button
              aria-label="关闭菜单"
              className="h-1.5 w-12 rounded-full bg-line"
              onClick={onClose}
              type="button"
            />
          </div>
          <div className="grid gap-1">
            {actions.map((action) => (
              <ContextActionButton key={action.label} {...action} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const position = getFloatingPanelPosition(menu.clientX, menu.clientY, 248, 420);

  return (
    <div
      className="fixed z-[70] w-60 rounded-2xl border border-white/70 bg-white/[0.74] p-2 shadow-[0_18px_60px_rgba(0,50,88,0.16)] backdrop-blur-[34px]"
      style={position}
    >
      <div className="grid gap-1">
        {actions.map((action) => (
          <ContextActionButton key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
}

function ContextActionButton({
  icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      className={[
        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition",
        tone === "danger"
          ? "text-ember hover:bg-ember/10"
          : "text-ink hover:bg-white/[0.72]",
      ].join(" ")}
      onClick={onClick}
      type="button"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function TimelineCanvasComposer({
  draft,
  isMobile,
  onCancel,
  onSubmit,
}: {
  draft: CreationDraft;
  isMobile: boolean;
  onCancel: () => void;
  onSubmit: (content: string) => void;
}) {
  const [content, setContent] = useState(draft.initialContent ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const title = getComposerTitle(draft.kind);
  const placeholder = getComposerPlaceholder(draft.kind);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(content);
    } finally {
      setIsSubmitting(false);
    }
  }

  const panel = (
    <form
      className="rounded-[1.5rem] border border-white/70 bg-white/[0.78] p-4 shadow-[0_18px_60px_rgba(0,50,88,0.18)] backdrop-blur-[34px]"
      onSubmit={handleSubmit}
    >
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">Create</p>
        <h3 className="mt-1 text-base font-semibold text-ink">{title}</h3>
      </div>
      <Textarea
        autoFocus
        className="min-h-28 rounded-2xl bg-white/[0.72] text-sm leading-6"
        maxLength={draft.kind === "timeline" ? 480 : 220}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        value={content}
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button onClick={onCancel} type="button" variant="ghost">
          取消
        </Button>
        <Button disabled={isSubmitting || !content.trim()} type="submit">
          {draft.kind === "edit-card" ? "保存" : "创建"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem)] overflow-y-auto">
          {panel}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-[80] w-[min(22rem,calc(100vw-2rem))]"
      style={getFloatingPanelPosition(draft.clientX, draft.clientY, 352, 320)}
    >
      {panel}
    </div>
  );
}

function TimelineLayer({
  beamFocusY,
  createNode,
  deleteNode,
  error,
  isLoading,
  isNowDialogOpen,
  metrics,
  nodes,
  setIsNowDialogOpen,
  theme,
  updateNode,
}: {
  beamFocusY: number;
  createNode: (input: CreateTimelineNodeInput) => Promise<unknown>;
  deleteNode: (node: TimelineNode) => Promise<void>;
  error: string | null;
  isLoading: boolean;
  isNowDialogOpen: boolean;
  metrics: TimelineMetrics;
  nodes: TimelineNode[];
  setIsNowDialogOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  theme: ResolvedTimelineThemeConfig | TimelineThemeConfig;
  updateNode: (id: TimelineNodeId, patch: Partial<TimelineNode>) => Promise<unknown>;
}) {
  const positionedItems = useMemo(() => {
    const sortedNodes = [...nodes].sort(
      (left, right) =>
        getTimestamp(right.happenedAt) - getTimestamp(left.happenedAt) ||
        getTimestamp(right.createdAt) - getTimestamp(left.createdAt),
    );

    return [
      ...(sortedNodes.length === 0
        ? [
            {
              kind: "empty" as const,
              key: "empty",
              y: getTimelineCardY(0, 1, isNowDialogOpen, metrics),
            },
          ]
        : []),
      ...sortedNodes.map((node, index) => ({
        kind: "node" as const,
        key: node.id,
        node,
        y: getTimelineCardY(index, sortedNodes.length, isNowDialogOpen, metrics),
      })),
      {
        kind: "now" as const,
        key: "now",
        y: metrics.nowY,
      },
    ];
  }, [isNowDialogOpen, metrics, nodes]);
  const timelineTop = Math.min(
    metrics.nowY - metrics.openNowOffset - metrics.nodeGap,
    ...positionedItems.filter((item) => item.kind !== "now").map((item) => item.y - metrics.nodeGap),
  );
  const timelineBottom = Math.max(
    metrics.nowY + metrics.nodeGap * 1.7,
    ...positionedItems.map((item) => item.y + metrics.nodeGap),
  );

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-20">
      <TimelineBeam
        axisX={metrics.axisX}
        config={theme.beam}
        focusY={beamFocusY}
        timelineBottom={timelineBottom}
        timelineTop={timelineTop}
      />

      {isLoading ? (
        <div
          className="timeline-themed-card nopan nodrag pointer-events-auto absolute p-6 text-center text-sm"
          style={{
            left: metrics.axisX + 64,
            top: metrics.nowY - metrics.openNowOffset,
            width: metrics.cardWidth,
          }}
        >
          正在取出你的时间线。
        </div>
      ) : (
        positionedItems.map((item) => {
          if (item.kind === "empty") {
            return (
              <div
                className="timeline-depth-item nopan nodrag group pointer-events-auto absolute flex items-center transition-[top,transform,opacity,filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                key={item.key}
                style={getTimelineItemStyle(item.y, beamFocusY, metrics, theme)}
              >
                <TimelineDot />
                <div
                  className="timeline-themed-card ml-16 cursor-default p-6 transition-all duration-700 hover:-translate-y-1"
                  style={{ width: metrics.cardWidth }}
                >
                  <div className="timeline-card-time mb-4 text-xs font-semibold uppercase tracking-[0.1em] opacity-90">
                    Empty Timeline
                  </div>
                  <p className="text-base leading-relaxed">
                    右键空白处创建时间卡片、Todo 或想法卡片。
                  </p>
                </div>
              </div>
            );
          }

          if (item.kind === "node") {
            return (
              <div
                className="timeline-depth-item nopan nodrag group pointer-events-auto absolute flex items-center transition-[top,transform,opacity,filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                key={item.key}
                style={getTimelineItemStyle(item.y, beamFocusY, metrics, theme)}
              >
                <TimelineDot />
                <div className="ml-16" style={{ width: metrics.cardWidth }}>
                  <TimelineNodeCard
                    node={item.node}
                    onDelete={() => deleteNode(item.node)}
                    onUpdate={(_, patch) => updateNode(item.node.id, patch)}
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              className="nopan nodrag pointer-events-auto absolute z-30 flex -translate-y-1/2 items-center"
              key={item.key}
              style={{
                ...getNowDotStyle(item.y, beamFocusY, theme),
                left: metrics.axisX,
                top: item.y,
                width: metrics.nowWidth,
              }}
            >
              <div className="absolute right-[calc(100%+32px)] hidden text-right sm:block">
                <span className="timeline-now-label text-xs font-semibold uppercase tracking-[0.25em] opacity-90 drop-shadow-sm">
                  Now
                </span>
              </div>
              <button
                aria-expanded={isNowDialogOpen}
                aria-label={isNowDialogOpen ? "收起 Now 输入框" : "展开 Now 输入框"}
                className={[
                  "timeline-now-node absolute -left-[7.5px] h-[16px] w-[16px] rounded-full transition-[box-shadow,opacity,transform] duration-300 active:scale-[0.94] active:opacity-80 active:[animation-play-state:paused]",
                  isNowDialogOpen ? "is-open" : "",
                ].join(" ")}
                onClick={() => setIsNowDialogOpen((value) => !value)}
                type="button"
              >
                <span aria-hidden="true" className="timeline-halo-layer" />
              </button>
              <TimelineCreateInput isOpen={isNowDialogOpen} onCreate={createNode} />
              {error ? (
                <p
                  className={[
                    "timeline-themed-card absolute left-16 top-[calc(100%+76px)] w-full px-4 py-3 text-sm leading-6 text-ember transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isNowDialogOpen
                      ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                      : "pointer-events-none translate-y-2 scale-[0.96] opacity-0",
                  ].join(" ")}
                >
                  {error}
                </p>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

function TimelineDot() {
  return (
    <div className="timeline-depth-dot absolute -left-[4px] h-[9px] w-[9px] rounded-full transition-[box-shadow,transform] duration-500">
      <span aria-hidden="true" className="timeline-halo-layer" />
    </div>
  );
}

function TimelineWallpaperLayer({ config }: { config: ResolvedTimelineThemeConfig["wallpaper"] }) {
  const blur = config.blur;
  const dim = config.dim;
  const hasImageWallpaper = config.type === "image" && Boolean(config.imageUrl);
  const hasOverlay = blur > 0 || dim > 0;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {hasImageWallpaper ? (
        <div
          className="absolute inset-[-4%] bg-cover bg-center"
          style={{
            backgroundImage: `url("${config.imageUrl}")`,
            backgroundPosition: config.position,
            backgroundSize: config.fit,
          }}
        />
      ) : (
        <div className="timeline-default-wallpaper absolute inset-0" />
      )}
      {hasOverlay ? (
        <div
          className="absolute inset-0"
          style={{
            WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
            backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
            backgroundColor: `rgba(255, 255, 255, ${dim})`,
          }}
        />
      ) : null}
    </div>
  );
}

function TimelineBeam({
  axisX,
  config,
  focusY,
  timelineBottom,
  timelineTop,
}: {
  axisX: number;
  config: TimelineBeamTheme;
  focusY: number;
  timelineBottom: number;
  timelineTop: number;
}) {
  const lineHeight = Math.max(400, timelineBottom - timelineTop);
  const upperEnd = clamp(focusY - config.focusGap * 7, timelineTop, timelineBottom);
  const lowerStart = clamp(focusY + config.focusGap * 7, timelineTop, timelineBottom);
  const beamStyle = {
    "--beam-focus-gap": `${config.focusGap}%`,
    "--beam-focus-y": `${focusY}px`,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10" style={beamStyle}>
      <div
        className="absolute z-10 w-[1px] bg-gradient-to-b from-transparent via-cyan to-transparent opacity-95"
        style={{
          background: `linear-gradient(to bottom, transparent, ${config.lineColor}, transparent)`,
          boxShadow: `0 0 ${Math.round(10 * config.glowIntensity)}px ${config.glowColor}`,
          height: lineHeight,
          left: axisX,
          opacity: config.lineOpacity,
          top: timelineTop,
        }}
      />
      <div
        className="timeline-beam-focus-glint absolute z-20"
        style={{ left: axisX, top: focusY }}
      />
      {upperEnd > timelineTop ? (
        <div
          className="timeline-beam-glow timeline-beam-glow-upper absolute z-0"
          style={{
            height: upperEnd - timelineTop,
            left: axisX,
            top: timelineTop,
          }}
        />
      ) : null}
      {lowerStart < timelineBottom ? (
        <div
          className="timeline-beam-glow timeline-beam-glow-lower absolute z-0"
          style={{
            height: timelineBottom - lowerStart,
            left: axisX,
            top: lowerStart,
          }}
        />
      ) : null}
    </div>
  );
}

function TimelineParticleCanvas({ config }: { config: TimelineParticleTheme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!config.enabled) {
      return undefined;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const canvasElement = canvas;
    const drawingContext = context;
    const particles: Particle[] = [];
    const pointer = {
      lastMovedAt: 0,
      x: -9999,
      y: -9999,
    };
    let frameId = 0;
    let height = window.innerHeight;
    let pixelRatio = 1;
    let width = window.innerWidth;

    class Particle {
      alpha: number;
      drift: number;
      phase: number;
      phaseSpeed: number;
      size: number;
      speedX: number;
      speedY: number;
      x: number;
      y: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.alpha =
          Math.random() * (config.alphaRange[1] - config.alphaRange[0]) + config.alphaRange[0];
        this.drift = Math.random() * Math.PI * 2;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = (Math.random() * 0.0012 + 0.0007) * getSpeedRatio(config.speed);
        this.size =
          Math.random() * (config.sizeRange[1] - config.sizeRange[0]) + config.sizeRange[0];
        this.speedX = (Math.random() - 0.5) * config.speed;
        this.speedY = (Math.random() - 0.5) * config.speed;
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
      }

      update(time: number) {
        const dx = this.x - pointer.x;
        const dy = this.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const pointerAge = time - pointer.lastMovedAt;
        const pointerRadius = pointerAge < 520 ? config.pointerRadius : 0;

        if (pointerRadius > 0 && distance > 0 && distance < pointerRadius) {
          const force = ((pointerRadius - distance) / pointerRadius) ** 2;
          this.speedX += (dx / distance) * force * config.pointerForce;
          this.speedY += (dy / distance) * force * config.pointerForce;
        }

        this.speedX += Math.cos(this.drift + time * 0.00018) * 0.025 * config.speed;
        this.speedY += Math.sin(this.drift + time * 0.00016) * 0.025 * config.speed;
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.965;
        this.speedY *= 0.965;

        if (this.x < -24) {
          this.x = width + 24;
        } else if (this.x > width + 24) {
          this.x = -24;
        }

        if (this.y < -24) {
          this.y = height + 24;
        } else if (this.y > height + 24) {
          this.y = -24;
        }
      }

      draw(time: number) {
        const breath =
          1 - config.breathAmplitude + Math.sin(this.phase + time * this.phaseSpeed) * config.breathAmplitude;
        const alpha = this.alpha * breath;
        const radius = this.size * (0.9 + breath * 0.22);

        drawingContext.beginPath();
        drawingContext.arc(this.x, this.y, radius, 0, Math.PI * 2);
        drawingContext.globalAlpha = alpha;
        drawingContext.fillStyle = config.color;
        drawingContext.shadowBlur = config.glow;
        drawingContext.shadowColor = config.glowColor;
        drawingContext.fill();
        drawingContext.globalAlpha = 1;
      }
    }

    function syncParticleCount() {
      const maxCount = width < 768 ? config.mobileMaxCount : config.maxCount;
      const targetCount = clamp(
        Math.round(((width * height) / config.density) * PARTICLE_DENSITY_BOOST),
        42,
        maxCount,
      );

      while (particles.length < targetCount) {
        particles.push(new Particle(width, height));
      }

      if (particles.length > targetCount) {
        particles.splice(targetCount);
      }
    }

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvasElement.width = Math.floor(width * pixelRatio);
      canvasElement.height = Math.floor(height * pixelRatio);
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      syncParticleCount();
    }

    function movePointer(x: number, y: number) {
      pointer.x = x;
      pointer.y = y;
      pointer.lastMovedAt = performance.now();
    }

    function handlePointerMove(event: globalThis.MouseEvent) {
      movePointer(event.clientX, event.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0];

      if (touch) {
        movePointer(touch.clientX, touch.clientY);
      }
    }

    function animateParticles() {
      const now = performance.now();

      drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        particle.update(now);
        particle.draw(now);
      }

      frameId = window.requestAnimationFrame(animateParticles);
    }

    resizeCanvas();
    animateParticles();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [config]);

  if (!config.enabled) {
    return null;
  }

  return <canvas aria-hidden="true" className="timeline-particle-canvas" ref={canvasRef} />;
}

function cardsToFlowNodes(cards: Card[], selectedCardId: CardId | null): FlowNode[] {
  return cards.map((card) => ({
    data: { card },
    id: card.id,
    position: { x: card.x, y: card.y },
    selected: selectedCardId === card.id,
    type: "card",
  }));
}

function edgesToFlowEdges(edges: CanvasEdge[], selectedEdgeId: EdgeId | null): FlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    markerEnd: {
      color: selectedEdgeId === edge.id ? "#c95f3f" : "#0056c6",
      type: MarkerType.ArrowClosed,
    },
    selected: selectedEdgeId === edge.id,
    source: edge.fromCardId,
    sourceHandle: edge.fromHandleId,
    style: {
      stroke: selectedEdgeId === edge.id ? "#c95f3f" : "#0056c6",
      strokeOpacity: selectedEdgeId === edge.id ? 0.9 : 0.58,
      strokeWidth: selectedEdgeId === edge.id ? 2.4 : 1.5,
    },
    target: edge.toCardId,
    targetHandle: edge.toHandleId,
  }));
}

function getTimelineMetrics(size: ViewportSize, viewportKind: "mobile" | "desktop"): TimelineMetrics {
  const isMobile = viewportKind === "mobile";
  const axisX = isMobile
    ? clamp(size.width * 0.15, 46, 68)
    : clamp(size.width * 0.3, 280, 430);
  const nowY = isMobile
    ? clamp(size.height * 0.6, 340, 540)
    : clamp(size.height * 0.7, 460, 680);

  return {
    axisX,
    cardWidth: isMobile ? Math.min(440, Math.max(238, size.width - axisX - 86)) : 560,
    closedNowOffset: isMobile ? 118 : 130,
    focusRange: isMobile ? 150 : 180,
    nodeGap: isMobile ? 210 : 260,
    nowWidth: isMobile ? Math.min(360, Math.max(238, size.width - axisX - 86)) : 680,
    nowY,
    openNowOffset: isMobile ? 238 : 285,
  };
}

function getTimelineCardY(
  index: number,
  total: number,
  isNowDialogOpen: boolean,
  metrics: TimelineMetrics,
) {
  const nowOffset = isNowDialogOpen ? metrics.openNowOffset : metrics.closedNowOffset;
  const distanceFromNow = nowOffset + (total - index - 1) * metrics.nodeGap;

  return metrics.nowY - distanceFromNow;
}

function getTimelineItemStyle(
  y: number,
  focusY: number,
  metrics: TimelineMetrics,
  theme: ResolvedTimelineThemeConfig | TimelineThemeConfig,
): CSSProperties {
  const distance = Math.abs(y - focusY);
  const depth = theme.depth.enabled
    ? clamp((distance - theme.depth.focusRange * 8) / (theme.depth.fadeRange * 8), 0, 1)
    : 0;

  return {
    ...getTimelineDotStyle(y, focusY, metrics, theme),
    "--timeline-depth-blur": `${(depth * theme.depth.maxBlur).toFixed(2)}px`,
    "--timeline-depth-opacity": (1 - depth * theme.depth.maxOpacityLoss).toFixed(3),
    "--timeline-depth-scale": (1 - depth * theme.depth.maxScaleLoss).toFixed(3),
    left: metrics.axisX,
    top: y,
  } as CSSProperties;
}

function getTimelineDotStyle(
  y: number,
  focusY: number,
  metrics: TimelineMetrics,
  theme: ResolvedTimelineThemeConfig | TimelineThemeConfig,
): CSSProperties {
  const focus = getTimelineFocusIntensity(y, focusY, metrics.focusRange);
  const glowSize = 16 + focus * 28;
  const secondaryGlowSize = 8 + focus * 20;

  return {
    "--timeline-halo-glow-size": `${(12 + focus * 18).toFixed(1)}px`,
    "--timeline-halo-strength": (0.76 + focus * 0.24).toFixed(3),
    "--timeline-dot-color": theme.halo.dotColor,
    "--timeline-dot-scale": (1 + focus * theme.halo.dotFocusScale).toFixed(3),
    "--timeline-dot-shadow": [
      `0 0 ${glowSize.toFixed(1)}px ${theme.beam.lineColor}`,
      `0 0 ${secondaryGlowSize.toFixed(1)}px ${theme.halo.glowColor}`,
    ].join(", "),
  } as CSSProperties;
}

function getNowDotStyle(
  nowY: number,
  focusY: number,
  theme: ResolvedTimelineThemeConfig | TimelineThemeConfig,
): CSSProperties {
  const focus = getTimelineFocusIntensity(nowY, focusY, 180);

  return {
    "--timeline-halo-glow-size": `${(16 + focus * 22).toFixed(1)}px`,
    "--timeline-halo-strength": (0.78 + focus * 0.22).toFixed(3),
    "--timeline-now-dot-color": theme.halo.nowDotColor,
    "--timeline-dot-scale": (1 + focus * 0.5).toFixed(3),
    "--timeline-dot-shadow": [
      `0 0 ${(32 + focus * 24).toFixed(1)}px ${(8 + focus * 8).toFixed(1)}px ${theme.halo.nowDotColor}`,
      `0 0 ${(16 + focus * 22).toFixed(1)}px ${theme.halo.glowColor}`,
    ].join(", "),
  } as CSSProperties;
}

function getTimelineFocusIntensity(y: number, focusY: number, range: number) {
  return clamp(1 - Math.abs(y - focusY) / range, 0, 1);
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getViewportSize(): ViewportSize {
  if (typeof window === "undefined") {
    return { height: 800, width: 1280 };
  }

  const viewport = window.visualViewport;

  return {
    height: viewport?.height ?? window.innerHeight,
    width: viewport?.width ?? window.innerWidth,
  };
}

function getInitialViewport(viewportKind: "mobile" | "desktop") {
  return viewportKind === "mobile"
    ? { x: 0, y: 0, zoom: 0.86 }
    : { x: 0, y: 0, zoom: 1 };
}

function getFloatingPanelPosition(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
): CSSProperties {
  if (typeof window === "undefined") {
    return { left: clientX, top: clientY };
  }

  const margin = 12;
  const left = clamp(clientX, margin, window.innerWidth - width - margin);
  const top = clamp(clientY, margin, window.innerHeight - height - margin);

  return { left, top };
}

function getComposerTitle(kind: CreationDraft["kind"]) {
  if (kind === "timeline") {
    return "时间卡片";
  }

  if (kind === "todo") {
    return "Todo";
  }

  if (kind === "edit-card") {
    return "编辑卡片";
  }

  return "想法卡片";
}

function getComposerPlaceholder(kind: CreationDraft["kind"]) {
  if (kind === "timeline") {
    return "记录刚刚发生的事。";
  }

  if (kind === "todo") {
    return "写下一件想完成的事。";
  }

  if (kind === "edit-card") {
    return "更新这张卡片。";
  }

  return "写下一个想法、灵感或备注。";
}

function isInteractiveSurfaceTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, input, textarea, select, a, label, .react-flow__node, .react-flow__edge, .timeline-depth-item, .timeline-now-node, .timeline-now-input-shell",
      ),
    )
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSpeedRatio(speed: number): number {
  if (speed <= 0) {
    return 0;
  }

  return speed / 0.16;
}
