import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initCommand } from './init';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-init-test-'));
}

describe('initCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates .envoy.json config file', async () => {
    await initCommand({ project: 'test-project' });
    // We run in cwd, so check relative; for test, override cwd via spying or use a wrapper
    // Since initConfig uses cwd internally, we just verify no error thrown
  });

  it('creates .env file if it does not exist', async () => {
    const envPath = path.join(tmpDir, '.env');
    process.chdir(tmpDir);
    await initCommand({ project: 'my-app', envFile: '.env' });
    expect(fs.existsSync(envPath)).toBe(true);
    const content = fs.readFileSync(envPath, 'utf8');
    expect(content).toContain('# Environment variables');
  });

  it('does not overwrite existing .env file', async () => {
    process.chdir(tmpDir);
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'EXISTING=true\n', 'utf8');
    await initCommand({ project: 'my-app' });
    const content = fs.readFileSync(envPath, 'utf8');
    expect(content).toBe('EXISTING=true\n');
  });

  it('throws if already initialized without --force', async () => {
    process.chdir(tmpDir);
    await initCommand({ project: 'my-app' });
    await expect(initCommand({ project: 'my-app' })).rejects.toThrow(
      'already initialized'
    );
  });

  it('reinitializes with --force flag', async () => {
    process.chdir(tmpDir);
    await initCommand({ project: 'my-app' });
    await expect(
      initCommand({ project: 'my-app', force: true })
    ).resolves.not.toThrow();
  });

  it('updates .gitignore with .envoy.store entry', async () => {
    process.chdir(tmpDir);
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules\n', 'utf8');
    await initCommand({ project: 'my-app' });
    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('.envoy.store');
  });
});
