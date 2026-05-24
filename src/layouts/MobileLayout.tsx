import type { PropsWithChildren } from "react";
import type { LocalDateString } from "../features/day/types";
import { QuickCapture } from "../features/capture/components/QuickCapture";
import { useUiStore } from "../stores/uiStore";

type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";

type MobileLayoutProps = PropsWithChildren<{
  activeSurface: ActiveSurface;
  date: LocalDateString;
  onOpenSettings: () => void;
}>;

const tabItems = [
  { href: "/", key: "home", label: "今日" },
  { href: "/timeline", key: "timeline", label: "时间线" },
  { href: "/canvas", key: "canvas", label: "画布" },
  { href: "/settings", key: "settings", label: "设置" },
] as const;

export function MobileLayout({
  activeSurface,
  children,
  date,
  onOpenSettings,
}: MobileLayoutProps) {
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
        <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
          {tabItems.map((item) => {
            const href =
              item.key === "timeline" || item.key === "canvas"
                ? `${item.href}?date=${date}`
                : item.href;
            const isActive = activeSurface === item.key;

            return (
              <MobileTabItem
                href={href}
                isActive={isActive}
                key={item.key}
                label={item.label}
                onClick={item.key === "settings" ? onOpenSettings : undefined}
              />
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

function MobileTabItem({
  href,
  isActive,
  label,
  onClick,
}: {
  href: string;
  isActive: boolean;
  label: string;
  onClick?: () => void;
}) {
  const className = [
    "flex min-h-11 items-center justify-center rounded-full text-xs font-medium transition",
    isActive ? "bg-ink text-surface" : "text-muted hover:bg-white/60 hover:text-ink",
  ].join(" ");

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {label}
      </button>
    );
  }

  return (
    <a className={className} href={href}>
      {label}
    </a>
  );
}
