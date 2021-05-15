"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.git = exports.publish = exports.ReleaseTypes = void 0;
const build_1 = __importDefault(require("./build"));
const utils_1 = require("./utils");
var ReleaseTypes;
(function (ReleaseTypes) {
    ReleaseTypes[ReleaseTypes["major"] = 0] = "major";
    ReleaseTypes[ReleaseTypes["minor"] = 1] = "minor";
    ReleaseTypes[ReleaseTypes["patch"] = 2] = "patch";
})(ReleaseTypes = exports.ReleaseTypes || (exports.ReleaseTypes = {}));
/// publish package to npm repo
function publish(pack, success, failed) {
    try {
        ///
        /// 虽然使用pnpm做包管理，但是我们还是选择使用npm指令来发布包。
        ///
        utils_1.crossExecFileSync("npm", ["publish"], {
            cwd: pack.root,
        });
        success();
    }
    catch (e) {
        failed(e);
    }
}
exports.publish = publish;
/// commit/push modified/added/staged/removed files
function git(pack) {
    try {
        console.log("commiting files");
        utils_1.crossExecFileSync("git", ["add", "."], { cwd: pack.root });
        utils_1.crossExecFileSync("git", ["commit", "-m", `release: release ${pack.main}@${pack.json.version}`], { cwd: pack.root });
    }
    catch (e) {
        console.error(e);
    }
}
exports.git = git;
/// Release steps
/// 1. build package
/// 2. update package version
/// 3. sync your local repo to remote service
/// 4. publish package to npm service
function release(scope, ignore, type) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("[@rays/buildhelper] Start release process......");
        console.log("");
        /// build before release
        yield build_1.default(scope, ignore).then((packs) => __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(packs.map((pack) => {
                utils_1.updateVersion(pack, type);
                publish(pack, () => git(pack), (e) => {
                    console.log(e.message);
                    utils_1.revertVersion(pack);
                });
            }));
        }));
    });
}
exports.default = release;
