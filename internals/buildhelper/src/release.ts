import build from "./build";
import { crossExecFileSync, updateVersion, revertVersion, log } from "./utils";
import { Package } from "./packages";

process.env.NODE_ENV = "release";

export enum ReleaseTypes {
  "major",
  "minor",
  "patch",
}

const debug = log("release");

/// publish package to npm repo
export function publish(pack: Package): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      crossExecFileSync("pnpm", ["publish"], { cwd: pack.root });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/// commit/push modified/added/staged/removed files
export function git(pack: Package, version: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      crossExecFileSync("git", ["add", "."], { cwd: pack.root });
      crossExecFileSync(
        "git",
        ["commit", "-m", `release: release ${pack.main}@${version}`],
        { cwd: pack.root }
      );
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/// Release steps
/// 1. build package
/// 2. update package version
/// 3. sync your local repo to remote service
/// 4. publish package to npm service
export default async function release(
  scope: string[],
  ignore: string[],
  extraOptions: {
    type: keyof typeof ReleaseTypes;
  }
): Promise<void> {
  debug("Start release process...");
  await build(scope, ignore).then(async (packs) => {
    /// Release the kraken!!!!!!!!!!!!!
    for await (const pack of packs) {
      debug(`publish ${pack.main}...`);
      try {
        const releasePackageJson = updateVersion(pack, extraOptions.type);
        await git(pack, releasePackageJson.version);
        await publish(pack);
        debug(
          `publish ${pack.main}@${releasePackageJson.version} successfully ✨`
        );
      } catch (e) {
        revertVersion(pack);
        console.log(e);
      }
    }
  });
}
