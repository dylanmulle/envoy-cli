#!/usr/bin/env node
import { Command } from 'commander';
import { registerEnvCommand } from './commands/env';

// Dynamically import existing command registrations
import { program as initProgram } from './commands/init';
import { program as pushProgram } from './commands/push';
import { program as pullProgram } from './commands/pull';
import { program as listProgram } from './commands/list';
import { program as removeProgram } from './commands/remove';

const program = new Command();

program
  .name('envoy')
  .description('A CLI tool for managing and syncing .env files across environments')
  .version('0.1.0');

// Register sub-commands
program.addCommand(initProgram);
program.addCommand(pushProgram);
program.addCommand(pullProgram);
program.addCommand(listProgram);
program.addCommand(removeProgram);

// Register env command
registerEnvCommand(program);

program.parse(process.argv);
