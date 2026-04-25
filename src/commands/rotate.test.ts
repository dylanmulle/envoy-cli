import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { registerRotateCommand } from './rotate';
import { initStore, saveStore, loadStore } from '../storage/fileStorage';
import { encryptEnvFile } from '../crypto/encryption';
import { initConfig, loadConfig } from '../config/envoyConfig';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-rotate-test-'));
}

describe('rotate command', () => {
  let tmpDir: string;
  let configPath: string;
  let storePath: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    configPath = path.join(tmpDir, 'envoy.json');
    storePath = path.join(tmpDir, 'store.json');
    process.env.ENVOY_CONFIG_PATH = configPath;
    initConfig(configPath, { storePath });
    initStore(storePath);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.ENVOY_CONFIG_PATH;
  });

  it('rotates passphrase for all entries', async () => {
    const store = loadStore(storePath);
    store.entries.push({
      environment: 'production',
      encryptedData: encryptEnvFile('KEY=value', 'old-pass'),
      updatedAt: new Date().toISOString(),
    });
    saveStore(storePath, store);

    const program = new Command();
    registerRotateCommand(program);
    await program.parseAsync(['node', 'envoy', 'rotate', '-o', 'old-pass', '-n', 'new-pass']);

    const updated = loadStore(storePath);
    expect(updated.entries[0].encryptedData).not.toEqual(store.entries[0].encryptedData);
  });

  it('exits with error when old passphrase is wrong', async () => {
    const store = loadStore(storePath);
    store.entries.push({
      environment: 'staging',
      encryptedData: encryptEnvFile('KEY=value', 'correct-pass'),
      updatedAt: new Date().toISOString(),
    });
    saveStore(storePath, store);

    const program = new Command();
    registerRotateCommand(program);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'envoy', 'rotate', '-o', 'wrong-pass', '-n', 'new-pass'])
    ).rejects.toThrow();
    exitSpy.mockRestore();
  });
});
