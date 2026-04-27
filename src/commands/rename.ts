import { Command } from "commander";
import { loadStore, saveStore } from "../storage/fileStorage";
import { loadConfig } from "../config/envoyConfig";

export function registerRenameCommand(program: Command): void {
  program
    .command("rename <oldName> <newName>")
    .description("Rename an environment entry")
    .option("-p, --project <project>", "Project name (overrides config)")
    .action(async (oldName: string, newName: string, options: { project?: string }) => {
      try {
        const config = await loadConfig();
        const project = options.project ?? config.project;

        if (!project) {
          console.error("Error: No project specified. Use --project or set it in envoy config.");
          process.exit(1);
        }

        const store = await loadStore(project);

        if (!store[oldName]) {
          console.error(`Error: Environment "${oldName}" not found in project "${project}".`);
          process.exit(1);
        }

        if (store[newName]) {
          console.error(`Error: Environment "${newName}" already exists in project "${project}".`);
          process.exit(1);
        }

        store[newName] = { ...store[oldName] };
        delete store[oldName];

        await saveStore(project, store);

        console.log(`Renamed environment "${oldName}" to "${newName}" in project "${project}".`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
