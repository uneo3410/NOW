import { CanvasPage } from "../pages/CanvasPage";
import { HomePage } from "../pages/HomePage";
import { TimelinePage } from "../pages/TimelinePage";

export const routes = {
  canvas: <CanvasPage />,
  home: <HomePage />,
  timeline: <TimelinePage />,
};

export function getRoute(pathname: string) {
  if (pathname === "/canvas") {
    return routes.canvas;
  }

  if (pathname === "/timeline") {
    return routes.timeline;
  }

  return routes.home;
}
