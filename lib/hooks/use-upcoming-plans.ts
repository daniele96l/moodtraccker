"use client";

import { useCallback, useEffect, useState } from "react";
import { getUpcomingPlans, subscribeStore } from "@/lib/firestore-store";
import type { DayTodo } from "@/lib/types";

export interface PlanListItem {
  dateKey: string;
  todo: DayTodo;
}

export function useUpcomingPlans(refreshKey = 0) {
  const [items, setItems] = useState<PlanListItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getUpcomingPlans());
  }, []);

  useEffect(() => {
    refresh();
    return subscribeStore(refresh);
  }, [refresh, refreshKey]);

  return { items, refresh };
}
