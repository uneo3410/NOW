import { useEffect, useState } from "react";
import type { LocalDateString } from "../types";
import { resolveDate } from "../services/dayWorkspaceService";

export const CURRENT_TIMELINE_DATE_CHANGE_EVENT = "now:date-change";

type TimelineDateChangeDetail = {
  date: LocalDateString;
};

export function useCurrentDay() {
  const [date, setDate] = useState<LocalDateString>(() => getDateFromLocation());

  useEffect(() => {
    function handleLocationChange() {
      setDate(getDateFromLocation());
    }

    function handleDateChange(event: Event) {
      const detail = (event as CustomEvent<TimelineDateChangeDetail>).detail;
      setDate(resolveDate(detail?.date));
    }

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener(CURRENT_TIMELINE_DATE_CHANGE_EVENT, handleDateChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener(CURRENT_TIMELINE_DATE_CHANGE_EVENT, handleDateChange);
    };
  }, []);

  return date;
}

export function setCurrentTimelineDate(dateInput: LocalDateString): LocalDateString {
  const date = resolveDate(dateInput);
  const url = new URL(window.location.href);
  url.pathname = "/timeline";
  url.searchParams.set("date", date);
  window.history.pushState({}, "", url);
  window.dispatchEvent(
    new CustomEvent<TimelineDateChangeDetail>(CURRENT_TIMELINE_DATE_CHANGE_EVENT, {
      detail: { date },
    }),
  );
  return date;
}

function getDateFromLocation(): LocalDateString {
  const params = new URLSearchParams(window.location.search);
  return resolveDate(params.get("date"));
}
