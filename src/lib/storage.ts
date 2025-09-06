import ChromeStorage from "./chromeStorage";
import { RESERVED_STORAGE_KEYS } from "./constants";
import { Metrics } from "./analytics";
import { WebsiteStorage } from "./background";

export const metrics = new ChromeStorage<Metrics>(
  RESERVED_STORAGE_KEYS.METRICS,
  {
    totalEventsBlocked: 0,
    eventsByType: {
      visibilitychange: 0,
      blur: 0,
      focus: 0,
    },
    eventsByHostname: {},
    dailyActivity: {},
  }
);
export const websites = new ChromeStorage<WebsiteStorage>(
  RESERVED_STORAGE_KEYS.WEBSITES,
  {}
);

export const version = new ChromeStorage<string>(
  RESERVED_STORAGE_KEYS.VERSION,
  "0.0.0"
);
