import { Command } from 'commander';
import { loadStore, saveStore, upsertEntry } from '../storage/fileStorage';
import { loadConfig } from '../config/envoyConfig';

export function registerCopyCommand(program: Command): void {
  program
    .command('copy <sourceEnv> <targetEnv>')
    .description('Copy all encrypted entries from one environment to another')
    .option('--overwrite', 'Overwrite existing keys in the target environment', false)
    .action(async (sourceEnv: string, targetEnv: string, options: { overwrite: boolean }) => {
      try {
        const config = loadConfig();
        if (!config) {
          console.error('No envoy config found. Run `envoy init` first.');
          process.exit(1);
        }

        const store = loadStore();
        const sourceEntries = store.environments?.[sourceEnv];

        if (!sourceEntries || Object.keys(sourceEntries).length === 0) {
          console.error(`No entries found for environment: ${sourceEnv}`);
          process.exit(1);
        }

        const targetEntries = store.environments?.[targetEnv] ?? {};
        let copied = 0;
        let skipped = 0;

        for (const [key, value] of Object.entries(sourceEntries)) {
          if (!options.overwrite && key in targetEntries) {
            skipped++;
            continue;
          }
          upsertEntry(targetEnv, key, value as string);
          copied++;
        }

        console.log(`Copied ${copied} key(s) from '${sourceEnv}' to '${targetEnv}'.`);
        if (skipped > 0) {
          console.log(`Skipped ${skipped} existing key(s). Use --overwrite to replace them.`);
        }
      } catch (err: any) {
        console.error('Error copying environment:', err.message);
        process.exit(1);
      }
    });
}
