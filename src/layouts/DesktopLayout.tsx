import { useState, type PropsWithChildren } from "react";
import type { LocalDateString } from "../features/day/types";

type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";

type DesktopLayoutProps = PropsWithChildren<{
  activeSurface: ActiveSurface;
  date: LocalDateString;
}>;

const navItems = [
  { href: "/", key: "home", label: "首页", shortLabel: "今" },
  { href: "/timeline", key: "timeline", label: "时间线", shortLabel: "线" },
  { href: "/canvas", key: "canvas", label: "画布", shortLabel: "画" },
] as const;

export function DesktopLayout({ activeSurface, children, date }: DesktopLayoutProps) {
  const [isRailOpen, setIsRailOpen] = useState(false);
  const isTimeline = activeSurface === "timeline";

  return (
    <div className="min-h-dvh overflow-hidden bg-surface text-ink">
      <main className={isTimeline ? "min-h-dvh min-w-0" : "min-h-dvh min-w-0 px-8 py-7 pr-24"}>
        {children}
      </main>

      <aside
        className={[
          "fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col border border-white/70 bg-white/55 shadow-glass backdrop-blur-[34px] transition-all duration-300",
          isRailOpen ? "w-64 rounded-[1.5rem] p-4" : "w-14 rounded-full p-2",
        ].join(" ")}
      >
        <button
          aria-label={isRailOpen ? "折叠导航" : "展开导航"}
          className="grid size-10 place-items-center rounded-full bg-white/70 text-primary shadow-sm transition hover:bg-white"
          onClick={() => setIsRailOpen((value) => !value)}
          type="button"
        >
          {isRailOpen ? "→" : "☰"}
        </button>

        {isRailOpen ? (
          <>
            <a className="mt-5 text-xl font-semibold tracking-normal text-ink" href="/">
              Now 时间线
            </a>
            <p className="mt-2 text-sm leading-6 text-muted">
              用卡片计划今天，用时间线保存发生过的事。
            </p>

            <div className="mt-5 rounded-[1.25rem] border border-white/70 bg-white/55 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Today</p>
              <p className="mt-1 text-base font-semibold text-primary">{date}</p>
            </div>

            <nav className="mt-5 grid gap-2">
              {navItems.map((item) => {
                const href = item.key === "home" ? item.href : `${item.href}?date=${date}`;
                const isActive = activeSurface === item.key;

                return (
                  <a
                    className={[
                      "rounded-full px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-primary text-white shadow-soft"
                        : "text-muted hover:bg-white/70 hover:text-ink",
                    ].join(" ")}
                    href={href}
                    key={item.key}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </>
        ) : (
          <nav className="mt-3 grid gap-2">
            {navItems.map((item) => {
              const href = item.key === "home" ? item.href : `${item.href}?date=${date}`;
              const isActive = activeSurface === item.key;

              return (
                <a
                  className={[
                    "grid size-10 place-items-center rounded-full text-xs font-semibold transition",
                    isActive ? "bg-primary text-white shadow-soft" : "text-primary hover:bg-white/70",
                  ].join(" ")}
                  href={href}
                  key={item.key}
                  title={item.label}
                >
                  {item.shortLabel}
                </a>
              );
            })}
          </nav>
        )}
      </aside>
    </div>
  );
}
