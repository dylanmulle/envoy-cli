import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerExportCommand } from './export';
import * as envoyConfig from '../config/envoyConfig';
import * as fileStorage from '../storage/fileStorage';
import * as encryption from '../crypto/encryption';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-export-test-'));
}

describe('export command', () => {
  let tmpDir: string;
  let program: Command;

  beforeEach(() => {
    tmpDir = makeTempDir();
    program = new Command();
    program.exitOverride();
    registerExportCommand(program);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('exports decrypted env file to the specified output path', async () => {
    const outputFile = path.join(tmpDir, 'exported.env');
    const envContent = 'API_KEY=secret\nDB_URL=postgres://localhost/db\n';

    vi.spyOn(envoyConfig, 'loadConfig').mockReturnValue({
      defaultPassphrase: 'test-pass',
      storePath: tmpDir,
    } as any);

    vi.spyOn(fileStorage, 'loadStore').mockReturnValue({
      environments: {
        production: { encryptedData: 'encrypted-blob', updatedAt: new Date().toISOString() },
      },
    } as any);

    vi.spyOn(encryption, 'decryptEnvFile').mockResolvedValue(envContent);

    await program.parseAsync(['node', 'envoy', 'export', 'production', '--output', outputFile]);

    const written = fs.readFileSync(outputFile, 'utf-8');
    expect(written).toBe(envContent);
  });

  it('exits with error when environment is not found', async () => {
    vi.spyOn(envoyConfig, 'loadConfig').mockReturnValue({
      defaultPassphrase: 'test-pass',
      storePath: tmpDir,
    } as any);

    vi.spyOn(fileStorage, 'loadStore').mockReturnValue({
      environments: {},
    } as any);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('process.exit'); }) as any);

    await expect(
      program.parseAsync(['node', 'envoy', 'export', 'staging'])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when no passphrase is provided', async () => {
    vi.spyOn(envoyConfig, 'loadConfig').mockReturnValue({} as any);
    vi.spyOn(fileStorage, 'loadStore').mockReturnValue({ environments: {} } as any);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('process.exit'); }) as any);

    await expect(
      program.parseAsync(['node', 'envoy', 'export', 'production'])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
