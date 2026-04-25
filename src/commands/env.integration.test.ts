import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { registerEnvCommand } from './env';
import { initConfig } from '../config/envoyConfig';
import { initStore, upsertEntry } from '../storage/fileStorage';
import { encryptEnvFile } from '../crypto/encryption';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-env-integration-'));
}

describe('env command integration', () => {
  let tmpDir: string;
  let program: Command;
  const passphrase = 'integration-test-secret';

  beforeEach(async () => {
    tmpDir = makeTempDir();
    program = new Command();
    program.exitOverride();
    registerEnvCommand(program);

    process.env.ENVOY_CONFIG_DIR = tmpDir;
    process.env.ENVOY_STORE_DIR = tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.ENVOY_CONFIG_DIR;
    delete process.env.ENVOY_STORE_DIR;
  });

  it('should decrypt and display real env content end-to-end', async () => {
    const storePath = path.join(tmpDir, 'store.json');
    const configPath = path.join(tmpDir, 'envoy.json');

    await initConfig({ project: 'test-project', storePath, encryptionKey: passphrase }, configPath);
    await initStore(storePath);

    const rawEnv = 'DATABASE_URL=postgres://localhost/db\nSECRET=abc123';
    const encryptedData = await encryptEnvFile(rawEnv, passphrase);

    await upsertEntry(storePath, {
      project: 'test-project',
      environment: 'development',
      encryptedData,
      updatedAt: new Date().toISOString(),
    });

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => logs.push(args.join(' '));

    try {
      await program.parseAsync(['node', 'envoy', 'env', 'development']);
    } finally {
      console.log = originalLog;
    }

    expect(logs.join('\n')).toContain('DATABASE_URL=postgres://localhost/db');
    expect(logs.join('\n')).toContain('SECRET=abc123');
  });
});
