import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadConfig,
  saveConfig,
  initConfig,
  getConfigPath,
  EnvoyConfig,
} from './envoyConfig';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envoy-test-'));
}

describe('envoyConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getConfigPath', () => {
    it('returns path relative to provided root', () => {
      const result = getConfigPath('/some/project');
      expect(result).toBe('/some/project/.envoyrc.json');
    });
  });

  describe('loadConfig', () => {
    it('returns default config when no file exists', () => {
      const config = loadConfig(tmpDir);
      expect(config.version).toBe('1.0.0');
      expect(config.defaultEnvironment).toBe('development');
      expect(config.encryptionEnabled).toBe(false);
    });

    it('merges file values with defaults', () => {
      const partial = { encryptionEnabled: true, team: 'backend' };
      fs.writeFileSync(path.join(tmpDir, '.envoyrc.json'), JSON.stringify(partial));
      const config = loadConfig(tmpDir);
      expect(config.encryptionEnabled).toBe(true);
      expect(config.team).toBe('backend');
      expect(config.version).toBe('1.0.0');
    });

    it('throws on malformed JSON', () => {
      fs.writeFileSync(path.join(tmpDir, '.envoyrc.json'), 'not-json');
      expect(() => loadConfig(tmpDir)).toThrow('Failed to parse');
    });
  });

  describe('saveConfig', () => {
    it('writes config as formatted JSON', () => {
      const config: EnvoyConfig = {
        version: '1.0.0',
        defaultEnvironment: 'staging',
        encryptionEnabled: true,
      };
      saveConfig(config, tmpDir);
      const raw = fs.readFileSync(path.join(tmpDir, '.envoyrc.json'), 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.defaultEnvironment).toBe('staging');
    });
  });

  describe('initConfig', () => {
    it('creates a new config file with defaults', () => {
      const config = initConfig({}, tmpDir);
      expect(config.version).toBe('1.0.0');
      expect(fs.existsSync(path.join(tmpDir, '.envoyrc.json'))).toBe(true);
    });

    it('applies overrides during init', () => {
      const config = initConfig({ team: 'devops' }, tmpDir);
      expect(config.team).toBe('devops');
    });

    it('throws if config already exists', () => {
      initConfig({}, tmpDir);
      expect(() => initConfig({}, tmpDir)).toThrow('already exists');
    });
  });
});
