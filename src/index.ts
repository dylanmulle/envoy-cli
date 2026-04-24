#!/usr/bin/env node

/**
 * envoy-cli — Main entry point
 * Registers all CLI commands and parses arguments via yargs.
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { registerInitCommand } from './commands/init';
import { registerPushCommand } from './commands/push';
import { registerPullCommand } from './commands/pull';
import { registerListCommand } from './commands/list';

async function main(): Promise<void> {
  const cli = yargs(hideBin(process.argv))
    .scriptName('envoy')
    .usage('$0 <command> [options]')
    .strict()
    .help('help')
    .alias('h', 'help')
    .version()
    .alias('v', 'version')
    .wrap(Math.min(120, process.stdout.columns ?? 80))
    .epilogue(
      'For more information, visit https://github.com/your-org/envoy-cli'
    );

  // Register each sub-command
  registerInitCommand(cli);
  registerPushCommand(cli);
  registerPullCommand(cli);
  registerListCommand(cli);

  // Show help when no command is provided
  cli.demandCommand(1, 'You must specify a command. Run --help for usage.');

  await cli.parseAsync();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nError: ${message}`);
  process.exit(1);
});
