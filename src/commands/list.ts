import { loadStore } from '../storage/fileStorage';
import { loadConfig } from '../config/envoyConfig';

export interface ListOptions {
  environment?: string;
  json?: boolean;
}

export async function listCommand(options: ListOptions = {}): Promise<void> {
  const config = await loadConfig();
  if (!config) {
    console.error('No envoy config found. Run `envoy init` first.');
    process.exit(1);
  }

  const store = await loadStore();
  const entries = store.entries ?? [];

  const filtered = options.environment
    ? entries.filter((e) => e.environment === options.environment)
    : entries;

  if (filtered.length === 0) {
    console.log('No entries found.');
    return;
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        filtered.map((e) => ({
          environment: e.environment,
          updatedAt: e.updatedAt,
          keyCount: e.keyCount ?? 'unknown',
        })),
        null,
        2
      )
    );
    return;
  }

  const grouped: Record<string, typeof filtered> = {};
  for (const entry of filtered) {
    if (!grouped[entry.environment]) grouped[entry.environment] = [];
    grouped[entry.environment].push(entry);
  }

  for (const [env, envEntries] of Object.entries(grouped)) {
    console.log(`\nEnvironment: ${env}`);
    console.log('─'.repeat(40));
    for (const entry of envEntries) {
      const date = new Date(entry.updatedAt).toLocaleString();
      const keys = entry.keyCount != null ? `${entry.keyCount} keys` : 'unknown keys';
      console.log(`  Updated: ${date}  |  ${keys}`);
    }
  }
  console.log();
}
