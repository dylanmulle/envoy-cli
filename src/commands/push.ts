import path from 'path';
import { loadConfig } from '../config/envoyConfig';
import { pushEnvFile } from '../storage/fileStorage';

export interface PushOptions {
  environment: string;
  file?: string;
  passphrase: string;
  cwd?: string;
}

export async function pushCommand(options: PushOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = loadConfig(cwd);

  const environment = options.environment;
  if (!config.environments.includes(environment)) {
    throw new Error(
      `Environment '${environment}' is not defined in envoy config. ` +
      `Available: ${config.environments.join(', ')}`
    );
  }

  const fileName = options.file ?? config.defaultFile ?? '.env';
  const filePath = path.isAbsolute(fileName) ? fileName : path.join(cwd, fileName);

  console.log(`Pushing '${fileName}' to environment '${environment}'...`);
  await pushEnvFile(cwd, filePath, environment, options.passphrase);
  console.log(`✓ Successfully pushed '${fileName}' to '${environment}'.`);
}
