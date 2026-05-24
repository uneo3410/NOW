import type { PropsWithChildren } from "react";
import type { LocalDateString } from "../features/day/types";

type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";

type MobileLayoutProps = PropsWithChildren<{
  activeSurface: ActiveSurface;
  date: LocalDateString;
}>;

export function MobileLayout({ activeSurface, children }: MobileLayoutProps) {
  const isImmersiveSurface = activeSurface === "timeline" || activeSurface === "canvas";

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <main className={isImmersiveSurface ? "min-h-dvh min-w-0" : "min-w-0 px-4 py-5"}>
        {children}
      </main>
    </div>
  );
}
