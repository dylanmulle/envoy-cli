import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getStorePath,
  initStore,
  loadStore,
  saveStore,
  upsertEntry,
  getEntry,
  EnvStore,
} from './fileStorage';

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

  describe('getStorePath', () => {
    it('returns path to .envoy.store in given directory', () => {
      expect(getStorePath(tmpDir)).toBe(path.join(tmpDir, '.envoy.store'));
    });
  });

  describe('initStore', () => {
    it('creates .envoy.store file with default structure', () => {
      const store = initStore(tmpDir);
      expect(store.version).toBe(1);
      expect(store.entries).toEqual({});
      expect(fs.existsSync(getStorePath(tmpDir))).toBe(true);
    });
  });

  describe('loadStore', () => {
    it('loads an existing store', () => {
      initStore(tmpDir);
      const store = loadStore(tmpDir);
      expect(store.version).toBe(1);
    });

    it('throws if store does not exist', () => {
      expect(() => loadStore(tmpDir)).toThrow("Run 'envoy init' first.");
    });
  });

  describe('saveStore', () => {
    it('persists store changes to disk', () => {
      const store = initStore(tmpDir);
      store.version = 2;
      saveStore(tmpDir, store);
      const reloaded = loadStore(tmpDir);
      expect(reloaded.version).toBe(2);
    });

    it('updates updatedAt timestamp on save', () => {
      const store = initStore(tmpDir);
      const before = store.updatedAt;
      saveStore(tmpDir, store);
      const reloaded = loadStore(tmpDir);
      expect(reloaded.updatedAt).not.toBe(before);
    });
  });

  describe('upsertEntry and getEntry', () => {
    it('inserts a new entry and retrieves it', () => {
      const store = initStore(tmpDir);
      const entry = {
        ciphertext: 'abc123',
        iv: 'iv-value',
        salt: 'salt-value',
        pushedAt: new Date().toISOString(),
        pushedBy: 'alice',
      };
      upsertEntry(store, 'production', entry);
      const retrieved = getEntry(store, 'production');
      expect(retrieved?.ciphertext).toBe('abc123');
      expect(retrieved?.environment).toBe('production');
    });

    it('returns undefined for missing environment', () => {
      const store = initStore(tmpDir);
      expect(getEntry(store, 'staging')).toBeUndefined();
    });
  });
});
