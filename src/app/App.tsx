import { useEffect, useState } from "react";
import { getRoute } from "./routes";
import { AppShell } from "../layouts/AppShell";
import { isStandalonePwa } from "../utils/device";

export function App() {
  const [pathname, setPathname] = useState(() => getInitialPathname());

  useEffect(() => {
    function handlePopState() {
      setPathname(getPwaPathname(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (pathname === "/" && shouldOpenTimelineForPwa()) {
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
  return getPwaPathname(window.location.pathname);
}

function getPwaPathname(pathname: string) {
  if (pathname === "/" && shouldOpenTimelineForPwa()) {
    window.history.replaceState(null, "", "/timeline");
    return "/timeline";
  }

  return pathname;
}

function shouldOpenTimelineForPwa() {
  const params = new URLSearchParams(window.location.search);
  return isStandalonePwa() || params.get("source") === "pwa";
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("input, textarea, [contenteditable='true']"))
  );
}
