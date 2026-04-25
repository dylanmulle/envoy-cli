import { Command } from 'commander';
import { loadConfig } from '../config/envoyConfig';
import { loadStore, saveStore } from '../storage/fileStorage';
import { encryptEnvFile, decryptEnvFile } from '../crypto/encryption';
import * as fs from 'fs';

export function registerRotateCommand(program: Command): void {
  program
    .command('rotate')
    .description('Re-encrypt all stored .env entries with a new passphrase')
    .requiredOption('-o, --old-passphrase <passphrase>', 'Current passphrase used for encryption')
    .requiredOption('-n, --new-passphrase <passphrase>', 'New passphrase to re-encrypt with')
    .option('-e, --env <environment>', 'Only rotate a specific environment', '')
    .action(async (options) => {
      try {
        const config = loadConfig();
        const store = loadStore(config.storePath);

        if (store.entries.length === 0) {
          console.log('No entries found in store.');
          return;
        }

        const targets = options.env
          ? store.entries.filter((e: any) => e.environment === options.env)
          : store.entries;

        if (targets.length === 0) {
          console.error(`No entries found for environment: ${options.env}`);
          process.exit(1);
        }

        let rotated = 0;
        for (const entry of targets) {
          try {
            const decrypted = decryptEnvFile(entry.encryptedData, options.oldPassphrase);
            entry.encryptedData = encryptEnvFile(decrypted, options.newPassphrase);
            entry.updatedAt = new Date().toISOString();
            rotated++;
          } catch {
            console.error(`Failed to rotate entry for environment "${entry.environment}". Wrong old passphrase?`);
            process.exit(1);
          }
        }

        saveStore(config.storePath, store);
        console.log(`Successfully rotated passphrase for ${rotated} entry/entries.`);
      } catch (err: any) {
        console.error('Rotate failed:', err.message);
        process.exit(1);
      }
    });
}
