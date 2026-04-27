import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerImportCommand } from './import';
import * as envoyConfig from '../config/envoyConfig';
import * as fileStorage from '../storage/fileStorage';
import * as encryption from '../crypto/encryption';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-import-test-'));
}

describe('import command', () => {
  let tmpDir: string;
  let program: Command;

  beforeEach(() => {
    tmpDir = makeTempDir();
    program = new Command();
    program.exitOverride();
    registerImportCommand(program);

    vi.spyOn(envoyConfig, 'loadConfig').mockReturnValue({
      projectName: 'test-project',
      defaultPassphrase: 'test-secret',
    } as any);

    vi.spyOn(fileStorage, 'initStore').mockImplementation(() => {});
    vi.spyOn(fileStorage, 'loadStore').mockReturnValue({ entries: [] } as any);
    vi.spyOn(fileStorage, 'upsertEntry').mockImplementation(() => {});
    vi.spyOn(encryption, 'encryptEnvFile').mockReturnValue('encrypted-data');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('imports a valid .env file into the store', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=value\nFOO=bar');

    await program.parseAsync(['import', envFile, '--env', 'staging'], { from: 'user' });

    expect(fileStorage.upsertEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'staging',
        encryptedData: 'encrypted-data',
      })
    );
  });

  it('exits with error if file does not exist', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['import', '/nonexistent/.env'], { from: 'user' })
    ).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('exits if entry exists and --overwrite not set', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=value');
    vi.spyOn(fileStorage, 'loadStore').mockReturnValue({
      entries: [{ environment: 'development', encryptedData: 'old' }],
    } as any);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['import', envFile], { from: 'user' })
    ).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('overwrites existing entry when --overwrite flag is set', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=new-value');
    vi.spyOn(fileStorage, 'loadStore').mockReturnValue({
      entries: [{ environment: 'development', encryptedData: 'old' }],
    } as any);

    await program.parseAsync(['import', envFile, '--overwrite'], { from: 'user' });

    expect(fileStorage.upsertEntry).toHaveBeenCalled();
  });
});
