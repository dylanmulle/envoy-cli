import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { registerEnvCommand } from './env';
import * as envoyConfig from '../config/envoyConfig';
import * as fileStorage from '../storage/fileStorage';
import * as encryption from '../crypto/encryption';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-env-test-'));
}

describe('env command', () => {
  let tmpDir: string;
  let program: Command;

  beforeEach(() => {
    tmpDir = makeTempDir();
    program = new Command();
    program.exitOverride();
    registerEnvCommand(program);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should print decrypted env variables to stdout', async () => {
    vi.spyOn(envoyConfig, 'loadConfig').mockResolvedValue({
      project: 'my-app',
      storePath: path.join(tmpDir, 'store.json'),
      encryptionKey: 'secret',
    } as any);

    vi.spyOn(fileStorage, 'loadStore').mockResolvedValue({
      entries: [
        { environment: 'development', project: 'my-app', encryptedData: 'enc', updatedAt: '' },
      ],
    } as any);

    vi.spyOn(encryption, 'decryptEnvFile').mockResolvedValue('FOO=bar\nBAZ=qux');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envoy', 'env', 'development']);

    expect(consoleSpy).toHaveBeenCalledWith('FOO=bar\nBAZ=qux');
  });

  it('should write env variables to a file when --output is given', async () => {
    vi.spyOn(envoyConfig, 'loadConfig').mockResolvedValue({
      project: 'my-app',
      storePath: path.join(tmpDir, 'store.json'),
      encryptionKey: 'secret',
    } as any);

    vi.spyOn(fileStorage, 'loadStore').mockResolvedValue({
      entries: [
        { environment: 'staging', project: 'my-app', encryptedData: 'enc', updatedAt: '' },
      ],
    } as any);

    vi.spyOn(encryption, 'decryptEnvFile').mockResolvedValue('KEY=value');

    const outFile = path.join(tmpDir, '.env.staging');
    await program.parseAsync(['node', 'envoy', 'env', 'staging', '--output', outFile]);

    const written = fs.readFileSync(outFile, 'utf-8');
    expect(written).toBe('KEY=value');
  });

  it('should prefix lines with export when --export flag is set', async () => {
    vi.spyOn(envoyConfig, 'loadConfig').mockResolvedValue({
      project: 'my-app',
      storePath: path.join(tmpDir, 'store.json'),
      encryptionKey: 'secret',
    } as any);

    vi.spyOn(fileStorage, 'loadStore').mockResolvedValue({
      entries: [
        { environment: 'production', project: 'my-app', encryptedData: 'enc', updatedAt: '' },
      ],
    } as any);

    vi.spyOn(encryption, 'decryptEnvFile').mockResolvedValue('A=1\nB=2');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envoy', 'env', 'production', '--export']);

    expect(consoleSpy).toHaveBeenCalledWith('export A=1\nexport B=2');
  });
});
