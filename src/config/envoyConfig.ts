import fs from 'fs';
import path from 'path';
import os from 'os';

export interface EnvoyConfig {
  version: string;
  defaultEnvironment: string;
  remoteUrl?: string;
  encryptionEnabled: boolean;
  syncedAt?: string;
  team?: string;
}

const CONFIG_FILE_NAME = '.envoyrc.json';
const DEFAULT_CONFIG: EnvoyConfig = {
  version: '1.0.0',
  defaultEnvironment: 'development',
  encryptionEnabled: false,
};

export function getConfigPath(projectRoot?: string): string {
  const base = projectRoot ?? process.cwd();
  return path.join(base, CONFIG_FILE_NAME);
}

export function loadConfig(projectRoot?: string): EnvoyConfig {
  const configPath = getConfigPath(projectRoot);

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<EnvoyConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (err) {
    throw new Error(`Failed to parse ${CONFIG_FILE_NAME}: ${(err as Error).message}`);
  }
}

export function saveConfig(config: EnvoyConfig, projectRoot?: string): void {
  const configPath = getConfigPath(projectRoot);

  try {
    const content = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, content, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to write ${CONFIG_FILE_NAME}: ${(err as Error).message}`);
  }
}

export function initConfig(overrides: Partial<EnvoyConfig> = {}, projectRoot?: string): EnvoyConfig {
  const configPath = getConfigPath(projectRoot);

  if (fs.existsSync(configPath)) {
    throw new Error(`${CONFIG_FILE_NAME} already exists in this directory.`);
  }

  const config: EnvoyConfig = { ...DEFAULT_CONFIG, ...overrides };
  saveConfig(config, projectRoot);
  return config;
}

/**
 * Updates specific fields of an existing config file without overwriting the entire file.
 * Throws if the config file does not exist.
 */
export function updateConfig(updates: Partial<EnvoyConfig>, projectRoot?: string): EnvoyConfig {
  const configPath = getConfigPath(projectRoot);

  if (!fs.existsSync(configPath)) {
    throw new Error(`${CONFIG_FILE_NAME} not found. Run 'envoy init' to create one.`);
  }

  const existing = loadConfig(projectRoot);
  const updated: EnvoyConfig = { ...existing, ...updates };
  saveConfig(updated, projectRoot);
  return updated;
}
