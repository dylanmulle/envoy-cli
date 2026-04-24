import * as path from 'path';
import * as fs from 'fs';
import { initConfig } from '../config/envoyConfig';
import { initStore } from '../storage/fileStorage';

export interface InitOptions {
  project?: string;
  envFile?: string;
  force?: boolean;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const projectName = options.project || path.basename(cwd);
  const envFile = options.envFile || '.env';
  const envFilePath = path.join(cwd, envFile);

  const configPath = path.join(cwd, '.envoy.json');
  if (fs.existsSync(configPath) && !options.force) {
    throw new Error(
      'Envoy is already initialized in this directory. Use --force to reinitialize.'
    );
  }

  const config = await initConfig(cwd, {
    project: projectName,
    envFile,
  });

  await initStore(cwd);

  if (!fs.existsSync(envFilePath)) {
    fs.writeFileSync(envFilePath, '# Environment variables\n', 'utf8');
    console.log(`Created empty ${envFile} file.`);
  }

  const gitignorePath = path.join(cwd, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.envoy.store')) {
      fs.appendFileSync(gitignorePath, '\n# Envoy\n.envoy.store\n');
      console.log('Updated .gitignore to exclude .envoy.store');
    }
  }

  console.log(`Initialized envoy project: ${config.project}`);
  console.log(`Tracking env file: ${envFile}`);
}
