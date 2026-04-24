import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listCommand } from './list';
import * as fileStorage from '../storage/fileStorage';
import * as envoyConfig from '../config/envoyConfig';

const mockConfig = { project: 'test-project', defaultEnvironment: 'development' };

const mockStore = {
  entries: [
    { environment: 'development', updatedAt: '2024-01-01T00:00:00.000Z', keyCount: 5 },
    { environment: 'production', updatedAt: '2024-01-02T00:00:00.000Z', keyCount: 8 },
    { environment: 'development', updatedAt: '2024-01-03T00:00:00.000Z', keyCount: 6 },
  ],
};

describe('listCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    vi.spyOn(envoyConfig, 'loadConfig').mockResolvedValue(mockConfig as never);
    vi.spyOn(fileStorage, 'loadStore').mockResolvedValue(mockStore as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists all entries when no environment filter is provided', async () => {
    await listCommand();
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('development');
    expect(output).toContain('production');
  });

  it('filters entries by environment', async () => {
    await listCommand({ environment: 'production' });
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('production');
    expect(output).not.toContain('development');
  });

  it('outputs valid JSON when --json flag is set', async () => {
    await listCommand({ json: true });
    const rawOutput = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(rawOutput);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toHaveProperty('environment');
    expect(parsed[0]).toHaveProperty('updatedAt');
    expect(parsed[0]).toHaveProperty('keyCount');
  });

  it('prints no entries message when store is empty', async () => {
    vi.spyOn(fileStorage, 'loadStore').mockResolvedValue({ entries: [] } as never);
    await listCommand();
    expect(consoleSpy).toHaveBeenCalledWith('No entries found.');
  });

  it('exits with error when config is missing', async () => {
    vi.spyOn(envoyConfig, 'loadConfig').mockResolvedValue(null as never);
    await listCommand();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
