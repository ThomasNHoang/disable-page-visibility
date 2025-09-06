import { BLOCKED_EVENT_TYPES, BlockedEventType } from "./constants";

export type StorageBlockedEventType = "visibilitychange" | "blur" | "focus";
export type StorageBlockedEventTypeCount = {
  [K in StorageBlockedEventType]: number;
};

export type Metrics = {
  totalEventsBlocked: number;
  eventsByType: StorageBlockedEventTypeCount;
  eventsByHostname: {
    [key: string]: {
      total: number;
      lastBlockedTime?: string;
    } & StorageBlockedEventTypeCount;
  };
  dailyActivity: { [key: string]: number };
};

export type QueuedEvent = {
  type: BlockedEventType;
  url: string;
  timestamp: number;
};

export function getToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
