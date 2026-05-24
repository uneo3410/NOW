import { useEffect, type PropsWithChildren } from "react";
import { useCurrentDay } from "../features/day/hooks/useCurrentDay";
import { useViewportKind } from "../hooks/useViewportKind";
import { useUiStore } from "../stores/uiStore";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";

type ActiveSurface = "home" | "timeline" | "canvas" | "capture" | "reports" | "settings";

type AppShellProps = PropsWithChildren<{
  pathname: string;
}>;

export function AppShell({ children, pathname }: AppShellProps) {
  const date = useCurrentDay();
  const viewportKind = useViewportKind();
  const activeSurface = getActiveSurface(pathname);
  const setActiveSurface = useUiStore((state) => state.setActiveSurface);
  const setViewportKind = useUiStore((state) => state.setViewportKind);

  useEffect(() => {
    setActiveSurface(activeSurface);
  }, [activeSurface, setActiveSurface]);

  useEffect(() => {
    setViewportKind(viewportKind);
  }, [setViewportKind, viewportKind]);

  if (viewportKind === "mobile") {
    return (
      <MobileLayout activeSurface={activeSurface} date={date}>
        {children}
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout activeSurface={activeSurface} date={date}>
      {children}
    </DesktopLayout>
  );
}

function getActiveSurface(pathname: string): ActiveSurface {
  if (pathname === "/timeline") {
    return "timeline";
  }

  if (pathname === "/canvas") {
    return "canvas";
  }

  return "home";
}
