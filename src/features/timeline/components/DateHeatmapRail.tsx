import { useEffect, useMemo, useState } from "react";
import {
  CURRENT_TIMELINE_DATE_CHANGE_EVENT,
  setCurrentTimelineDate,
} from "../../day/hooks/useCurrentDay";
import { getDayActivityStats, type DayActivityStats } from "../../day/services/dayStatsService";
import type { LocalDateString } from "../../day/types";
import { addLocalDays, todayLocalDate } from "../../../utils/date";

type DateHeatmapRailProps = {
  currentDate?: LocalDateString;
};

const HEATMAP_DAYS = 30;
const FUTURE_DAYS_IN_WINDOW = 6;

export function DateHeatmapRail({ currentDate }: DateHeatmapRailProps) {
  const selectedDate = currentDate ?? todayLocalDate();
  const today = todayLocalDate();
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<DayActivityStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dates = useMemo(() => getHeatmapDates(selectedDate), [selectedDate]);
  const statsByDate = useMemo(
    () => new Map(stats.map((stat) => [stat.date, stat])),
    [stats],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    async function loadStats() {
      setIsLoading(true);
      setError(null);

      try {
        const nextStats = await getDayActivityStats(dates[0], dates[dates.length - 1]);

        if (isMounted) {
          setStats(nextStats);
        }
      } catch (statsError) {
        if (isMounted) {
          setError(statsError instanceof Error ? statsError.message : String(statsError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [dates, isOpen]);

  useEffect(() => {
    function closeOnRouteChange() {
      setIsOpen(false);
    }

    window.addEventListener(CURRENT_TIMELINE_DATE_CHANGE_EVENT, closeOnRouteChange);

    return () => {
      window.removeEventListener(CURRENT_TIMELINE_DATE_CHANGE_EVENT, closeOnRouteChange);
    };
  }, []);

  function switchToDate(date: LocalDateString) {
    setCurrentTimelineDate(date);
  }

  return (
    <div className="fixed right-[calc(env(safe-area-inset-right)+0.75rem)] top-[calc(env(safe-area-inset-top)+5.1rem)] z-50 sm:right-[calc(env(safe-area-inset-right)+1rem)] md:top-1/2 md:-translate-y-1/2">
      <button
        aria-expanded={isOpen}
        aria-label="切换时间线日期"
        className="grid size-11 place-items-center rounded-full border border-white/70 bg-white/[0.62] text-primary shadow-glass backdrop-blur-[28px] transition hover:bg-white"
        onClick={() => setIsOpen((value) => !value)}
        title="切换时间线日期"
        type="button"
      >
        <span className="material-symbols-outlined text-[22px]">calendar_month</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(21rem,calc(100vw-1.5rem))] rounded-[1.35rem] border border-white/70 bg-white/[0.78] p-3 text-ink shadow-[0_18px_60px_rgba(0,50,88,0.18)] backdrop-blur-[34px] md:right-[calc(100%+0.75rem)] md:top-1/2 md:-translate-y-1/2">
          <div className="flex items-center justify-between gap-2">
            <button
              aria-label="前一天"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/70 hover:text-primary"
              onClick={() => switchToDate(addLocalDays(selectedDate, -1))}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <label className="min-w-0 flex-1">
              <span className="sr-only">选择日期</span>
              <input
                className="h-10 w-full rounded-full border border-white/70 bg-white/65 px-3 text-center text-sm font-semibold text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                onChange={(event) => switchToDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </label>
            <button
              aria-label="后一天"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white/70 hover:text-primary"
              onClick={() => switchToDate(addLocalDays(selectedDate, 1))}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-10 gap-1.5">
            {dates.map((date) => {
              const stat = statsByDate.get(date);
              const activityCount = stat?.activityCount ?? 0;
              const isSelected = date === selectedDate;
              const isToday = date === today;

              return (
                <button
                  aria-label={`${date}，${activityCount} 条时间线记录`}
                  className={[
                    "relative aspect-square rounded-md border text-[10px] font-semibold transition hover:-translate-y-0.5 hover:shadow-sm",
                    getActivityClass(activityCount),
                    isSelected ? "border-primary ring-2 ring-primary/25" : "border-white/70",
                    isToday ? "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-ember" : "",
                  ].join(" ")}
                  key={date}
                  onClick={() => switchToDate(date)}
                  title={`${date} · ${activityCount} 条时间线记录`}
                  type="button"
                >
                  {date.slice(8)}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex min-h-5 items-center justify-between gap-2 text-xs text-muted">
            <span>{isLoading ? "读取活跃度" : "Timeline activity"}</span>
            {error ? <span className="truncate text-ember">{error}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getHeatmapDates(selectedDate: LocalDateString): LocalDateString[] {
  const startDate = addLocalDays(selectedDate, -(HEATMAP_DAYS - FUTURE_DAYS_IN_WINDOW - 1));

  return Array.from({ length: HEATMAP_DAYS }, (_, index) => addLocalDays(startDate, index));
}

function getActivityClass(activityCount: number): string {
  if (activityCount >= 6) {
    return "bg-primary text-white";
  }

  if (activityCount >= 3) {
    return "bg-moss/75 text-white";
  }

  if (activityCount >= 1) {
    return "bg-primary-soft text-primary";
  }

  return "bg-white/55 text-muted";
}
