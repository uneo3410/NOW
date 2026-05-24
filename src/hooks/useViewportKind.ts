import { useEffect, useState } from "react";
import { getViewportKind, type ViewportKind } from "../utils/device";

export function useViewportKind(): ViewportKind {
  const [viewportKind, setViewportKind] = useState<ViewportKind>(() =>
    getViewportKind(window.innerWidth),
  );

  useEffect(() => {
    function handleResize() {
      setViewportKind(getViewportKind(window.innerWidth));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewportKind;
}
