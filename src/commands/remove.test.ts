import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { removeEnv } from './remove';
import { initConfig } from '../config/envoyConfig';
import { initStore, upsertEntry, loadStore } from '../storage/fileStorage';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-remove-test-'));
}

describe('removeEnv', () => {
  it('removes an existing environment entry', async () => {
    const dir = makeTempDir();
    await initConfig({ project: 'my-app', configDir: dir });
    await initStore(dir);
    await upsertEntry(
      { project: 'my-app', environment: 'staging', encryptedData: 'abc123', updatedAt: new Date().toISOString() },
      dir
    );

    await removeEnv({ environment: 'staging', configDir: dir, storeDir: dir });

    const store = await loadStore(dir);
    const entry = store!.entries.find(
      (e) => e.environment === 'staging' && e.project === 'my-app'
    );
    expect(entry).toBeUndefined();
  });

  it('throws if environment does not exist', async () => {
    const dir = makeTempDir();
    await initConfig({ project: 'my-app', configDir: dir });
    await initStore(dir);

    await expect(
      removeEnv({ environment: 'nonexistent', configDir: dir, storeDir: dir })
    ).rejects.toThrow('No entry found for environment');
  });

  it('throws if config is missing', async () => {
    const dir = makeTempDir();
    await expect(
      removeEnv({ environment: 'staging', configDir: dir, storeDir: dir })
    ).rejects.toThrow('No envoy config found');
  });

  it('throws if store is missing', async () => {
    const dir = makeTempDir();
    await initConfig({ project: 'my-app', configDir: dir });
    await expect(
      removeEnv({ environment: 'staging', configDir: dir, storeDir: dir })
    ).rejects.toThrow('No envoy store found');
  });
});
