import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Command } from "commander";
import * as fileStorage from "../storage/fileStorage";
import * as envoyConfig from "../config/envoyConfig";
import { registerRenameCommand } from "./rename";

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRenameCommand(program);
  return program;
}

describe("rename command", () => {
  const mockStore: Record<string, any> = {};

  beforeEach(() => {
    vi.spyOn(envoyConfig, "loadConfig").mockResolvedValue({ project: "my-app" } as any);
    vi.spyOn(fileStorage, "loadStore").mockImplementation(async () => ({ ...mockStore }));
    vi.spyOn(fileStorage, "saveStore").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renames an existing environment entry", async () => {
    vi.spyOn(fileStorage, "loadStore").mockResolvedValue({ staging: { data: "abc" } });
    const saveSpy = vi.spyOn(fileStorage, "saveStore").mockResolvedValue(undefined);

    const program = makeProgram();
    await program.parseAsync(["node", "test", "rename", "staging", "production"]);

    expect(saveSpy).toHaveBeenCalledWith(
      "my-app",
      expect.objectContaining({ production: { data: "abc" } })
    );
    expect(saveSpy.mock.calls[0][1]).not.toHaveProperty("staging");
  });

  it("exits with error if old name does not exist", async () => {
    vi.spyOn(fileStorage, "loadStore").mockResolvedValue({});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => { throw new Error("exit"); }) as any);

    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "test", "rename", "nonexistent", "production"])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with error if new name already exists", async () => {
    vi.spyOn(fileStorage, "loadStore").mockResolvedValue({ staging: {}, production: {} });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => { throw new Error("exit"); }) as any);

    const program = makeProgram();
    await expect(
      program.parseAsync(["node", "test", "rename", "staging", "production"])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("uses --project option over config", async () => {
    vi.spyOn(fileStorage, "loadStore").mockResolvedValue({ dev: { data: "xyz" } });
    const saveSpy = vi.spyOn(fileStorage, "saveStore").mockResolvedValue(undefined);

    const program = makeProgram();
    await program.parseAsync(["node", "test", "rename", "dev", "development", "--project", "other-app"]);

    expect(fileStorage.loadStore).toHaveBeenCalledWith("other-app");
    expect(saveSpy).toHaveBeenCalledWith("other-app", expect.any(Object));
  });
});
