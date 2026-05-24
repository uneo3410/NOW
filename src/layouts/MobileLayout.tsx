import type { PropsWithChildren } from "react";
import type { LocalDateString } from "../features/day/types";
import { QuickCapture } from "../features/capture/components/QuickCapture";
import { useUiStore } from "../stores/uiStore";

type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";

type MobileLayoutProps = PropsWithChildren<{
  activeSurface: ActiveSurface;
  date: LocalDateString;
}>;

const tabItems = [
  { href: "/", key: "home", label: "今日" },
  { href: "/timeline", key: "timeline", label: "时间线" },
  { href: "/canvas", key: "canvas", label: "画布" },
] as const;

export function MobileLayout({ activeSurface, children, date }: MobileLayoutProps) {
  const isQuickCaptureOpen = useUiStore((state) => state.isQuickCaptureOpen);
  const setQuickCaptureOpen = useUiStore((state) => state.setQuickCaptureOpen);
  const isTimeline = activeSurface === "timeline";

  return (
    <div className="min-h-dvh bg-surface text-ink">
      {isTimeline ? null : (
        <header className="sticky top-0 z-30 border-b border-line bg-surface/90 px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
          <a className="text-lg font-semibold text-ink" href="/">
            Now
          </a>
          <p className="mt-1 text-xs font-medium text-moss">{date}</p>
        </header>
      )}

      <main className={isTimeline ? "min-h-dvh min-w-0" : "min-w-0 px-4 pb-28 pt-5"}>
        {children}
      </main>

      {isQuickCaptureOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-ink/20 px-3 pb-3 backdrop-blur-sm">
          <div className="w-full rounded-[2rem] bg-surface p-2 shadow-soft">
            <div className="mb-2 flex justify-center">
              <button
                aria-label="关闭快速捕捉"
                className="h-1.5 w-12 rounded-full bg-line"
                onClick={() => setQuickCaptureOpen(false)}
                type="button"
              />
            </div>
            <QuickCapture onCreated={() => setQuickCaptureOpen(false)} />
          </div>
        </div>
      ) : null}

      <nav
        className={[
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 backdrop-blur",
          isTimeline ? "hidden" : "",
        ].join(" ")}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {tabItems.map((item) => {
            const href =
              item.key === "home" ? item.href : `${item.href}?date=${date}`;
            const isActive = activeSurface === item.key;

            return (
              <a
                className={[
                  "flex min-h-11 items-center justify-center rounded-full text-xs font-medium transition",
                  isActive ? "bg-ink text-surface" : "text-muted hover:bg-white/60 hover:text-ink",
                ].join(" ")}
                href={href}
                key={item.key}
              >
                {item.label}
              </a>
            );
          })}
          <button
            className="flex min-h-11 items-center justify-center rounded-full bg-ember px-3 text-xs font-medium text-white shadow-soft"
            onClick={() => setQuickCaptureOpen(true)}
            type="button"
          >
            捕捉
          </button>
        </div>
      </nav>
    </div>
  );
}
