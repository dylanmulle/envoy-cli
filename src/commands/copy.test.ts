import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fileStorage from '../storage/fileStorage';
import * as envoyConfig from '../config/envoyConfig';
import { Command } from 'commander';
import { registerCopyCommand } from './copy';

vi.mock('../storage/fileStorage');
vi.mock('../config/envoyConfig');

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerCopyCommand(program);
  return program;
}

describe('copy command', () => {
  beforeEach(() => {
    vi.mocked(envoyConfig.loadConfig).mockReturnValue({ projectName: 'test', version: 1 } as any);
    vi.mocked(fileStorage.loadStore).mockReturnValue({
      environments: {
        staging: { API_KEY: 'enc_abc', DB_URL: 'enc_def' },
        production: {},
      },
    } as any);
    vi.mocked(fileStorage.upsertEntry).mockImplementation(() => {});
    vi.mocked(fileStorage.saveStore).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('copies all entries from source to empty target', async () => {
    const program = makeProgram();
    await program.parseAsync(['copy', 'staging', 'production'], { from: 'user' });
    expect(fileStorage.upsertEntry).toHaveBeenCalledTimes(2);
    expect(fileStorage.upsertEntry).toHaveBeenCalledWith('production', 'API_KEY', 'enc_abc');
    expect(fileStorage.upsertEntry).toHaveBeenCalledWith('production', 'DB_URL', 'enc_def');
  });

  it('skips existing keys without --overwrite', async () => {
    vi.mocked(fileStorage.loadStore).mockReturnValue({
      environments: {
        staging: { API_KEY: 'enc_abc', DB_URL: 'enc_def' },
        production: { API_KEY: 'enc_existing' },
      },
    } as any);
    const program = makeProgram();
    await program.parseAsync(['copy', 'staging', 'production'], { from: 'user' });
    expect(fileStorage.upsertEntry).toHaveBeenCalledTimes(1);
    expect(fileStorage.upsertEntry).toHaveBeenCalledWith('production', 'DB_URL', 'enc_def');
  });

  it('overwrites existing keys with --overwrite flag', async () => {
    vi.mocked(fileStorage.loadStore).mockReturnValue({
      environments: {
        staging: { API_KEY: 'enc_abc' },
        production: { API_KEY: 'enc_existing' },
      },
    } as any);
    const program = makeProgram();
    await program.parseAsync(['copy', 'staging', 'production', '--overwrite'], { from: 'user' });
    expect(fileStorage.upsertEntry).toHaveBeenCalledWith('production', 'API_KEY', 'enc_abc');
  });

  it('exits with error when source environment has no entries', async () => {
    vi.mocked(fileStorage.loadStore).mockReturnValue({
      environments: { staging: {} },
    } as any);
    const program = makeProgram();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['copy', 'staging', 'production'], { from: 'user' })).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
