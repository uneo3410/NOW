export type ViewportKind = "mobile" | "desktop";

export const MOBILE_VIEWPORT_MAX_WIDTH = 767;

export function isMobileViewport(width: number): boolean {
  return width <= MOBILE_VIEWPORT_MAX_WIDTH;
}

export function getViewportKind(width: number): ViewportKind {
  return isMobileViewport(width) ? "mobile" : "desktop";
}

export function isTouchDevice(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

export function isStandalonePwa(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true)
  );
}
