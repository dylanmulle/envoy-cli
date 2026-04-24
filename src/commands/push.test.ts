import fs from 'fs';
import os from 'os';
import path from 'path';
import { pushCommand } from './push';
import { pullCommand } from './pull';
import { initConfig } from '../config/envoyConfig';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-cmd-test-'));
}

describe('push and pull commands', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    initConfig(tmpDir, { environments: ['staging', 'production'], defaultFile: '.env' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('pushCommand stores and pullCommand restores env file', async () => {
    const envContent = 'DB_HOST=localhost\nDB_PASS=supersecret';
    fs.writeFileSync(path.join(tmpDir, '.env'), envContent);

    await pushCommand({ environment: 'staging', passphrase: 'secret-pass', cwd: tmpDir });

    const outFile = path.join(tmpDir, '.env.out');
    await pullCommand({
      environment: 'staging',
      output: '.env.out',
      passphrase: 'secret-pass',
      cwd: tmpDir,
    });

    const restored = fs.readFileSync(outFile, 'utf-8');
    expect(restored).toBe(envContent);
  });

  test('pushCommand throws on unknown environment', async () => {
    fs.writeFileSync(path.join(tmpDir, '.env'), 'KEY=val');
    await expect(
      pushCommand({ environment: 'unknown', passphrase: 'pass', cwd: tmpDir })
    ).rejects.toThrow("Environment 'unknown' is not defined");
  });

  test('pullCommand throws on unknown environment', async () => {
    await expect(
      pullCommand({ environment: 'dev', passphrase: 'pass', cwd: tmpDir })
    ).rejects.toThrow("Environment 'dev' is not defined");
  });

  test('pullCommand throws when no pushed file exists', async () => {
    await expect(
      pullCommand({ environment: 'production', passphrase: 'pass', cwd: tmpDir })
    ).rejects.toThrow("No stored file found");
  });
});
