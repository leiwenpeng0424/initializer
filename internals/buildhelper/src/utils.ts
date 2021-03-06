import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { execFileSync, ExecFileSyncOptions } from "child_process";
import { Package, PackageJson } from "./packages";
import { ReleaseTypes } from "./release";
import chalk from "chalk";

const cwd = process.cwd();

export const isUsingPnpm = existsSync(resolve(cwd, "pnpm-lock.yaml"));
export const isUsingNpm = existsSync(resolve(cwd, "package-lock.json"));
export const isUsingYarn = existsSync(resolve(cwd, "yarn.lock"));

export function hasMoreThanOnePackageLock(): boolean {
  return (
    (isUsingPnpm && isUsingNpm) ||
    (isUsingPnpm && isUsingYarn) ||
    (isUsingNpm && isUsingYarn)
  );
}

/// make sure it's working in Wins
export function crossExecFileSync(
  command: string,
  options: ReadonlyArray<string> = [],
  config: ExecFileSyncOptions = {}
): string | Buffer {
  return execFileSync(command, options, {
    stdio: "inherit",
    ...config,
    shell: process.platform === "win32",
  });
}

/// revert version after release process failed
export function revertVersion(pack: Package): void {
  writeFileSync(
    resolve(pack.root, "package.json"),
    JSON.stringify(pack.json, null, 2)
  );
}

/// update version field in package.json, before release
export function updateVersion(
  pack: Package,
  type: keyof typeof ReleaseTypes = "minor"
): PackageJson {
  const { json, root } = pack;
  /// make a shallow copy
  const shallowCopyJson = Object.assign({}, json);

  let version = shallowCopyJson.version;

  if (!version) {
    version = "0.0.0";
  }

  let [major, minor, patch] = version.split(".");
  switch (type) {
    case "major": {
      major = String(Number(major) + 1);
      minor = String(0);
      patch = String(0);
      break;
    }
    case "minor": {
      minor = String(Number(minor) + 1);
      patch = String(0);
      break;
    }
    case "patch": {
      patch = String(Number(patch) + 1);
      break;
    }
  }

  shallowCopyJson.version = [major, minor, patch].join(".");

  writeFileSync(
    resolve(root, "package.json"),
    JSON.stringify(shallowCopyJson, null, 2)
  );

  return shallowCopyJson;
}

export function clearScreen(): void {
  process.stdout.write("\u001b[2J\u001b[0;0H");
}

type LogLevel = "info" | "warn" | "error" | "fatal";

export function log(module: string) {
  return (message: string, level: LogLevel = "info"): void => {
    const logTime = chalk.bgGray(chalk.bold(new Date().toLocaleTimeString()));
    process.stdin.write(`[${logTime}] ${message}\n`);
    if (level === "fatal") {
      process.exit(2);
    }
  };
}
