import { useEffect, useState } from "react";
import type { LocalDateString } from "../types";
import { resolveDate } from "../services/dayWorkspaceService";

export function useCurrentDay() {
  const [date, setDate] = useState<LocalDateString>(() => getDateFromLocation());

  useEffect(() => {
    function handlePopState() {
      setDate(getDateFromLocation());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return date;
}

function getDateFromLocation(): LocalDateString {
  const params = new URLSearchParams(window.location.search);
  return resolveDate(params.get("date"));
}
