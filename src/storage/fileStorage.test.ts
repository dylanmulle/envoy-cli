import fs from 'fs';
import os from 'os';
import path from 'path';
import { getStorePath, loadStore, saveStore, pushEnvFile, pullEnvFile, EnvStore } from './fileStorage';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-storage-test-'));
}

describe('fileStorage', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getStorePath returns correct path', () => {
    expect(getStorePath(tmpDir)).toBe(path.join(tmpDir, '.envoy', 'store.json'));
  });

  test('loadStore returns empty store when no file exists', () => {
    const store = loadStore(tmpDir);
    expect(store.version).toBe(1);
    expect(store.files).toEqual([]);
  });

  test('saveStore and loadStore round-trip', () => {
    const store: EnvStore = { version: 1, files: [] };
    saveStore(tmpDir, store);
    const loaded = loadStore(tmpDir);
    expect(loaded).toEqual(store);
  });

  test('pushEnvFile stores encrypted entry', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=value\nSECRET=abc123');
    await pushEnvFile(tmpDir, envFile, 'production', 'test-passphrase');
    const store = loadStore(tmpDir);
    expect(store.files).toHaveLength(1);
    expect(store.files[0].name).toBe('.env');
    expect(store.files[0].environment).toBe('production');
    expect(store.files[0].encryptedData).toBeTruthy();
  });

  test('pushEnvFile updates existing entry', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=value1');
    await pushEnvFile(tmpDir, envFile, 'staging', 'pass');
    fs.writeFileSync(envFile, 'KEY=value2');
    await pushEnvFile(tmpDir, envFile, 'staging', 'pass');
    const store = loadStore(tmpDir);
    expect(store.files).toHaveLength(1);
  });

  test('pullEnvFile restores original content', async () => {
    const envFile = path.join(tmpDir, '.env');
    const original = 'API_KEY=secret\nDB_URL=postgres://localhost/db';
    fs.writeFileSync(envFile, original);
    await pushEnvFile(tmpDir, envFile, 'development', 'my-passphrase');
    const destFile = path.join(tmpDir, '.env.pulled');
    await pullEnvFile(tmpDir, '.env', 'development', destFile, 'my-passphrase');
    const restored = fs.readFileSync(destFile, 'utf-8');
    expect(restored).toBe(original);
  });

  test('pullEnvFile throws when entry not found', async () => {
    await expect(
      pullEnvFile(tmpDir, '.env', 'production', path.join(tmpDir, 'out'), 'pass')
    ).rejects.toThrow("No stored file found for '.env' in environment 'production'");
  });
});
