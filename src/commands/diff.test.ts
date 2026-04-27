import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Command } from "commander";
import { registerDiffCommand } from "./diff";
import { initConfig } from "../config/envoyConfig";
import { initStore, upsertEntry } from "../storage/fileStorage";
import { encryptEnvFile } from "../crypto/encryption";

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envoy-diff-test-"));
}

describe("diff command", () => {
  let tmpDir: string;
  let originalCwd: string;
  let output: string[];
  let errors: string[];

  beforeEach(() => {
    tmpDir = makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    output = [];
    errors = [];
    console.log = (...args: unknown[]) => output.push(args.join(" "));
    console.error = (...args: unknown[]) => errors.push(args.join(" "));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("shows no differences when files match", async () => {
    initConfig({ project: "myapp", secret: "supersecret" });
    initStore();
    const content = "KEY=value\nFOO=bar\n";
    const encrypted = encryptEnvFile(content, "supersecret");
    upsertEntry({ project: "myapp", environment: "staging", encryptedData: encrypted });
    fs.writeFileSync(".env", content);

    const program = new Command();
    registerDiffCommand(program);
    await program.parseAsync(["node", "test", "diff", "staging"]);

    expect(output.some((l) => l.includes("No differences found"))).toBe(true);
  });

  it("shows added keys in local file", async () => {
    initConfig({ project: "myapp", secret: "supersecret" });
    initStore();
    const storedContent = "KEY=value\n";
    const encrypted = encryptEnvFile(storedContent, "supersecret");
    upsertEntry({ project: "myapp", environment: "staging", encryptedData: encrypted });
    fs.writeFileSync(".env", "KEY=value\nNEW_KEY=newval\n");

    const program = new Command();
    registerDiffCommand(program);
    await program.parseAsync(["node", "test", "diff", "staging"]);

    expect(output.some((l) => l.startsWith("+ NEW_KEY"))).toBe(true);
  });

  it("shows changed values", async () => {
    initConfig({ project: "myapp", secret: "supersecret" });
    initStore();
    const storedContent = "KEY=oldvalue\n";
    const encrypted = encryptEnvFile(storedContent, "supersecret");
    upsertEntry({ project: "myapp", environment: "staging", encryptedData: encrypted });
    fs.writeFileSync(".env", "KEY=newvalue\n");

    const program = new Command();
    registerDiffCommand(program);
    await program.parseAsync(["node", "test", "diff", "staging"]);

    expect(output.some((l) => l.includes("KEY") && l.includes("oldvalue") && l.includes("newvalue"))).toBe(true);
  });
});
