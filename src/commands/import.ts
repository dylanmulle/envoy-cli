import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from '../config/envoyConfig';
import { initStore, upsertEntry, loadStore } from '../storage/fileStorage';
import { encryptEnvFile } from '../crypto/encryption';

export function registerImportCommand(program: Command): void {
  program
    .command('import <file>')
    .description('Import an existing .env file into the envoy store')
    .option('-e, --env <environment>', 'Target environment name', 'development')
    .option('-p, --passphrase <passphrase>', 'Passphrase for encryption')
    .option('--overwrite', 'Overwrite existing entry if it exists', false)
    .action(async (file: string, options: { env: string; passphrase?: string; overwrite: boolean }) => {
      const filePath = path.resolve(process.cwd(), file);

      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }

      const config = loadConfig();
      if (!config) {
        console.error('Error: No envoy config found. Run `envoy init` first.');
        process.exit(1);
      }

      const passphrase = options.passphrase ?? config.defaultPassphrase;
      if (!passphrase) {
        console.error('Error: Passphrase is required. Use --passphrase or set defaultPassphrase in config.');
        process.exit(1);
      }

      initStore();
      const store = loadStore();
      const existing = store.entries?.find((e: { environment: string }) => e.environment === options.env);

      if (existing && !options.overwrite) {
        console.error(`Error: Entry for environment "${options.env}" already exists. Use --overwrite to replace it.`);
        process.exit(1);
      }

      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const encrypted = encryptEnvFile(rawContent, passphrase);

      upsertEntry({
        environment: options.env,
        encryptedData: encrypted,
        updatedAt: new Date().toISOString(),
        sourceFile: path.basename(filePath),
      });

      console.log(`✓ Imported "${file}" into environment "${options.env}"`);
    });
}
