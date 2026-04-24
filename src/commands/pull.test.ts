import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { pullCommand } from './pull';
import { initStore, upsertEntry } from '../storage/fileStorage';
import { initConfig } from '../config/envoyConfig';

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'envoy-pull-test-'));
}

describe('pullCommand', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    await initConfig(tmpDir);
    await initStore(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should pull and decrypt an env file for a given environment', async () => {
    const env = 'staging';
    const passphrase = 'test-secret';
    const envContent = 'API_KEY=abc123\nDB_URL=postgres://localhost/db';

    await upsertEntry(tmpDir, env, envContent, passphrase);

    const outputPath = join(tmpDir, `.env.${env}`);
    await pullCommand({ env, passphrase, output: outputPath, storeDir: tmpDir });

    const { readFile } = await import('fs/promises');
    const written = await readFile(outputPath, 'utf-8');
    expect(written).toBe(envContent);
  });

  it('should throw if environment does not exist in store', async () => {
    await expect(
      pullCommand({ env: 'nonexistent', passphrase: 'pass', output: join(tmpDir, '.env'), storeDir: tmpDir })
    ).rejects.toThrow();
  });

  it('should throw if passphrase is incorrect', async () => {
    const env = 'production';
    await upsertEntry(tmpDir, env, 'SECRET=value', 'correct-pass');

    await expect(
      pullCommand({ env, passphrase: 'wrong-pass', output: join(tmpDir, '.env.prod'), storeDir: tmpDir })
    ).rejects.toThrow();
  });
});
