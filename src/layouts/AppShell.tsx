import { useEffect, type PropsWithChildren } from "react";
import { useCurrentDay } from "../features/day/hooks/useCurrentDay";
import { TimelineThemeEditorWindow } from "../features/settings/components/TimelineThemeEditorWindow";
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
  const isThemeEditorOpen = useUiStore((state) => state.isThemeEditorOpen);
  const setActiveSurface = useUiStore((state) => state.setActiveSurface);
  const setThemeEditorOpen = useUiStore((state) => state.setThemeEditorOpen);
  const setViewportKind = useUiStore((state) => state.setViewportKind);

  useEffect(() => {
    setActiveSurface(activeSurface);
  }, [activeSurface, setActiveSurface]);

  useEffect(() => {
    setViewportKind(viewportKind);
  }, [setViewportKind, viewportKind]);

  useEffect(() => {
    if (pathname === "/settings") {
      setThemeEditorOpen(true);
    }
  }, [pathname, setThemeEditorOpen]);

  const closeThemeEditor = () => setThemeEditorOpen(false);

  if (viewportKind === "mobile") {
    return (
      <>
        <MobileLayout activeSurface={activeSurface} date={date}>
          {children}
        </MobileLayout>
        <TimelineThemeEditorWindow isOpen={isThemeEditorOpen} onClose={closeThemeEditor} />
      </>
    );
  }

  return (
    <>
      <DesktopLayout activeSurface={activeSurface} date={date}>
        {children}
      </DesktopLayout>
      <TimelineThemeEditorWindow isOpen={isThemeEditorOpen} onClose={closeThemeEditor} />
    </>
  );
}

function getActiveSurface(pathname: string): ActiveSurface {
  if (pathname === "/timeline" || pathname === "/settings") {
    return "timeline";
  }

  if (pathname === "/canvas") {
    return "canvas";
  }

  return "home";
}
