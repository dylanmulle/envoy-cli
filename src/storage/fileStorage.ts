import * as fs from 'fs';
import * as path from 'path';

export interface EnvStore {
  version: number;
  entries: Record<string, EncryptedEntry>;
  updatedAt: string;
}

export interface EncryptedEntry {
  ciphertext: string;
  iv: string;
  salt: string;
  environment: string;
  pushedAt: string;
  pushedBy: string;
}

export function getStorePath(cwd: string): string {
  return path.join(cwd, '.envoy.store');
}

export function initStore(cwd: string): EnvStore {
  const storePath = getStorePath(cwd);
  const store: EnvStore = {
    version: 1,
    entries: {},
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
  return store;
}

export function loadStore(cwd: string): EnvStore {
  const storePath = getStorePath(cwd);
  if (!fs.existsSync(storePath)) {
    throw new Error(
      `No envoy store found at ${storePath}. Run 'envoy init' first.`
    );
  }
  const raw = fs.readFileSync(storePath, 'utf8');
  return JSON.parse(raw) as EnvStore;
}

export function saveStore(cwd: string, store: EnvStore): void {
  const storePath = getStorePath(cwd);
  store.updatedAt = new Date().toISOString();
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
}

export function upsertEntry(
  store: EnvStore,
  environment: string,
  entry: Omit<EncryptedEntry, 'environment'>
): EnvStore {
  store.entries[environment] = {
    ...entry,
    environment,
  };
  return store;
}

export function getEntry(
  store: EnvStore,
  environment: string
): EncryptedEntry | undefined {
  return store.entries[environment];
}
