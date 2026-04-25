import { Command } from 'commander';
import { loadConfig } from '../config/envoyConfig';
import { loadStore } from '../storage/fileStorage';
import { decryptEnvFile } from '../crypto/encryption';
import * as fs from 'fs';
import * as path from 'path';

export function registerEnvCommand(program: Command): void {
  program
    .command('env')
    .description('Display or export environment variables for a given environment')
    .argument('<environment>', 'Target environment (e.g. development, staging, production)')
    .option('-o, --output <file>', 'Write variables to a file instead of stdout')
    .option('--export', 'Prefix each line with export keyword')
    .action(async (environment: string, options: { output?: string; export?: boolean }) => {
      try {
        const config = await loadConfig();
        if (!config) {
          console.error('No envoy config found. Run `envoy init` first.');
          process.exit(1);
        }

        const store = await loadStore(config.storePath);
        const entry = store.entries.find(
          (e) => e.environment === environment && e.project === config.project
        );

        if (!entry) {
          console.error(`No env file found for environment: ${environment}`);
          process.exit(1);
        }

        const decrypted = await decryptEnvFile(entry.encryptedData, config.encryptionKey);
        const lines = options.export
          ? decrypted.split('\n').map((l) => (l.trim() && !l.startsWith('#') ? `export ${l}` : l))
          : decrypted.split('\n');

        const output = lines.join('\n');

        if (options.output) {
          const outPath = path.resolve(options.output);
          fs.writeFileSync(outPath, output, 'utf-8');
          console.log(`Environment variables written to ${outPath}`);
        } else {
          console.log(output);
        }
      } catch (err) {
        console.error('Failed to retrieve environment variables:', (err as Error).message);
        process.exit(1);
      }
    });
}
