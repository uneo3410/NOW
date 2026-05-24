import { useCurrentDay } from "../features/day/hooks/useCurrentDay";
import { useDayWorkspace } from "../features/day/hooks/useDayWorkspace";
import { TimelineCanvasSurface } from "../features/timeline/components/TimelineCanvasSurface";
import { useResolvedTimelineTheme } from "../features/timeline/hooks/useResolvedTimelineTheme";

export function TimelinePage() {
  const date = useCurrentDay();
  const { error, isLoading, workspace } = useDayWorkspace(date);
  const {
    error: themeError,
    isLoading: isThemeLoading,
    theme,
  } = useResolvedTimelineTheme();

  return (
    <section className="relative min-h-dvh w-full">
      {error ? (
        <p className="absolute left-5 right-20 top-20 z-[60] rounded-2xl border border-ember/25 bg-white/70 px-4 py-3 text-sm text-ember shadow-glass backdrop-blur-[28px] md:left-8 md:right-auto md:max-w-xl">
          {error}
        </p>
      ) : null}
      {themeError ? (
        <p className="absolute left-5 right-20 top-32 z-[60] rounded-2xl border border-ember/25 bg-white/70 px-4 py-3 text-sm text-ember shadow-glass backdrop-blur-[28px] md:left-8 md:right-auto md:max-w-xl">
          主题加载失败，已使用默认主题：{themeError}
        </p>
      ) : null}
      {isLoading || isThemeLoading ? (
        <div className="grid min-h-dvh place-items-center bg-surface text-sm text-muted">
          正在准备当天工作区。
        </div>
      ) : (
        <TimelineCanvasSurface entryMode="timeline" themeConfig={theme} workspace={workspace} />
      )}
    </section>
  );
}
