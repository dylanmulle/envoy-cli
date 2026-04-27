import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { loadConfig } from "../config/envoyConfig";
import { loadStore } from "../storage/fileStorage";
import { decryptEnvFile } from "../crypto/encryption";

function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

export function registerDiffCommand(program: Command): void {
  program
    .command("diff <environment>")
    .description("Show differences between local .env file and stored environment")
    .option("-f, --file <path>", "Path to local .env file", ".env")
    .action(async (environment: string, options: { file: string }) => {
      const config = loadConfig();
      if (!config) {
        console.error("No envoy config found. Run `envoy init` first.");
        process.exit(1);
      }

      const store = loadStore();
      const entry = store.entries.find(
        (e) => e.project === config.project && e.environment === environment
      );

      if (!entry) {
        console.error(`No stored entry found for environment: ${environment}`);
        process.exit(1);
      }

      const localPath = path.resolve(options.file);
      if (!fs.existsSync(localPath)) {
        console.error(`Local file not found: ${localPath}`);
        process.exit(1);
      }

      const localContent = fs.readFileSync(localPath, "utf-8");
      const storedContent = decryptEnvFile(entry.encryptedData, config.secret);

      const localVars = parseEnvContent(localContent);
      const storedVars = parseEnvContent(storedContent);

      const allKeys = new Set([...Object.keys(localVars), ...Object.keys(storedVars)]);
      let hasDiff = false;

      for (const key of Array.from(allKeys).sort()) {
        if (!(key in storedVars)) {
          console.log(`+ ${key}=${localVars[key]}`);
          hasDiff = true;
        } else if (!(key in localVars)) {
          console.log(`- ${key}=${storedVars[key]}`);
          hasDiff = true;
        } else if (localVars[key] !== storedVars[key]) {
          console.log(`~ ${key}: ${storedVars[key]} → ${localVars[key]}`);
          hasDiff = true;
        }
      }

      if (!hasDiff) {
        console.log("No differences found.");
      }
    });
}
