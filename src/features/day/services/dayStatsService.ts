import { listByDate as listCardsByDate } from "../../../db/repositories/cardRepository";
import { listByDate as listTimelineNodesByDate } from "../../../db/repositories/timelineRepository";
import type { LocalDateString } from "../types";

export type DayActivityStats = {
  date: LocalDateString;
  timelineNodeCount: number;
  cardCount: number;
  completedTodoCount: number;
  activityCount: number;
};

export async function getDayActivityStats(
  startDate: LocalDateString,
  endDate: LocalDateString,
): Promise<DayActivityStats[]> {
  const dates = getDateRange(startDate, endDate);

  return Promise.all(
    dates.map(async (date) => {
      const [cards, timelineNodes] = await Promise.all([
        listCardsByDate(date),
        listTimelineNodesByDate(date),
      ]);
      const completedTodoCount = cards.filter((card) => card.type === "todo" && card.completedAt).length;

      return {
        date,
        timelineNodeCount: timelineNodes.length,
        cardCount: cards.length,
        completedTodoCount,
        activityCount: timelineNodes.length,
      };
    }),
  );
}

function getDateRange(startDate: LocalDateString, endDate: LocalDateString): LocalDateString[] {
  const dates: LocalDateString[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}
