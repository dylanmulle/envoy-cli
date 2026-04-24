import * as path from 'path';
import * as fs from 'fs';
import { loadConfig } from '../config/envoyConfig';
import { loadStore, saveStore } from '../storage/fileStorage';

export interface RemoveOptions {
  environment: string;
  configDir?: string;
  storeDir?: string;
}

export async function removeEnv(options: RemoveOptions): Promise<void> {
  const { environment, configDir, storeDir } = options;

  const config = await loadConfig(configDir);
  if (!config) {
    throw new Error('No envoy config found. Run `envoy init` first.');
  }

  const store = await loadStore(storeDir);
  if (!store) {
    throw new Error('No envoy store found. Run `envoy init` first.');
  }

  const entryIndex = store.entries.findIndex(
    (e) => e.environment === environment && e.project === config.project
  );

  if (entryIndex === -1) {
    throw new Error(
      `No entry found for environment "${environment}" in project "${config.project}".`
    );
  }

  store.entries.splice(entryIndex, 1);
  await saveStore(store, storeDir);

  console.log(
    `Removed environment "${environment}" from project "${config.project}".`
  );
}
