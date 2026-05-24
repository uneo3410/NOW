import { CanvasPage } from "../pages/CanvasPage";
import { TimelinePage } from "../pages/TimelinePage";

export const routes = {
  canvas: <CanvasPage />,
  home: <TimelinePage />,
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
