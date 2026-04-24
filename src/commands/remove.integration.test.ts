import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initConfig } from '../config/envoyConfig';
import { initStore, loadStore } from '../storage/fileStorage';
import { pushEnv } from './push';
import { removeEnv } from './remove';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-remove-integration-'));
}

describe('remove integration', () => {
  it('push then remove leaves no entry in store', async () => {
    const dir = makeTempDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'API_KEY=secret\nDEBUG=true\n');

    await initConfig({ project: 'integration-app', configDir: dir });
    await initStore(dir);

    await pushEnv({
      environment: 'dev',
      envFilePath: envFile,
      passphrase: 'test-pass',
      configDir: dir,
      storeDir: dir,
    });

    let store = await loadStore(dir);
    expect(store!.entries).toHaveLength(1);

    await removeEnv({ environment: 'dev', configDir: dir, storeDir: dir });

    store = await loadStore(dir);
    expect(store!.entries).toHaveLength(0);
  });

  it('push two envs, remove one, other remains', async () => {
    const dir = makeTempDir();
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar\n');

    await initConfig({ project: 'multi-env-app', configDir: dir });
    await initStore(dir);

    await pushEnv({ environment: 'staging', envFilePath: envFile, passphrase: 'pass1', configDir: dir, storeDir: dir });
    await pushEnv({ environment: 'production', envFilePath: envFile, passphrase: 'pass2', configDir: dir, storeDir: dir });

    await removeEnv({ environment: 'staging', configDir: dir, storeDir: dir });

    const store = await loadStore(dir);
    expect(store!.entries).toHaveLength(1);
    expect(store!.entries[0].environment).toBe('production');
  });
});
