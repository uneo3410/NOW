import type { PropsWithChildren } from "react";
import type { LocalDateString } from "../features/day/types";

type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";

type DesktopLayoutProps = PropsWithChildren<{
  activeSurface: ActiveSurface;
  date: LocalDateString;
}>;

export function DesktopLayout({ activeSurface, children }: DesktopLayoutProps) {
  const isImmersiveSurface = activeSurface === "timeline" || activeSurface === "canvas";

  return (
    <div className="min-h-dvh overflow-hidden bg-surface text-ink">
      <main
        className={
          isImmersiveSurface ? "min-h-dvh min-w-0" : "min-h-dvh min-w-0 px-8 py-7"
        }
      >
        {children}
      </main>
    </div>
  );
}
