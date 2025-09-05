import ChromeStorage from "./chromeStorage";

type BlockedEventType = "visibilitychange" | "blur" | "focus";
type BlockedEventTypeCount = { [K in BlockedEventType]: number };

interface Metrics {
  totalEventsBlocked: number;
  eventsByType: BlockedEventTypeCount;
  eventsByHostname: {
    [key: string]: {
      total: number;
      lastBlockedTime?: string;
    } & BlockedEventTypeCount;
  };
  dailyActivity: { [key: string]: number };
}

// Server-side queue for batching analytics
interface QueuedEvent {
  type: string;
  url: string;
  timestamp: number;
}

const metrics = new ChromeStorage<Metrics>(
  "metrics",
  {
    totalEventsBlocked: 0,
    eventsByType: {
      visibilitychange: 0,
      blur: 0,
      focus: 0,
    },
    eventsByHostname: {},
    dailyActivity: {},
  },
  "local"
);

const eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;

function getToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function processQueue() {
  if (isProcessingQueue || eventQueue.length === 0) return;

  isProcessingQueue = true;
  const eventsToProcess = eventQueue.splice(0, eventQueue.length);

  try {
    const validTypes = [
      "visibilitychange",
      "webkitvisibilitychange",
      "blur",
      "focus",
    ];

    const deduplicatedEvents: { [key: string]: QueuedEvent } = {};

    for (const event of eventsToProcess) {
      if (event.url && event.type && validTypes.includes(event.type)) {
        const normalizedType =
          event.type === "webkitvisibilitychange"
            ? "visibilitychange"
            : event.type;

        if (normalizedType === "visibilitychange") {
          const timeWindow = Math.floor(event.timestamp / 100) * 100;
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
        type: event.type as "visibilitychange" | "blur" | "focus",
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
setInterval(processQueue, 5000);

export function queueEvent(event: { type: string; url: string }) {
  eventQueue.push({
    ...event,
    timestamp: Date.now(),
  });
}

export async function logBlockedEvent({
  type,
  url,
}: {
  type?: BlockedEventType;
  url: string;
}) {
  if (!type) return;
  const today = getToday();
  const hostname = new URL(url).hostname;

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
  if (activityDates.length > 30) {
    const dateToDelete = activityDates[0];
    delete data.dailyActivity[dateToDelete];
  }

  await metrics.set(data);
}
