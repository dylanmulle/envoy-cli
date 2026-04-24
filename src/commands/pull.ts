import path from 'path';
import { loadConfig } from '../config/envoyConfig';
import { pullEnvFile } from '../storage/fileStorage';

export interface PullOptions {
  environment: string;
  file?: string;
  output?: string;
  passphrase: string;
  cwd?: string;
}

export async function pullCommand(options: PullOptions): Promise<void> {
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
  const outputFile = options.output ?? fileName;
  const destPath = path.isAbsolute(outputFile) ? outputFile : path.join(cwd, outputFile);

  console.log(`Pulling '${fileName}' from environment '${environment}'...`);
  await pullEnvFile(cwd, fileName, environment, destPath, options.passphrase);
  console.log(`✓ Successfully pulled '${fileName}' from '${environment}' → '${outputFile}'.`);
}
