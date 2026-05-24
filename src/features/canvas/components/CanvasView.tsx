import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge as FlowEdge,
  type Node as FlowNode,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useUiStore } from "../../../stores/uiStore";
import type { DayWorkspace } from "../../day/types";
import type { CreateCardInput } from "../../cards/types";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { CanvasToolbar } from "./CanvasToolbar";
import { CardNode } from "./CardNode";

const nodeTypes = {
  card: CardNode,
};

type CanvasViewInnerProps = {
  workspace: DayWorkspace | null;
};

function CanvasViewInner({ workspace }: CanvasViewInnerProps) {
  const flowRef = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
  const feedback = useUiStore((state) => state.feedback);
  const {
    cards,
    clearSelection,
    connectCards,
    createCard,
    deleteSelected,
    edges,
    error,
    getNextCardPosition,
    handleEdgesDelete,
    handleNodesDelete,
    handleSelectionChange,
    isLoading,
    load,
    saveCardPosition,
    saveViewport,
    selectedCardId,
    selectedEdgeId,
  } = useCanvasActions(workspace);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (workspace?.canvasViewport && flowRef.current) {
      flowRef.current.setViewport(workspace.canvasViewport, { duration: 0 });
    }
  }, [workspace]);

  const nodes = useMemo<Array<FlowNode>>(
    () =>
      cards.map((card) => ({
        id: card.id,
        type: "card",
        position: { x: card.x, y: card.y },
        data: { card },
      })),
    [cards],
  );

  const mappedEdges = useMemo<Array<FlowEdge>>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.fromCardId,
        sourceHandle: edge.fromHandleId,
        target: edge.toCardId,
        targetHandle: edge.toHandleId,
        markerEnd: {
          color: selectedEdgeId === edge.id ? "#c95f3f" : "#0056c6",
          type: MarkerType.ArrowClosed,
        },
        selected: selectedEdgeId === edge.id,
        style: {
          stroke: selectedEdgeId === edge.id ? "#c95f3f" : "#0056c6",
          strokeOpacity: selectedEdgeId === edge.id ? 0.9 : 0.58,
          strokeWidth: selectedEdgeId === edge.id ? 2.4 : 1.5,
        },
      })),
    [edges, selectedEdgeId],
  );

  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes, setFlowNodes]);

  useEffect(() => {
    setFlowEdges(mappedEdges);
  }, [mappedEdges, setFlowEdges]);

  async function handleCreateCard(input: CreateCardInput) {
    await createCard({
      ...input,
      ...getNextCardPosition(),
    });
  }

  return (
    <div className="grid min-h-[calc(100dvh-9rem)] gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <CanvasToolbar
        canDelete={Boolean(selectedCardId || selectedEdgeId)}
        error={error}
        onClearSelection={clearSelection}
        onCreateCard={handleCreateCard}
        onDeleteSelected={deleteSelected}
        onFitView={() => flowRef.current?.fitView({ duration: 400, padding: 0.2 })}
        selectedKind={selectedCardId ? "card" : selectedEdgeId ? "edge" : null}
      />

      <section className="relative min-h-[34rem] overflow-hidden rounded-[2rem] border border-line bg-canvas text-ink shadow-soft">
        <ReactFlow<FlowNode, FlowEdge>
          colorMode="light"
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={["Backspace", "Delete"]}
          edges={flowEdges}
          fitView
          maxZoom={1.8}
          minZoom={0.25}
          nodes={flowNodes}
          nodeTypes={nodeTypes}
          onConnect={connectCards}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={handleEdgesDelete}
          onInit={(instance) => {
            flowRef.current = instance;
            if (workspace?.canvasViewport) {
              instance.setViewport(workspace.canvasViewport, { duration: 0 });
            }
          }}
          onMoveEnd={(_, viewport) => {
            void saveViewport(viewport);
          }}
          onNodeDragStop={(_, node) => {
            void saveCardPosition(node.id, node.position);
          }}
          onNodesChange={onNodesChange}
          onNodesDelete={handleNodesDelete}
          onSelectionChange={handleSelectionChange}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            bgColor="transparent"
            color="#8bb6ff"
            gap={28}
            lineWidth={0.6}
            variant={BackgroundVariant.Dots}
          />
          <Controls showInteractive={false} />
        </ReactFlow>

        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-surface/35 backdrop-blur-sm">
            <div className="rounded-full border border-line bg-white/75 px-5 py-3 text-sm text-muted shadow-soft">
              正在展开画布。
            </div>
          </div>
        ) : null}

        {!isLoading && cards.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-10">
            <EmptyState
              description="先在左侧创建一张想法卡片或 Todo 卡片。之后可以拖动它们，并从卡片四边显现的连接点拉线到另一张卡片。"
              title="画布还没有卡片"
            />
          </div>
        ) : null}

        {selectedEdgeId ? (
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-ember/25 bg-white/85 px-4 py-2 text-sm text-ember shadow-soft backdrop-blur">
            已选中连线，可以按 Delete / Backspace，或点左侧删除所选。
          </div>
        ) : null}

        {feedback ? (
          <div className="pointer-events-none absolute right-5 top-5 rounded-full border border-moss/25 bg-white/90 px-4 py-2 text-sm font-medium text-moss shadow-soft backdrop-blur">
            {feedback}
          </div>
        ) : null}
      </section>
    </div>
  );
}

type CanvasViewProps = {
  workspace: DayWorkspace | null;
};

export function CanvasView({ workspace }: CanvasViewProps) {
  return (
    <ReactFlowProvider>
      <CanvasViewInner workspace={workspace} />
    </ReactFlowProvider>
  );
}
