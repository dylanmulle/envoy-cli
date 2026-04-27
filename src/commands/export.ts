import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from '../config/envoyConfig';
import { loadStore } from '../storage/fileStorage';
import { decryptEnvFile } from '../crypto/encryption';

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export a stored environment to a .env file')
    .argument('<environment>', 'Name of the environment to export')
    .option('-o, --output <file>', 'Output file path', '.env')
    .option('-p, --passphrase <passphrase>', 'Passphrase for decryption')
    .action(async (environment: string, options: { output: string; passphrase?: string }) => {
      try {
        const config = loadConfig();
        const passphrase = options.passphrase ?? config.defaultPassphrase;

        if (!passphrase) {
          console.error('Error: passphrase is required. Use --passphrase or set defaultPassphrase in config.');
          process.exit(1);
        }

        const store = loadStore();
        const entry = store.environments[environment];

        if (!entry) {
          console.error(`Error: environment "${environment}" not found.`);
          process.exit(1);
        }

        const decrypted = await decryptEnvFile(entry.encryptedData, passphrase);
        const outputPath = path.resolve(options.output);

        fs.writeFileSync(outputPath, decrypted, 'utf-8');
        console.log(`✔ Exported environment "${environment}" to ${outputPath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
