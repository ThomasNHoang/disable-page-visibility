import ChromeStorage, { websites } from "./chromeStorage";

const reservedKeys = ["metrics", "version", "websites"] as const;
type ReservedKeys = (typeof reservedKeys)[number];

function isValidHostname(hostname: string) {
  const hostnameRegex = /^(?:(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost|(?:\d{1,3}\.){3}\d{1,3}|\[?[A-Fa-f0-9:]+\]?)$/;
  return hostnameRegex.test(hostname)
};

function isReservedKey(key: string): key is ReservedKeys {
  return (reservedKeys as readonly string[]).includes(key);
}

function isVersionLessThan(a: string | null, b: string): boolean {
  if (!a) return true; // null/undefined version is considered less than any version
  return a.localeCompare(b, undefined, { numeric: true }) < 0;
}

const version = new ChromeStorage<string>("version", "0.0.0", "local");

/**
 * Handles versioned, incremental migrations for extension storage.
 */
export async function migrate() {
  const manifestVersion = chrome.runtime.getManifest().version;
  let dataVersion = await version.get();

  if (dataVersion === manifestVersion) return;

  // Backup old data before migration
  const backup = new ChromeStorage<{ [key: string]: unknown }>(
    `backup_${Date.now()}`,
    {},
    "session"
  );
  const allData = await chrome.storage.local.get();
  await backup.set(allData);

  const migrations = [
    {
      version: "1.2.1",
      migrate: async () => {
        // Migrate legacy hostnames to 'websites' key
        const keys = Object.keys(await chrome.storage.local.get());
        const hostnames = keys.filter(
          (key) => !isReservedKey(key) && isValidHostname(key)
        );
        const currentData = await websites.get();
        const previousData = await chrome.storage.local.get(hostnames);
        const migratedData = { ...currentData, ...previousData };
        await websites.set(migratedData);
        if (hostnames.length > 0) {
          await chrome.storage.local.remove(hostnames);
        }
      },
    },
    // Add future migrations here:
    // {
    //   version: "2.0.0",
    //   migrate: async () => {
    //     // Migration logic for < 2.0.0
    //   }
    // }
  ];

  // Run each migration in sequence if the stored version is less than the migration version
  for (const migration of migrations) {
    if (isVersionLessThan(dataVersion, migration.version)) {
      console.log(`Migrating from ${dataVersion} to ${migration.version}`);
      await migration.migrate();
      dataVersion = migration.version;
    }
  }

  // Set version to manifest version after all migrations
  await version.set(manifestVersion);
}
