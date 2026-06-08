import { useEffect, useState } from "react";
import { CURRENT_TIMELINE_DATE_CHANGE_EVENT } from "../features/day/hooks/useCurrentDay";
import { getRoute } from "./routes";
import { AppShell } from "../layouts/AppShell";

export function App() {
  const [pathname, setPathname] = useState(() => getInitialPathname());

  useEffect(() => {
    function handleLocationChange() {
      setPathname(getAppPathname(window.location.pathname));
    }

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener(CURRENT_TIMELINE_DATE_CHANGE_EVENT, handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener(CURRENT_TIMELINE_DATE_CHANGE_EVENT, handleLocationChange);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/") {
      window.history.replaceState(null, "", "/timeline");
      setPathname("/timeline");
    }
  }, [pathname]);

  useEffect(() => {
    function preventPageCopy(event: ClipboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.clipboardData?.setData("text/plain", "");
    }

    function preventPageSelection(event: Event) {
      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
    }

    function preventSelectAll(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
      }
    }

    document.addEventListener("copy", preventPageCopy);
    document.addEventListener("cut", preventPageCopy);
    document.addEventListener("selectstart", preventPageSelection);
    document.addEventListener("keydown", preventSelectAll);

    return () => {
      document.removeEventListener("copy", preventPageCopy);
      document.removeEventListener("cut", preventPageCopy);
      document.removeEventListener("selectstart", preventPageSelection);
      document.removeEventListener("keydown", preventSelectAll);
    };
  }, []);

  return <AppShell pathname={pathname}>{getRoute(pathname)}</AppShell>;
}

function getInitialPathname() {
  return getAppPathname(window.location.pathname);
}

function getAppPathname(pathname: string) {
  if (pathname === "/") {
    window.history.replaceState(null, "", "/timeline");
    return "/timeline";
  }

  return pathname;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, [contenteditable='true']"))
  );
}
