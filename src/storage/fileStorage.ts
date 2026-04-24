import fs from 'fs';
import path from 'path';
import { encryptEnvFile, decryptEnvFile } from '../crypto/encryption';

export interface StoredEnvFile {
  name: string;
  environment: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvStore {
  version: number;
  files: StoredEnvFile[];
}

const STORE_VERSION = 1;

export function getStorePath(baseDir: string): string {
  return path.join(baseDir, '.envoy', 'store.json');
}

export function loadStore(baseDir: string): EnvStore {
  const storePath = getStorePath(baseDir);
  if (!fs.existsSync(storePath)) {
    return { version: STORE_VERSION, files: [] };
  }
  const raw = fs.readFileSync(storePath, 'utf-8');
  return JSON.parse(raw) as EnvStore;
}

export function saveStore(baseDir: string, store: EnvStore): void {
  const storePath = getStorePath(baseDir);
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
}

export async function pushEnvFile(
  baseDir: string,
  filePath: string,
  environment: string,
  passphrase: string
): Promise<void> {
  const store = loadStore(baseDir);
  const { encryptedData, iv } = await encryptEnvFile(filePath, passphrase);
  const name = path.basename(filePath);
  const now = new Date().toISOString();
  const existing = store.files.findIndex(
    (f) => f.name === name && f.environment === environment
  );
  const entry: StoredEnvFile = { name, environment, encryptedData, iv, createdAt: now, updatedAt: now };
  if (existing >= 0) {
    entry.createdAt = store.files[existing].createdAt;
    store.files[existing] = entry;
  } else {
    store.files.push(entry);
  }
  saveStore(baseDir, store);
}

export async function pullEnvFile(
  baseDir: string,
  name: string,
  environment: string,
  destPath: string,
  passphrase: string
): Promise<void> {
  const store = loadStore(baseDir);
  const entry = store.files.find((f) => f.name === name && f.environment === environment);
  if (!entry) {
    throw new Error(`No stored file found for '${name}' in environment '${environment}'`);
  }
  await decryptEnvFile(entry.encryptedData, entry.iv, destPath, passphrase);
}
