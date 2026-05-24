import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent,
} from "react";
import type { DayWorkspace } from "../../day/types";
import { useTimelineActions } from "../hooks/useTimelineActions";
import { TimelineCreateInput } from "./TimelineCreateInput";
import { TimelineNodeCard } from "./TimelineNodeCard";

export type TimelineWallpaperConfig = {
  blur?: number;
  dim?: number;
  imageUrl?: string;
  type: "default" | "image";
};

type TimelineViewProps = {
  wallpaperConfig?: TimelineWallpaperConfig;
  workspace: DayWorkspace | null;
};

type ViewTransform = {
  scale: number;
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  transform: ViewTransform;
};

type TouchState =
  | {
      mode: "pan";
      startX: number;
      startY: number;
      transform: ViewTransform;
    }
  | {
      initialDistance: number;
      initialScale: number;
      mode: "pinch";
    };

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const NOW_TOP = 70;
const NODE_GAP = 34;
const CLOSED_NOW_OFFSET = 14;
const OPEN_NOW_OFFSET = 28;
const BEAM_FOCUS_GAP = 12;
const DEFAULT_WALLPAPER_CONFIG: TimelineWallpaperConfig = {
  blur: 18,
  dim: 0.18,
  type: "default",
};
const WALLPAPER_PARTICLES = [
  { delay: "-2s", duration: "24s", left: "8%", size: "7px", top: "18%" },
  { delay: "-9s", duration: "31s", left: "18%", size: "4px", top: "72%" },
  { delay: "-5s", duration: "28s", left: "31%", size: "6px", top: "38%" },
  { delay: "-13s", duration: "34s", left: "45%", size: "3px", top: "14%" },
  { delay: "-1s", duration: "27s", left: "58%", size: "8px", top: "82%" },
  { delay: "-16s", duration: "36s", left: "67%", size: "4px", top: "32%" },
  { delay: "-7s", duration: "30s", left: "76%", size: "5px", top: "58%" },
  { delay: "-19s", duration: "39s", left: "88%", size: "6px", top: "22%" },
  { delay: "-11s", duration: "33s", left: "92%", size: "3px", top: "77%" },
  { delay: "-4s", duration: "26s", left: "52%", size: "5px", top: "51%" },
];

export function TimelineView({
  wallpaperConfig = DEFAULT_WALLPAPER_CONFIG,
  workspace,
}: TimelineViewProps) {
  const { createNode, deleteNode, error, isLoading, loadNodes, nodes, updateNode } =
    useTimelineActions(workspace);
  const [viewTransform, setViewTransform] = useState<ViewTransform>({ scale: 1, x: 0, y: 0 });
  const [isNowDialogOpen, setIsNowDialogOpen] = useState(true);
  const [beamFocusClientY, setBeamFocusClientY] = useState(getViewportCenterY);
  const beamFocusFrameRef = useRef(0);
  const dragStateRef = useRef<DragState | null>(null);
  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const pendingBeamFocusYRef = useRef<number | null>(null);
  const touchStateRef = useRef<TouchState | null>(null);
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
              top: getTimelineCardTop(0, 1, isNowDialogOpen),
            },
          ]
        : []),
      ...sortedNodes.map((node, index) => ({
        kind: "node" as const,
        key: node.id,
        node,
        top: getTimelineCardTop(index, sortedNodes.length, isNowDialogOpen),
      })),
      {
        kind: "now" as const,
        key: "now",
        top: NOW_TOP,
      },
    ];
  }, [isNowDialogOpen, nodes]);
  const timelineTop = useMemo(() => {
    const cardTops = positionedItems
      .filter((item) => item.kind !== "now")
      .map((item) => item.top);
    const highestCardTop = cardTops.length > 0 ? Math.min(...cardTops) : NOW_TOP;

    return Math.min(0, highestCardTop - NODE_GAP);
  }, [positionedItems]);
  const beamFocusY = getBeamFocusY(
    beamFocusClientY,
    viewTransform,
    mainCanvasRef.current,
    timelineTop,
  );

  useEffect(() => {
    void loadNodes();
  }, [loadNodes]);

  useEffect(() => {
    function syncViewportFocus() {
      if (!touchStateRef.current) {
        setBeamFocusClientY(getViewportCenterY());
      }
    }

    syncViewportFocus();
    window.addEventListener("resize", syncViewportFocus);
    window.visualViewport?.addEventListener("resize", syncViewportFocus);
    window.visualViewport?.addEventListener("scroll", syncViewportFocus);

    return () => {
      window.removeEventListener("resize", syncViewportFocus);
      window.visualViewport?.removeEventListener("resize", syncViewportFocus);
      window.visualViewport?.removeEventListener("scroll", syncViewportFocus);

      if (beamFocusFrameRef.current) {
        window.cancelAnimationFrame(beamFocusFrameRef.current);
      }
    };
  }, []);

  function scheduleBeamFocus(clientY: number) {
    pendingBeamFocusYRef.current = clientY;

    if (beamFocusFrameRef.current) {
      return;
    }

    beamFocusFrameRef.current = window.requestAnimationFrame(() => {
      beamFocusFrameRef.current = 0;

      if (pendingBeamFocusYRef.current !== null) {
        setBeamFocusClientY(pendingBeamFocusYRef.current);
        pendingBeamFocusYRef.current = null;
      }
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    scheduleBeamFocus(event.clientY);

    if (!dragStateRef.current) {
      return;
    }

    const dragState = dragStateRef.current;
    setViewTransform({
      ...dragState.transform,
      x: dragState.transform.x + event.clientX - dragState.startX,
      y: dragState.transform.y + event.clientY - dragState.startY,
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    scheduleBeamFocus(event.clientY);

    if (event.pointerType === "touch" || isInteractiveTarget(event.target)) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      transform: viewTransform,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const firstTouch = event.touches[0];

    if (firstTouch) {
      scheduleBeamFocus(firstTouch.clientY);
    }

    if (isInteractiveTarget(event.target)) {
      return;
    }

    if (event.touches.length === 1) {
      touchStateRef.current = {
        mode: "pan",
        startX: event.touches[0].clientX - viewTransform.x,
        startY: event.touches[0].clientY - viewTransform.y,
        transform: viewTransform,
      };
      return;
    }

    if (event.touches.length === 2) {
      touchStateRef.current = {
        initialDistance: getTouchDistance(event),
        initialScale: viewTransform.scale,
        mode: "pinch",
      };
    }
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const firstTouch = event.touches[0];

    if (firstTouch) {
      scheduleBeamFocus(firstTouch.clientY);
    }

    if (!touchStateRef.current || isInteractiveTarget(event.target)) {
      return;
    }

    event.preventDefault();

    if (event.touches.length === 1 && touchStateRef.current.mode === "pan") {
      setViewTransform({
        ...touchStateRef.current.transform,
        x: event.touches[0].clientX - touchStateRef.current.startX,
        y: event.touches[0].clientY - touchStateRef.current.startY,
      });
      return;
    }

    if (event.touches.length === 2 && touchStateRef.current.mode === "pinch") {
      const touchState = touchStateRef.current;
      const delta = getTouchDistance(event) / touchState.initialDistance;
      setViewTransform((current) => ({
        ...current,
        scale: clamp(touchState.initialScale * delta, MIN_SCALE, MAX_SCALE),
      }));
    }
  }

  function handleTouchEnd() {
    touchStateRef.current = null;
    pendingBeamFocusYRef.current = null;

    if (beamFocusFrameRef.current) {
      window.cancelAnimationFrame(beamFocusFrameRef.current);
      beamFocusFrameRef.current = 0;
    }

    setBeamFocusClientY(getViewportCenterY());
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    event.preventDefault();
    setViewTransform((current) => ({
      ...current,
      scale: clamp(current.scale - event.deltaY * 0.001, MIN_SCALE, MAX_SCALE),
    }));
  }

  function zoomBy(delta: number) {
    setViewTransform((current) => ({
      ...current,
      scale: clamp(current.scale + delta, MIN_SCALE, MAX_SCALE),
    }));
  }

  function resetView() {
    setViewTransform({ scale: 1, x: 0, y: 0 });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-ink selection:bg-primary-soft selection:text-[#001945]">
      <TimelineWallpaperLayer config={wallpaperConfig} />
      <TimelineParticleCanvas />

      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 rounded-full border border-white/60 bg-white/40 p-2 shadow-lg backdrop-blur-md">
        <button
          aria-label="放大时间线"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/60 hover:text-primary"
          onClick={() => zoomBy(0.2)}
          type="button"
        >
          <span className="material-symbols-outlined">zoom_in</span>
        </button>
        <button
          aria-label="重置时间线视图"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/60 hover:text-primary"
          onClick={resetView}
          type="button"
        >
          <span className="material-symbols-outlined">restart_alt</span>
        </button>
        <button
          aria-label="缩小时间线"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-white/60 hover:text-primary"
          onClick={() => zoomBy(-0.2)}
          type="button"
        >
          <span className="material-symbols-outlined">zoom_out</span>
        </button>
      </div>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[45%] top-[10%] h-1.5 w-1.5 rounded-full bg-cyan opacity-60 shadow-[0_0_8px_rgba(0,227,253,0.8)] blur-[1px]" />
        <div className="absolute left-[25%] top-[35%] h-2 w-2 rounded-full bg-primary-soft opacity-40 blur-[2px]" />
        <div className="absolute left-[75%] top-[65%] h-1 w-1 rounded-full bg-cyan opacity-70 shadow-[0_0_6px_rgba(0,227,253,0.5)] blur-[0.5px]" />
        <div className="absolute left-[35%] top-[80%] h-2.5 w-2.5 rounded-full bg-primary opacity-20 blur-[3px]" />
        <div className="absolute left-[80%] top-[20%] h-1.5 w-1.5 rounded-full bg-cyan opacity-50 blur-[1px]" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-drift absolute left-[10%] top-[15%] h-3 w-3 rounded-full bg-white opacity-40 blur-[1px]" />
        <div className="animate-drift-slow absolute left-[85%] top-[45%] h-2 w-2 rounded-full bg-white opacity-30 blur-[1px]" />
        <div className="animate-drift-reverse absolute left-[15%] top-[75%] h-4 w-4 rounded-full bg-white opacity-20 blur-[2px]" />
        <div className="animate-drift absolute left-[60%] top-[30%] h-2.5 w-2.5 rounded-full bg-white opacity-25 blur-[1px]" />
        <div className="animate-drift-slow absolute left-[70%] top-[85%] h-3.5 w-3.5 rounded-full bg-white opacity-15 blur-[2px]" />
        <div className="animate-drift-reverse absolute left-[80%] top-[10%] h-2 w-2 rounded-full bg-white opacity-35 blur-[0.5px]" />
      </div>

      <div
        className="relative z-10 mx-auto flex h-screen w-full max-w-[1440px]"
        ref={mainCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          className="timeline-zoom-container h-full w-full cursor-grab transition-transform duration-100 ease-out active:cursor-grabbing"
          style={{
            transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          }}
        >
          <div className="pointer-events-none absolute left-[30%] top-[70%] z-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-soft/20 blur-[100px]" />
          <div className="pointer-events-none absolute left-[30%] top-[70%] z-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/10 blur-[60px]" />
          <TimelineBeam focusY={beamFocusY} timelineTop={timelineTop} />

          <div className="relative z-20 h-full w-full">
            {isLoading ? (
              <div className="absolute left-[30%] top-[42%] ml-16 w-full max-w-lg -translate-y-1/2 rounded-xl border border-white/70 bg-white/[0.48] p-6 text-center text-sm text-[#4a5160] shadow-[0_18px_54px_rgba(0,64,112,0.10),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_0_0_1px_rgba(255,255,255,0.42)] backdrop-blur-[34px]">
                正在取出你的时间线。
              </div>
            ) : (
              positionedItems.map((item) => {
                if (item.kind === "empty") {
                  return (
                    <div
                      className="group absolute left-[30%] flex w-full max-w-lg -translate-y-1/2 items-center transition-[top,transform,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                      key={item.key}
                      style={{ top: `${item.top}%` }}
                    >
                      <div className="absolute -left-[4px] h-[9px] w-[9px] rounded-full bg-cyan/90 shadow-[0_0_16px_rgba(0,227,253,0.8)] ring-[3px] ring-white transition-transform duration-500 group-hover:scale-125" />
                      <div className="ml-16 w-full cursor-default rounded-xl border border-white/70 bg-white/[0.48] p-6 text-[#4a5160] shadow-[0_18px_54px_rgba(0,64,112,0.10),inset_0_1px_0_rgba(255,255,255,0.72),inset_0_0_0_1px_rgba(255,255,255,0.42)] backdrop-blur-[34px] transition-all duration-700 hover:-translate-y-1 hover:bg-white/[0.56] hover:shadow-[0_22px_60px_rgba(0,64,112,0.13),inset_0_1px_0_rgba(255,255,255,0.78),inset_0_0_0_1px_rgba(255,255,255,0.46)]">
                        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#005f6d] opacity-90">
                          Empty Timeline
                        </div>
                        <p className="text-base leading-relaxed text-[#303747]">
                          点击当下，把这一刻钉住。完成的 Todo 也会沉淀到这里。
                        </p>
                      </div>
                    </div>
                  );
                }

                if (item.kind === "node") {
                  return (
                    <div
                      className="group absolute left-[30%] flex w-full max-w-lg -translate-y-1/2 items-center transition-[top,transform,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                      key={item.key}
                      style={{ top: `${item.top}%` }}
                    >
                      <div className="absolute -left-[4px] h-[9px] w-[9px] rounded-full bg-cyan/90 shadow-[0_0_16px_rgba(0,227,253,0.8)] ring-[3px] ring-white transition-transform duration-500 group-hover:scale-125" />
                      <div className="ml-16 w-full">
                        <TimelineNodeCard
                          node={item.node}
                          onDelete={() => deleteNode(item.node.id)}
                          onUpdate={(_, patch) => updateNode(item.node.id, patch)}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    className="absolute left-[30%] top-[70%] z-30 flex w-full max-w-2xl -translate-y-1/2 items-center"
                    key={item.key}
                  >
                    <div className="absolute right-[calc(100%+32px)] text-right">
                      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary opacity-90 drop-shadow-sm">
                        Now
                      </span>
                    </div>
                    <button
                      aria-expanded={isNowDialogOpen}
                      aria-label={isNowDialogOpen ? "收起 Now 输入框" : "展开 Now 输入框"}
                      className={[
                        "timeline-now-node absolute -left-[7.5px] h-[16px] w-[16px] rounded-full bg-primary ring-[4px] ring-white transition-[box-shadow,opacity,transform] duration-300 active:scale-[0.94] active:opacity-80 active:[animation-play-state:paused]",
                        isNowDialogOpen
                          ? "shadow-[0_0_38px_10px_rgba(0,109,248,0.46)]"
                          : "shadow-[0_0_32px_8px_rgba(0,109,248,0.4)]",
                      ].join(" ")}
                      onClick={() => setIsNowDialogOpen((value) => !value)}
                      type="button"
                    />
                    <TimelineCreateInput isOpen={isNowDialogOpen} onCreate={createNode} />
                    {error ? (
                      <p
                        className={[
                          "absolute left-16 top-[calc(100%+76px)] w-full rounded-xl border border-ember/25 bg-white/65 px-4 py-3 text-sm leading-6 text-ember shadow-[0_16px_56px_rgba(0,104,117,0.08)] backdrop-blur-[28px] transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
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
        </div>
      </div>
    </div>
  );
}

function TimelineWallpaperLayer({ config }: { config: TimelineWallpaperConfig }) {
  const blur = config.blur ?? DEFAULT_WALLPAPER_CONFIG.blur ?? 18;
  const dim = config.dim ?? DEFAULT_WALLPAPER_CONFIG.dim ?? 0.18;
  const hasImageWallpaper = config.type === "image" && Boolean(config.imageUrl);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {hasImageWallpaper ? (
        <div
          className="absolute inset-[-4%] bg-cover bg-center"
          style={{
            backgroundImage: `url("${config.imageUrl}")`,
          }}
        />
      ) : (
        <div className="timeline-default-wallpaper absolute inset-0" />
      )}
      <div className="absolute inset-0 overflow-hidden">
        {WALLPAPER_PARTICLES.map((particle) => (
          <span
            className="timeline-wallpaper-particle absolute rounded-full bg-cyan/45 shadow-[0_0_18px_rgba(0,227,253,0.32)]"
            key={`${particle.left}-${particle.top}`}
            style={{
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              height: particle.size,
              left: particle.left,
              top: particle.top,
              width: particle.size,
            }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          WebkitBackdropFilter: `blur(${blur}px)`,
          backdropFilter: `blur(${blur}px)`,
          backgroundColor: `rgba(255, 255, 255, ${dim})`,
        }}
      />
    </div>
  );
}

function TimelineBeam({ focusY, timelineTop }: { focusY: number; timelineTop: number }) {
  const upperEnd = clamp(focusY - BEAM_FOCUS_GAP, timelineTop, 100);
  const lowerStart = clamp(focusY + BEAM_FOCUS_GAP, timelineTop, 100);
  const beamStyle = {
    "--beam-focus-gap": `${BEAM_FOCUS_GAP}%`,
    "--beam-focus-y": `${focusY}%`,
  } as CSSProperties;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={beamStyle}>
      <div
        className="absolute bottom-0 left-[30%] z-10 w-[1px] bg-gradient-to-b from-transparent via-cyan to-transparent opacity-95"
        style={{
          boxShadow: "0 0 6px rgba(0, 227, 253, 0.28)",
          top: `${timelineTop}%`,
        }}
      />
      {upperEnd > timelineTop ? (
        <div
          className="timeline-beam-glow timeline-beam-glow-upper absolute left-[30%] z-0"
          style={{
            bottom: `${100 - upperEnd}%`,
            top: `${timelineTop}%`,
          }}
        />
      ) : null}
      {lowerStart < 100 ? (
        <div
          className="timeline-beam-glow timeline-beam-glow-lower absolute bottom-0 left-[30%] z-0"
          style={{
            top: `${lowerStart}%`,
          }}
        />
      ) : null}
    </div>
  );
}

function getTimelineCardTop(index: number, total: number, isNowDialogOpen: boolean) {
  const nowOffset = isNowDialogOpen ? OPEN_NOW_OFFSET : CLOSED_NOW_OFFSET;
  const distanceFromNow = nowOffset + (total - index - 1) * NODE_GAP;

  return NOW_TOP - distanceFromNow;
}

function getBeamFocusY(
  clientY: number,
  transform: ViewTransform,
  element: HTMLDivElement | null,
  timelineTop: number,
) {
  if (!element) {
    return NOW_TOP;
  }

  const rect = element.getBoundingClientRect();

  if (rect.height <= 0) {
    return NOW_TOP;
  }

  const localY = (clientY - rect.top - transform.y) / transform.scale;

  return clamp((localY / rect.height) * 100, timelineTop, 100);
}

function getTimestamp(value: string) {
  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getViewportCenterY() {
  if (typeof window === "undefined") {
    return 0;
  }

  const visualViewport = window.visualViewport;

  if (visualViewport) {
    return visualViewport.offsetTop + visualViewport.height / 2;
  }

  return window.innerHeight / 2;
}

function TimelineParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
    let frameId = 0;

    class Particle {
      color: string;
      decay: number;
      life: number;
      size: number;
      speedX: number;
      speedY: number;
      x: number;
      y: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = `rgba(0, 227, 253, ${this.life})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.color = `rgba(0, 227, 253, ${this.life * 0.5})`;
        this.size = Math.max(0, this.size - 0.05);
      }

      draw() {
        drawingContext.beginPath();
        drawingContext.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        drawingContext.fillStyle = this.color;
        drawingContext.shadowBlur = 10;
        drawingContext.shadowColor = "rgba(0, 227, 253, 0.8)";
        drawingContext.fill();
      }
    }

    function resizeCanvas() {
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
    }

    function createParticle(x: number, y: number) {
      if (Math.random() > 0.5) {
        particles.push(new Particle(x, y));
      }
    }

    function handlePointerMove(event: globalThis.MouseEvent) {
      createParticle(event.x, event.y);
    }

    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0];

      if (touch) {
        createParticle(touch.clientX, touch.clientY);
      }
    }

    function animateParticles() {
      drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        particle.update();
        particle.draw();

        if (particle.life <= 0 || particle.size <= 0) {
          particles.splice(index, 1);
          index -= 1;
        }
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
  }, []);

  return <canvas aria-hidden="true" className="timeline-particle-canvas" ref={canvasRef} />;
}

function getTouchDistance(event: ReactTouchEvent<HTMLDivElement>) {
  return Math.hypot(
    event.touches[0].clientX - event.touches[1].clientX,
    event.touches[0].clientY - event.touches[1].clientY,
  );
}

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(target.closest("input, button, textarea, a, article, label, #time-picker-dropdown"))
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
