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

export type TimelineHaloConfig = {
  color?: string;
  glowColor?: string;
  opacity?: number;
};

type TimelineViewProps = {
  haloConfig?: TimelineHaloConfig;
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
const DOT_FOCUS_RANGE = 18;
const DEPTH_FOCUS_RANGE = 22;
const DEPTH_FADE_RANGE = 86;
const DEFAULT_WALLPAPER_CONFIG: TimelineWallpaperConfig = {
  blur: 0,
  dim: 0,
  type: "default",
};
const DEFAULT_HALO_CONFIG: Required<TimelineHaloConfig> = {
  color: "rgba(255, 255, 255, 0.94)",
  glowColor: "rgba(210, 250, 255, 0.46)",
  opacity: 0.94,
};

export function TimelineView({
  haloConfig = DEFAULT_HALO_CONFIG,
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
  const haloStyle = getTimelineHaloStyle(haloConfig);

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
    <div
      className="relative min-h-screen overflow-hidden bg-white text-ink selection:bg-primary-soft selection:text-[#001945]"
      style={haloStyle}
    >
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
                      className="timeline-depth-item group absolute left-[30%] flex w-full max-w-lg items-center transition-[top,transform,opacity,filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                      key={item.key}
                      style={getTimelineItemStyle(item.top, beamFocusY)}
                    >
                      <div className="timeline-depth-dot absolute -left-[4px] h-[9px] w-[9px] rounded-full bg-cyan/90 ring-[3px] ring-white transition-[box-shadow,transform] duration-500">
                        <span aria-hidden="true" className="timeline-halo-layer" />
                      </div>
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
                      className="timeline-depth-item group absolute left-[30%] flex w-full max-w-lg items-center transition-[top,transform,opacity,filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                      key={item.key}
                      style={getTimelineItemStyle(item.top, beamFocusY)}
                    >
                      <div className="timeline-depth-dot absolute -left-[4px] h-[9px] w-[9px] rounded-full bg-cyan/90 ring-[3px] ring-white transition-[box-shadow,transform] duration-500">
                        <span aria-hidden="true" className="timeline-halo-layer" />
                      </div>
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
                    style={getNowDotStyle(beamFocusY)}
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
                    >
                      <span aria-hidden="true" className="timeline-halo-layer" />
                    </button>
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
  const blur = config.blur ?? DEFAULT_WALLPAPER_CONFIG.blur ?? 0;
  const dim = config.dim ?? DEFAULT_WALLPAPER_CONFIG.dim ?? 0;
  const hasImageWallpaper = config.type === "image" && Boolean(config.imageUrl);
  const hasOverlay = blur > 0 || dim > 0;

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
      <div
        className="timeline-beam-focus-glint absolute left-[30%] z-20"
        style={{ top: `${focusY}%` }}
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

function getTimelineHaloStyle(config: TimelineHaloConfig): CSSProperties {
  return {
    "--timeline-halo-color": config.color ?? DEFAULT_HALO_CONFIG.color,
    "--timeline-halo-glow-color": config.glowColor ?? DEFAULT_HALO_CONFIG.glowColor,
    "--timeline-halo-opacity": String(config.opacity ?? DEFAULT_HALO_CONFIG.opacity),
  } as CSSProperties;
}

function getTimelineItemStyle(top: number, focusY: number): CSSProperties {
  const distance = Math.abs(top - focusY);
  const depth = clamp((distance - DEPTH_FOCUS_RANGE) / DEPTH_FADE_RANGE, 0, 1);

  return {
    ...getTimelineDotStyle(top, focusY),
    "--timeline-depth-blur": `${(depth * 0.85).toFixed(2)}px`,
    "--timeline-depth-opacity": (1 - depth * 0.14).toFixed(3),
    "--timeline-depth-scale": (1 - depth * 0.018).toFixed(3),
    top: `${top}%`,
  } as CSSProperties;
}

function getTimelineDotStyle(top: number, focusY: number): CSSProperties {
  const focus = getTimelineFocusIntensity(top, focusY);
  const glowSize = 16 + focus * 28;
  const secondaryGlowSize = 8 + focus * 20;

  return {
    "--timeline-halo-glow-size": `${(12 + focus * 18).toFixed(1)}px`,
    "--timeline-halo-strength": (0.76 + focus * 0.24).toFixed(3),
    "--timeline-dot-scale": (1 + focus * 0.58).toFixed(3),
    "--timeline-dot-shadow": [
      `0 0 ${glowSize.toFixed(1)}px rgba(0, 227, 253, ${0.72 + focus * 0.2})`,
      `0 0 ${secondaryGlowSize.toFixed(1)}px rgba(210, 250, 255, ${0.18 + focus * 0.2})`,
    ].join(", "),
  } as CSSProperties;
}

function getNowDotStyle(focusY: number): CSSProperties {
  const focus = getTimelineFocusIntensity(NOW_TOP, focusY);

  return {
    "--timeline-halo-glow-size": `${(16 + focus * 22).toFixed(1)}px`,
    "--timeline-halo-strength": (0.78 + focus * 0.22).toFixed(3),
    "--timeline-dot-scale": (1 + focus * 0.5).toFixed(3),
    "--timeline-dot-shadow": [
      `0 0 ${(32 + focus * 24).toFixed(1)}px ${(8 + focus * 8).toFixed(1)}px rgba(0, 109, 248, ${
        0.4 + focus * 0.18
      })`,
      `0 0 ${(16 + focus * 22).toFixed(1)}px rgba(210, 250, 255, ${
        0.14 + focus * 0.24
      })`,
    ].join(", "),
  } as CSSProperties;
}

function getTimelineFocusIntensity(top: number, focusY: number) {
  return clamp(1 - Math.abs(top - focusY) / DOT_FOCUS_RANGE, 0, 1);
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
        this.alpha = Math.random() * 0.2 + 0.14;
        this.drift = Math.random() * Math.PI * 2;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = Math.random() * 0.0012 + 0.0007;
        this.size = Math.random() * 1.9 + 1.1;
        this.speedX = (Math.random() - 0.5) * 0.16;
        this.speedY = (Math.random() - 0.5) * 0.16;
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
      }

      update(time: number) {
        const dx = this.x - pointer.x;
        const dy = this.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const pointerAge = time - pointer.lastMovedAt;
        const pointerRadius = pointerAge < 520 ? 132 : 0;

        if (pointerRadius > 0 && distance > 0 && distance < pointerRadius) {
          const force = ((pointerRadius - distance) / pointerRadius) ** 2;
          this.speedX += (dx / distance) * force * 1.65;
          this.speedY += (dy / distance) * force * 1.65;
        }

        this.speedX += Math.cos(this.drift + time * 0.00018) * 0.004;
        this.speedY += Math.sin(this.drift + time * 0.00016) * 0.004;
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
        const breath = 0.72 + Math.sin(this.phase + time * this.phaseSpeed) * 0.28;
        const alpha = this.alpha * breath;
        const radius = this.size * (0.9 + breath * 0.22);

        drawingContext.beginPath();
        drawingContext.arc(this.x, this.y, radius, 0, Math.PI * 2);
        drawingContext.fillStyle = `rgba(0, 176, 204, ${alpha})`;
        drawingContext.shadowBlur = 8;
        drawingContext.shadowColor = `rgba(0, 227, 253, ${alpha * 0.58})`;
        drawingContext.fill();
      }
    }

    function syncParticleCount() {
      const targetCount = clamp(Math.round((width * height) / 17000), 42, 105);

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
