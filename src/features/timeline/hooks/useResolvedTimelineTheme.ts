import { useEffect, useState } from "react";
import { useTimelineThemePreviewStore } from "../../../stores/timelineThemePreviewStore";
import { getActiveTimelineTheme } from "../../settings/services/timelineThemeSettingsService";
import { defaultTimelineTheme } from "../theme/defaultTheme";
import { resolveTimelineTheme } from "../theme/resolveTheme";
import type { ResolvedTimelineThemeConfig } from "../theme/types";

type ResolvedTimelineThemeState = {
  error: string | null;
  isLoading: boolean;
  theme: ResolvedTimelineThemeConfig;
};

export function useResolvedTimelineTheme(): ResolvedTimelineThemeState {
  const previewTheme = useTimelineThemePreviewStore((state) => state.previewTheme);
  const themeRevision = useTimelineThemePreviewStore((state) => state.themeRevision);
  const [state, setState] = useState<ResolvedTimelineThemeState>({
    error: null,
    isLoading: true,
    theme: defaultTimelineTheme,
  });

  useEffect(() => {
    let isMounted = true;
    let revokeThemeUrls: (() => void) | null = null;

    async function loadTheme() {
      try {
        const activeTheme = await getActiveTimelineTheme();
        const resolvedTheme = await resolveTimelineTheme(activeTheme);
        revokeThemeUrls = resolvedTheme.revoke;

        if (isMounted) {
          setState({
            error: null,
            isLoading: false,
            theme: resolvedTheme.config,
          });
        } else {
          resolvedTheme.revoke();
        }
      } catch (error) {
        if (isMounted) {
          setState({
            error: error instanceof Error ? error.message : String(error),
            isLoading: false,
            theme: defaultTimelineTheme,
          });
        }
      }
    }

    void loadTheme();

    return () => {
      isMounted = false;
      revokeThemeUrls?.();
    };
  }, [themeRevision]);

  if (previewTheme) {
    return {
      error: null,
      isLoading: false,
      theme: previewTheme as ResolvedTimelineThemeConfig,
    };
  }

  return state;
}
