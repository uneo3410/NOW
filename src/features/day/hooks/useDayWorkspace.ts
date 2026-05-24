import { useEffect, useState } from "react";
import type { DayWorkspace, LocalDateString } from "../types";
import { getOrCreateDayWorkspace } from "../services/dayWorkspaceService";

export function useDayWorkspace(date: LocalDateString) {
  const [workspace, setWorkspace] = useState<DayWorkspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      setIsLoading(true);
      setError(null);

      try {
        const nextWorkspace = await getOrCreateDayWorkspace(date);

        if (isMounted) {
          setWorkspace(nextWorkspace);
        }
      } catch (workspaceError) {
        if (isMounted) {
          setError(workspaceError instanceof Error ? workspaceError.message : String(workspaceError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [date]);

  return { error, isLoading, workspace };
}
