import { useCurrentDay } from "../features/day/hooks/useCurrentDay";
import { useDayWorkspace } from "../features/day/hooks/useDayWorkspace";
import { TimelineView } from "../features/timeline/components/TimelineView";

export function TimelinePage() {
  const date = useCurrentDay();
  const { error, isLoading, workspace } = useDayWorkspace(date);

  return (
    <section className="relative min-h-dvh w-full">
      <div className="pointer-events-none absolute left-5 top-5 z-30 rounded-full border border-white/70 bg-white/50 px-4 py-2 text-sm font-medium text-primary shadow-glass backdrop-blur-[28px] md:left-8 md:top-8">
        {date}
      </div>
      {error ? (
        <p className="absolute left-5 right-20 top-20 z-30 rounded-2xl border border-ember/25 bg-white/70 px-4 py-3 text-sm text-ember shadow-glass backdrop-blur-[28px] md:left-8 md:right-auto md:max-w-xl">
          {error}
        </p>
      ) : null}
      {isLoading ? (
        <div className="grid min-h-dvh place-items-center bg-surface text-sm text-muted">
          正在准备当天工作区。
        </div>
      ) : (
        <TimelineView workspace={workspace} />
      )}
    </section>
  );
}
