import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useTimelineThemePreviewStore } from "../../../stores/timelineThemePreviewStore";
import {
  activateDefaultTimelineTheme,
  createTimelineThemeDraftFromBase,
  deleteTimelineTheme,
  getActiveTimelineThemeId,
  getTimelineThemeDraftById,
  listTimelineThemeOptions,
  saveTimelineTheme,
  setActiveTimelineTheme,
  type TimelineThemeOption,
} from "../services/timelineThemeSettingsService";
import { createLocalTimelineThemeDraft } from "../../timeline/theme/defaultTheme";
import { resolveTimelineTheme } from "../../timeline/theme/resolveTheme";
import {
  DEFAULT_TIMELINE_THEME_ID,
  type TimelineThemeConfig,
} from "../../timeline/theme/types";

type TimelineThemeEditorWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type ThemeSectionKey = Exclude<keyof TimelineThemeConfig, "id" | "name" | "version">;

type EditorRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const MIN_WINDOW_WIDTH = 340;
const MIN_WINDOW_HEIGHT = 420;
const VIEWPORT_MARGIN = 16;

export function TimelineThemeEditorWindow({
  isOpen,
  onClose,
  onSaved,
}: TimelineThemeEditorWindowProps) {
  const [activeThemeId, setActiveThemeId] = useState(DEFAULT_TIMELINE_THEME_ID);
  const [draftTheme, setDraftTheme] = useState<TimelineThemeConfig>(createLocalTimelineThemeDraft);
  const [cursorFile, setCursorFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState(DEFAULT_TIMELINE_THEME_ID);
  const [status, setStatus] = useState<string | null>(null);
  const [themeOptions, setThemeOptions] = useState<TimelineThemeOption[]>([]);
  const [wallpaperFile, setWallpaperFile] = useState<File | null>(null);
  const bumpThemeRevision = useTimelineThemePreviewStore((state) => state.bumpThemeRevision);
  const clearPreviewTheme = useTimelineThemePreviewStore((state) => state.clearPreviewTheme);
  const setPreviewTheme = useTimelineThemePreviewStore((state) => state.setPreviewTheme);
  const [rect, setRect] = useState<EditorRect>(() => getInitialWindowRect());
  const pendingUrlsRef = useRef<string[]>([]);
  const resolvedThemeRevokeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let isMounted = true;
    setRect(getInitialWindowRect());

    async function loadSettings() {
      setIsLoading(true);
      setError(null);
      setStatus(null);

      try {
        const [activeId, options] = await Promise.all([
          getActiveTimelineThemeId(),
          listTimelineThemeOptions(),
        ]);
        const activeTheme = await getTimelineThemeDraftById(activeId);
        const resolvedTheme = await resolveTimelineTheme(activeTheme);
        resolvedThemeRevokeRef.current?.();
        resolvedThemeRevokeRef.current = resolvedTheme.revoke;

        if (isMounted) {
          setActiveThemeId(activeId);
          setSelectedThemeId(activeId);
          setThemeOptions(options);
          setDraftTheme(resolvedTheme.config);
          setPreviewTheme(resolvedTheme.config);
          setCursorFile(null);
          setWallpaperFile(null);
        } else {
          resolvedTheme.revoke();
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
      clearPreviewTheme();
      revokeRuntimeUrls();
    };
  }, [clearPreviewTheme, isOpen, setPreviewTheme]);

  useEffect(() => {
    if (isOpen && !isLoading) {
      setPreviewTheme(draftTheme);
    }
  }, [draftTheme, isLoading, isOpen, setPreviewTheme]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleResize() {
      setRect((current) => constrainRect(current));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  function updateTheme(patch: Partial<TimelineThemeConfig>) {
    setDraftTheme((current) => ({ ...current, ...patch }));
  }

  function updateThemeSection<K extends ThemeSectionKey>(
    section: K,
    patch: Partial<TimelineThemeConfig[K]>,
  ) {
    setDraftTheme((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...patch,
      },
    }));
  }

  function updateParticleRange(key: "alphaRange" | "sizeRange", index: 0 | 1, value: number) {
    setDraftTheme((current) => {
      const range = [...current.particles[key]] as [number, number];
      range[index] = value;

      return {
        ...current,
        particles: {
          ...current.particles,
          [key]: range,
        },
      };
    });
  }

  function updateCursorHotspot(axis: "x" | "y", value: number) {
    setDraftTheme((current) => ({
      ...current,
      cursor: {
        ...current.cursor,
        hotspot: {
          ...current.cursor.hotspot,
          [axis]: value,
        },
      },
    }));
  }

  function handleWallpaperFile(file: File | null) {
    setWallpaperFile(file);

    if (!file) {
      return;
    }

    const imageUrl = createPendingUrl(file);
    updateThemeSection("wallpaper", {
      assetId: undefined,
      imageUrl,
      type: "image",
    });
  }

  function handleCursorFile(file: File | null) {
    setCursorFile(file);

    if (!file) {
      return;
    }

    const imageUrl = createPendingUrl(file);
    updateThemeSection("cursor", {
      assetId: undefined,
      imageUrl,
      type: "image",
    });
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setStatus(null);

    try {
      const savedTheme = await saveTimelineTheme({
        cursorFile,
        theme: draftTheme,
        wallpaperFile,
      });
      const options = await listTimelineThemeOptions();
      const resolvedTheme = await resolveTimelineTheme(savedTheme);
      revokeRuntimeUrls();
      resolvedThemeRevokeRef.current = resolvedTheme.revoke;
      setCursorFile(null);
      setWallpaperFile(null);
      setActiveThemeId(savedTheme.id);
      setSelectedThemeId(savedTheme.id);
      setThemeOptions(options);
      setDraftTheme(resolvedTheme.config);
      setStatus("自定义主题已保存并启用。");
      bumpThemeRevision();
      onSaved?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivateDefault() {
    setError(null);
    setStatus(null);

    try {
      await activateDefaultTimelineTheme();
      const defaultTheme = await getTimelineThemeDraftById(DEFAULT_TIMELINE_THEME_ID);
      setActiveThemeId(DEFAULT_TIMELINE_THEME_ID);
      setSelectedThemeId(DEFAULT_TIMELINE_THEME_ID);
      setDraftTheme(defaultTheme);
      setPreviewTheme(defaultTheme);
      setCursorFile(null);
      setWallpaperFile(null);
      setStatus("已恢复默认时间线主题。");
      bumpThemeRevision();
      onSaved?.();
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : String(activateError));
    }
  }

  function createPendingUrl(file: File) {
    const imageUrl = URL.createObjectURL(file);
    pendingUrlsRef.current.push(imageUrl);
    return imageUrl;
  }

  function revokeRuntimeUrls() {
    pendingUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    pendingUrlsRef.current = [];
    resolvedThemeRevokeRef.current?.();
    resolvedThemeRevokeRef.current = null;
  }

  function handleClose() {
    clearPreviewTheme();
    revokeRuntimeUrls();
    onClose();
  }

  async function handleSelectTheme(themeId: string) {
    setError(null);
    setStatus(null);
    setIsLoading(true);

    try {
      const theme = await getTimelineThemeDraftById(themeId);
      const resolvedTheme = await resolveTimelineTheme(theme);
      await setActiveTimelineTheme(themeId);
      revokeRuntimeUrls();
      resolvedThemeRevokeRef.current = resolvedTheme.revoke;
      setActiveThemeId(themeId);
      setSelectedThemeId(themeId);
      setDraftTheme(resolvedTheme.config);
      setPreviewTheme(resolvedTheme.config);
      setCursorFile(null);
      setWallpaperFile(null);
      setIsThemeDrawerOpen(false);
      setStatus(`已切换到「${resolvedTheme.config.name}」。`);
      bumpThemeRevision();
      onSaved?.();
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : String(selectError));
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateTheme() {
    const nextTheme = createTimelineThemeDraftFromBase(draftTheme);
    setSelectedThemeId(nextTheme.id);
    setDraftTheme(nextTheme);
    setPreviewTheme(nextTheme);
    setCursorFile(null);
    setWallpaperFile(null);
    setStatus("已创建新主题草稿，保存后会加入主题列表。");
    setIsThemeDrawerOpen(false);
  }

  async function handleDeleteSelectedTheme() {
    if (selectedThemeId === DEFAULT_TIMELINE_THEME_ID) {
      return;
    }

    setError(null);
    setStatus(null);

    try {
      await deleteTimelineTheme(selectedThemeId);
      const [options, defaultTheme] = await Promise.all([
        listTimelineThemeOptions(),
        getTimelineThemeDraftById(DEFAULT_TIMELINE_THEME_ID),
      ]);
      setThemeOptions(options);
      setActiveThemeId(await getActiveTimelineThemeId());
      setSelectedThemeId(DEFAULT_TIMELINE_THEME_ID);
      setDraftTheme(defaultTheme);
      setPreviewTheme(defaultTheme);
      setStatus("主题已删除。");
      bumpThemeRevision();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError));
    }
  }

  function handleDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = rect;

    function handlePointerMove(moveEvent: PointerEvent) {
      setRect(
        constrainRect({
          ...startRect,
          x: startRect.x + moveEvent.clientX - startX,
          y: startRect.y + moveEvent.clientY - startY,
        }),
      );
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  function handleResizeStart(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = rect;

    function handlePointerMove(moveEvent: PointerEvent) {
      setRect(
        constrainRect({
          ...startRect,
          width: startRect.width + moveEvent.clientX - startX,
          height: startRect.height + moveEvent.clientY - startY,
        }),
      );
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  if (!isOpen) {
    return null;
  }

  const isCompact = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <div
        className="pointer-events-auto relative flex overflow-hidden border border-white/70 bg-white/[0.58] shadow-[0_18px_56px_rgba(0,50,88,0.18),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-[34px]"
        style={{
          borderRadius: isCompact ? 20 : 22,
          height: isCompact ? "calc(100dvh - 1.5rem)" : rect.height,
          left: isCompact ? 12 : rect.x,
          position: "fixed",
          top: isCompact ? 12 : rect.y,
          width: isCompact ? "calc(100vw - 1.5rem)" : rect.width,
        }}
      >
        <div className="flex min-h-0 w-full flex-col">
          <div
            className="flex h-12 cursor-move select-none items-center justify-between gap-3 border-b border-white/[0.55] bg-white/[0.28] px-4"
            onPointerDown={handleDragStart}
          >
            <span className="h-1.5 w-12 rounded-full bg-line" />
            <button
              aria-label="关闭主题编辑窗口"
              className="grid size-9 place-items-center rounded-full border border-white/70 bg-white/[0.65] text-sm font-semibold text-muted shadow-sm transition hover:bg-white hover:text-ink"
              onClick={handleClose}
              type="button"
            >
              X
            </button>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {isThemeDrawerOpen ? (
              <div className="absolute inset-y-0 left-0 z-30 w-[min(19rem,calc(100%-1rem))] border-r border-white/[0.65] bg-white/[0.74] shadow-[12px_0_38px_rgba(0,50,88,0.12)] backdrop-blur-[34px]">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-center justify-between border-b border-white/[0.55] px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                        Themes
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-ink">主题切换</h3>
                    </div>
                    <button
                      aria-label="关闭主题抽屉"
                      className="grid size-8 place-items-center rounded-full bg-white/70 text-sm font-semibold text-muted transition hover:bg-white hover:text-ink"
                      onClick={() => setIsThemeDrawerOpen(false)}
                      type="button"
                    >
                      X
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3">
                    <div className="grid gap-2">
                      {themeOptions.map((theme) => {
                        const isSelected = selectedThemeId === theme.id;
                        const isActive = activeThemeId === theme.id;

                        return (
                          <button
                            className={[
                              "rounded-2xl border px-3 py-3 text-left transition",
                              isSelected
                                ? "border-primary/40 bg-primary/10 text-ink"
                                : "border-white/60 bg-white/[0.54] text-muted hover:bg-white/[0.78] hover:text-ink",
                            ].join(" ")}
                            key={theme.id}
                            onClick={() => void handleSelectTheme(theme.id)}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold">{theme.name}</span>
                              {isActive ? (
                                <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-white">
                                  Active
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {theme.isDefault ? "默认主题" : "自定义主题"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-white/[0.55] p-3">
                    <button
                      className="flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-surface shadow-soft transition hover:bg-ink/90"
                      onClick={handleCreateTheme}
                      type="button"
                    >
                      新建当前主题副本
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {isLoading ? (
              <div className="grid h-full place-items-center text-sm text-muted">
                正在读取主题设置。
              </div>
            ) : (
              <div className="h-full overflow-y-auto px-5 py-5 pb-24">
                <div className="grid gap-6">
                  {error ? (
                    <div className="rounded-2xl border border-ember/25 bg-white/[0.62] px-4 py-3 text-sm text-ember shadow-glass backdrop-blur">
                      {error}
                    </div>
                  ) : null}
                  {status ? (
                    <div className="rounded-2xl border border-moss/20 bg-white/[0.62] px-4 py-3 text-sm text-moss shadow-glass backdrop-blur">
                      {status}
                    </div>
                  ) : null}

                  <Section title="主题身份">
                    <label className="grid gap-2 text-sm font-medium text-ink">
                      名称
                      <Input
                        onChange={(event) => updateTheme({ name: event.target.value })}
                        value={draftTheme.name}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span
                        className={[
                          "rounded-full px-3 py-2",
                          selectedThemeId === DEFAULT_TIMELINE_THEME_ID
                            ? "bg-primary text-white"
                            : "bg-white/70 text-muted",
                        ].join(" ")}
                      >
                        {selectedThemeId === DEFAULT_TIMELINE_THEME_ID ? "默认主题" : "自定义主题"}
                      </span>
                      <span
                        className={[
                          "rounded-full px-3 py-2",
                          selectedThemeId === activeThemeId
                            ? "bg-primary text-white"
                            : "bg-white/70 text-muted",
                        ].join(" ")}
                      >
                        {selectedThemeId === activeThemeId ? "当前启用" : "未启用"}
                      </span>
                    </div>
                  </Section>

                  <Section title="壁纸">
                    <FileField accept="image/*" label="壁纸图片" onChange={handleWallpaperFile} />
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
                      <SelectField
                        label="壁纸类型"
                        onChange={(value) =>
                          updateThemeSection("wallpaper", {
                            assetId:
                              value === "default" ? undefined : draftTheme.wallpaper.assetId,
                            imageUrl:
                              value === "default" ? undefined : draftTheme.wallpaper.imageUrl,
                            type: value as "default" | "image",
                          })
                        }
                        options={[
                          { label: "默认背景", value: "default" },
                          { label: "图片背景", value: "image" },
                        ]}
                        value={draftTheme.wallpaper.type}
                      />
                      <SelectField
                        label="图片填充"
                        onChange={(value) =>
                          updateThemeSection("wallpaper", { fit: value as "cover" | "contain" })
                        }
                        options={[
                          { label: "覆盖", value: "cover" },
                          { label: "完整显示", value: "contain" },
                        ]}
                        value={draftTheme.wallpaper.fit}
                      />
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
                      <NumberField
                        label="背景模糊"
                        max={28}
                        min={0}
                        onChange={(value) => updateThemeSection("wallpaper", { blur: value })}
                        step={1}
                        value={draftTheme.wallpaper.blur}
                      />
                      <NumberField
                        label="背景调光"
                        max={0.72}
                        min={0}
                        onChange={(value) => updateThemeSection("wallpaper", { dim: value })}
                        step={0.01}
                        value={draftTheme.wallpaper.dim}
                      />
                    </div>
                  </Section>

                  <Section title="粒子">
                    <ToggleField
                      checked={draftTheme.particles.enabled}
                      label="启用粒子"
                      onChange={(enabled) => updateThemeSection("particles", { enabled })}
                    />
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
                      <ColorField
                        label="粒子颜色"
                        onChange={(color) => updateThemeSection("particles", { color })}
                        value={draftTheme.particles.color}
                      />
                      <ColorField
                        label="粒子光晕"
                        onChange={(glowColor) => updateThemeSection("particles", { glowColor })}
                        value={draftTheme.particles.glowColor}
                      />
                      <NumberField
                        label="粒子密度"
                        max={60000}
                        min={4500}
                        onChange={(density) => updateThemeSection("particles", { density })}
                        step={500}
                        value={draftTheme.particles.density}
                      />
                      <NumberField
                        label="桌面粒子上限"
                        max={260}
                        min={42}
                        onChange={(maxCount) => updateThemeSection("particles", { maxCount })}
                        step={1}
                        value={draftTheme.particles.maxCount}
                      />
                      <NumberField
                        label="移动端上限"
                        max={120}
                        min={16}
                        onChange={(mobileMaxCount) =>
                          updateThemeSection("particles", { mobileMaxCount })
                        }
                        step={1}
                        value={draftTheme.particles.mobileMaxCount}
                      />
                      <NumberField
                        label="漂浮速度"
                        max={0.42}
                        min={0}
                        onChange={(speed) => updateThemeSection("particles", { speed })}
                        step={0.01}
                        value={draftTheme.particles.speed}
                      />
                      <NumberField
                        label="光晕强度"
                        max={18}
                        min={0}
                        onChange={(glow) => updateThemeSection("particles", { glow })}
                        step={1}
                        value={draftTheme.particles.glow}
                      />
                      <NumberField
                        label="最小尺寸"
                        max={5.4}
                        min={0.7}
                        onChange={(value) => updateParticleRange("sizeRange", 0, value)}
                        step={0.1}
                        value={draftTheme.particles.sizeRange[0]}
                      />
                      <NumberField
                        label="最大尺寸"
                        max={5.4}
                        min={0.7}
                        onChange={(value) => updateParticleRange("sizeRange", 1, value)}
                        step={0.1}
                        value={draftTheme.particles.sizeRange[1]}
                      />
                      <NumberField
                        label="指针半径"
                        max={220}
                        min={0}
                        onChange={(pointerRadius) =>
                          updateThemeSection("particles", { pointerRadius })
                        }
                        step={1}
                        value={draftTheme.particles.pointerRadius}
                      />
                      <NumberField
                        label="指针斥力"
                        max={4}
                        min={0}
                        onChange={(pointerForce) =>
                          updateThemeSection("particles", { pointerForce })
                        }
                        step={0.05}
                        value={draftTheme.particles.pointerForce}
                      />
                    </div>
                  </Section>

                  <Section title="光柱与光点">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
                      <ColorField
                        label="光柱主线"
                        onChange={(lineColor) => updateThemeSection("beam", { lineColor })}
                        value={draftTheme.beam.lineColor}
                      />
                      <ColorField
                        label="光柱柔光"
                        onChange={(glowColor) => updateThemeSection("beam", { glowColor })}
                        value={draftTheme.beam.glowColor}
                      />
                      <NumberField
                        label="焦点间隙"
                        max={24}
                        min={4}
                        onChange={(focusGap) => updateThemeSection("beam", { focusGap })}
                        step={1}
                        value={draftTheme.beam.focusGap}
                      />
                      <NumberField
                        label="柔光强度"
                        max={1}
                        min={0}
                        onChange={(glowIntensity) =>
                          updateThemeSection("beam", { glowIntensity })
                        }
                        step={0.01}
                        value={draftTheme.beam.glowIntensity}
                      />
                      <ColorField
                        label="流光颜色"
                        onChange={(glintColor) => updateThemeSection("beam", { glintColor })}
                        value={draftTheme.beam.glintColor}
                      />
                      <NumberField
                        label="流光透明度"
                        max={1}
                        min={0}
                        onChange={(glintOpacity) =>
                          updateThemeSection("beam", { glintOpacity })
                        }
                        step={0.01}
                        value={draftTheme.beam.glintOpacity}
                      />
                      <NumberField
                        label="流光宽度"
                        max={36}
                        min={4}
                        onChange={(glintWidth) => updateThemeSection("beam", { glintWidth })}
                        step={1}
                        value={draftTheme.beam.glintWidth}
                      />
                      <NumberField
                        label="流光长度"
                        max={180}
                        min={24}
                        onChange={(glintHeight) => updateThemeSection("beam", { glintHeight })}
                        step={1}
                        value={draftTheme.beam.glintHeight}
                      />
                      <NumberField
                        label="流光模糊"
                        max={8}
                        min={0}
                        onChange={(glintBlur) => updateThemeSection("beam", { glintBlur })}
                        step={0.1}
                        value={draftTheme.beam.glintBlur}
                      />
                      <NumberField
                        label="流光柔光"
                        max={3}
                        min={0}
                        onChange={(glintGlow) => updateThemeSection("beam", { glintGlow })}
                        step={0.05}
                        value={draftTheme.beam.glintGlow}
                      />
                      <ColorField
                        label="普通光点"
                        onChange={(dotColor) => updateThemeSection("halo", { dotColor })}
                        value={draftTheme.halo.dotColor}
                      />
                      <ColorField
                        label="Now 光点"
                        onChange={(nowDotColor) => updateThemeSection("halo", { nowDotColor })}
                        value={draftTheme.halo.nowDotColor}
                      />
                      <ColorField
                        label="普通光环描边"
                        onChange={(color) => updateThemeSection("halo", { color })}
                        value={draftTheme.halo.color}
                      />
                      <ColorField
                        label="Now 光环描边"
                        onChange={(nowColor) => updateThemeSection("halo", { nowColor })}
                        value={draftTheme.halo.nowColor}
                      />
                      <ColorField
                        label="光环外晕"
                        onChange={(glowColor) => updateThemeSection("halo", { glowColor })}
                        value={draftTheme.halo.glowColor}
                      />
                      <NumberField
                        label="普通描边宽度"
                        max={4}
                        min={1}
                        onChange={(strokeWidth) => updateThemeSection("halo", { strokeWidth })}
                        step={0.1}
                        value={draftTheme.halo.strokeWidth}
                      />
                      <NumberField
                        label="Now 描边宽度"
                        max={5}
                        min={1}
                        onChange={(nowStrokeWidth) =>
                          updateThemeSection("halo", { nowStrokeWidth })
                        }
                        step={0.1}
                        value={draftTheme.halo.nowStrokeWidth}
                      />
                      <NumberField
                        label="光点放大"
                        max={0.9}
                        min={0}
                        onChange={(dotFocusScale) =>
                          updateThemeSection("halo", { dotFocusScale })
                        }
                        step={0.01}
                        value={draftTheme.halo.dotFocusScale}
                      />
                    </div>
                  </Section>

                  <Section title="景深与卡片">
                    <ToggleField
                      checked={draftTheme.depth.enabled}
                      label="启用景深"
                      onChange={(enabled) => updateThemeSection("depth", { enabled })}
                    />
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
                      <NumberField
                        label="景深焦点范围"
                        max={44}
                        min={8}
                        onChange={(focusRange) => updateThemeSection("depth", { focusRange })}
                        step={1}
                        value={draftTheme.depth.focusRange}
                      />
                      <NumberField
                        label="最大景深模糊"
                        max={2}
                        min={0}
                        onChange={(maxBlur) => updateThemeSection("depth", { maxBlur })}
                        step={0.05}
                        value={draftTheme.depth.maxBlur}
                      />
                      <TextField
                        label="卡片背景"
                        onChange={(background) => updateThemeSection("card", { background })}
                        value={draftTheme.card.background}
                      />
                      <TextField
                        label="卡片悬停背景"
                        onChange={(backgroundHover) =>
                          updateThemeSection("card", { backgroundHover })
                        }
                        value={draftTheme.card.backgroundHover}
                      />
                      <ColorField
                        label="正文颜色"
                        onChange={(textColor) => updateThemeSection("card", { textColor })}
                        value={draftTheme.card.textColor}
                      />
                      <ColorField
                        label="时间颜色"
                        onChange={(timeColor) => updateThemeSection("card", { timeColor })}
                        value={draftTheme.card.timeColor}
                      />
                      <NumberField
                        label="玻璃模糊"
                        max={54}
                        min={0}
                        onChange={(blur) => updateThemeSection("card", { blur })}
                        step={1}
                        value={draftTheme.card.blur}
                      />
                      <NumberField
                        label="圆角"
                        max={24}
                        min={6}
                        onChange={(radius) => updateThemeSection("card", { radius })}
                        step={1}
                        value={draftTheme.card.radius}
                      />
                    </div>
                  </Section>

                  <Section title="Now 输入与光标">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
                      <TextField
                        label="输入背景"
                        onChange={(background) =>
                          updateThemeSection("nowInput", { background })
                        }
                        value={draftTheme.nowInput.background}
                      />
                      <TextField
                        label="输入悬停背景"
                        onChange={(backgroundHover) =>
                          updateThemeSection("nowInput", { backgroundHover })
                        }
                        value={draftTheme.nowInput.backgroundHover}
                      />
                      <ColorField
                        label="输入文字"
                        onChange={(textColor) =>
                          updateThemeSection("nowInput", { textColor })
                        }
                        value={draftTheme.nowInput.textColor}
                      />
                      <ColorField
                        label="按钮文字"
                        onChange={(buttonTextColor) =>
                          updateThemeSection("nowInput", { buttonTextColor })
                        }
                        value={draftTheme.nowInput.buttonTextColor}
                      />
                      <NumberField
                        label="输入模糊"
                        max={54}
                        min={0}
                        onChange={(blur) => updateThemeSection("nowInput", { blur })}
                        step={1}
                        value={draftTheme.nowInput.blur}
                      />
                    </div>
                    <FileField accept="image/*" label="光标图片" onChange={handleCursorFile} />
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
                      <SelectField
                        label="光标类型"
                        onChange={(value) =>
                          updateThemeSection("cursor", {
                            assetId:
                              value === "default" ? undefined : draftTheme.cursor.assetId,
                            imageUrl:
                              value === "default" ? undefined : draftTheme.cursor.imageUrl,
                            type: value as "default" | "image",
                          })
                        }
                        options={[
                          { label: "默认", value: "default" },
                          { label: "图片", value: "image" },
                        ]}
                        value={draftTheme.cursor.type}
                      />
                      <NumberField
                        label="尺寸"
                        max={96}
                        min={16}
                        onChange={(size) => updateThemeSection("cursor", { size })}
                        step={1}
                        value={draftTheme.cursor.size}
                      />
                      <NumberField
                        label="热点 X"
                        max={draftTheme.cursor.size}
                        min={0}
                        onChange={(value) => updateCursorHotspot("x", value)}
                        step={1}
                        value={draftTheme.cursor.hotspot.x}
                      />
                      <NumberField
                        label="热点 Y"
                        max={draftTheme.cursor.size}
                        min={0}
                        onChange={(value) => updateCursorHotspot("y", value)}
                        step={1}
                        value={draftTheme.cursor.hotspot.y}
                      />
                    </div>
                  </Section>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/60 bg-white/[0.42] px-4 py-3 backdrop-blur-[24px]">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">主题编辑</p>
              <h2 className="mt-1 truncate text-base font-semibold text-ink">{draftTheme.name}</h2>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Button
                className="min-h-10 px-4"
                onClick={() => setIsThemeDrawerOpen((value) => !value)}
                variant="secondary"
              >
                主题
              </Button>
              <Button
                className="min-h-10 px-4"
                disabled={selectedThemeId === DEFAULT_TIMELINE_THEME_ID}
                onClick={handleActivateDefault}
                variant="secondary"
              >
                默认
              </Button>
              <Button
                className="min-h-10 px-4"
                disabled={selectedThemeId === DEFAULT_TIMELINE_THEME_ID}
                onClick={() => void handleDeleteSelectedTheme()}
                variant="danger"
              >
                删除
              </Button>
              <Button className="min-h-10 px-4" disabled={isSaving} onClick={handleSave}>
                {isSaving ? "保存中" : "保存"}
              </Button>
            </div>
          </div>
        </div>

        <button
          aria-label="拖动缩放主题编辑窗口"
          className="absolute bottom-2 right-2 z-20 h-8 w-8 cursor-nwse-resize rounded-lg border border-white/70 bg-white/[0.55] shadow-sm transition hover:bg-white"
          onPointerDown={handleResizeStart}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-muted">open_in_full</span>
        </button>
      </div>
    </div>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="grid gap-4 border-t border-line/70 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function FileField({
  accept,
  label,
  onChange,
}: {
  accept: string;
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <input
        accept={accept}
        className="block w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        type="file"
      />
    </label>
  );
}

function ToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 rounded-2xl border border-line bg-white/70 px-4 text-sm font-medium text-ink">
      {label}
      <input
        checked={checked}
        className="h-5 w-5 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span className="flex items-center justify-between gap-3">
        {label}
        <span className="font-mono text-xs text-muted">{formatNumber(value)}</span>
      </span>
      <input
        className="h-2 w-full accent-primary"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <Input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function ColorField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <div className="flex gap-2">
        <input
          aria-label={`${label} swatch`}
          className="h-11 w-14 rounded-2xl border border-line bg-white p-1"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={toColorInputValue(value)}
        />
        <Input onChange={(event) => onChange(event.target.value)} value={value} />
      </div>
    </label>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <Input onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <select
        className="min-h-11 w-full rounded-2xl border border-line bg-white/70 px-4 text-sm text-ink outline-none transition focus:border-moss focus:bg-white focus:ring-4 focus:ring-moss/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getInitialWindowRect(): EditorRect {
  if (typeof window === "undefined") {
    return { height: 680, width: 420, x: 80, y: 64 };
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(440, viewportWidth - VIEWPORT_MARGIN * 2);
  const height = Math.min(720, viewportHeight - VIEWPORT_MARGIN * 2);

  return constrainRect({
    height,
    width,
    x: viewportWidth - width - 88,
    y: 40,
  });
}

function constrainRect(rect: EditorRect): EditorRect {
  if (typeof window === "undefined") {
    return rect;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxWidth = Math.max(280, viewportWidth - VIEWPORT_MARGIN * 2);
  const maxHeight = Math.max(360, viewportHeight - VIEWPORT_MARGIN * 2);
  const minWidth = Math.min(MIN_WINDOW_WIDTH, maxWidth);
  const minHeight = Math.min(MIN_WINDOW_HEIGHT, maxHeight);
  const width = clamp(rect.width, minWidth, maxWidth);
  const height = clamp(rect.height, minHeight, maxHeight);
  const x = clamp(
    rect.x,
    VIEWPORT_MARGIN,
    Math.max(VIEWPORT_MARGIN, viewportWidth - width - VIEWPORT_MARGIN),
  );
  const y = clamp(
    rect.y,
    VIEWPORT_MARGIN,
    Math.max(VIEWPORT_MARGIN, viewportHeight - height - VIEWPORT_MARGIN),
  );

  return { height, width, x, y };
}

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(target.closest("button, input, textarea, select, a, label"))
  );
}

function toColorInputValue(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }

  const rgbaMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  if (!rgbaMatch) {
    return "#0056c6";
  }

  return [rgbaMatch[1], rgbaMatch[2], rgbaMatch[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")
    .padStart(7, "#");
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
