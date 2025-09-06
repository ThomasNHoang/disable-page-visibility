import {
  BLOCKED_EVENT_TYPES,
  BlockedEventType,
  DEDUPLICATION_TIME_WINDOW_MS,
  MAX_DAILY_ACTIVITY_RECORDS,
  QUEUE_PROCESSING_INTERVAL_MS,
} from "./lib/constants";
import {
  getToday,
  QueuedEvent,
  StorageBlockedEventType,
} from "./lib/analytics";
import { metrics } from "./lib/storage";

// Server-side queue for batching analytics

const eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || eventQueue.length === 0) return;

  isProcessingQueue = true;
  const eventsToProcess = eventQueue.splice(0, eventQueue.length);

  try {
    const validTypes = Object.values(BLOCKED_EVENT_TYPES);

    const deduplicatedEvents: { [key: string]: QueuedEvent } = {};

    for (const event of eventsToProcess) {
      if (event.url && event.type && validTypes.includes(event.type)) {
        const normalizedType =
          event.type === BLOCKED_EVENT_TYPES.WEBKIT_VISIBILITY_CHANGE
            ? BLOCKED_EVENT_TYPES.VISIBILITY_CHANGE
            : event.type;

        if (normalizedType === BLOCKED_EVENT_TYPES.VISIBILITY_CHANGE) {
          const timeWindow =
            Math.floor(event.timestamp / DEDUPLICATION_TIME_WINDOW_MS) *
            DEDUPLICATION_TIME_WINDOW_MS;
          const dedupeKey = `${event.url}:${normalizedType}:${timeWindow}`;

          if (!deduplicatedEvents[dedupeKey]) {
            deduplicatedEvents[dedupeKey] = { ...event, type: normalizedType };
          }
        } else {
          const uniqueKey = `${event.url}:${normalizedType}:${event.timestamp}`;
          deduplicatedEvents[uniqueKey] = { ...event, type: normalizedType };
        }
      }
    }

    // Process deduplicated events
    for (const event of Object.values(deduplicatedEvents)) {
      await logBlockedEvent({
        type: event.type as StorageBlockedEventType,
        url: event.url,
      });
    }
  } catch (error) {
    console.error("Error processing event queue:", error);
  } finally {
    isProcessingQueue = false;
  }
}

// Process queue every 5 seconds
setInterval(processQueue, QUEUE_PROCESSING_INTERVAL_MS);

export function queueEvent(event: { type: BlockedEventType; url: string }) {
  eventQueue.push({
    ...event,
    timestamp: Date.now(),
  });
}

export async function logBlockedEvent({
  type,
  url,
}: {
  type?: StorageBlockedEventType;
  url: string;
}) {
  if (!type) return;
  const today = getToday();
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return;
  }

  const data = await metrics.get();
  data.totalEventsBlocked++;
  data.eventsByType[type]++;

  if (!data.eventsByHostname[hostname]) {
    data.eventsByHostname[hostname] = {
      total: 0,
      visibilitychange: 0,
      blur: 0,
      focus: 0,
    };
  }

  data.eventsByHostname[hostname].total++;
  data.eventsByHostname[hostname][type]++;
  data.eventsByHostname[hostname].lastBlockedTime = new Date().toISOString();
  data.dailyActivity[today] = (data.dailyActivity[today] || 0) + 1;

  const activityDates = Object.keys(data.dailyActivity).sort();
  if (activityDates.length > MAX_DAILY_ACTIVITY_RECORDS) {
    const dateToDelete = activityDates[0];
    delete data.dailyActivity[dateToDelete];
  }

  await metrics.set(data);
}
