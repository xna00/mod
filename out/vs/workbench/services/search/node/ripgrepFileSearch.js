/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/path", "vs/base/common/normalization", "vs/base/common/extpath", "vs/base/common/platform", "vs/base/common/strings", "vs/workbench/services/search/node/ripgrepSearchUtils", "@vscode/ripgrep"], function (require, exports, cp, path, normalization_1, extpath, platform_1, strings, ripgrepSearchUtils_1, ripgrep_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.spawnRipgrepCmd = spawnRipgrepCmd;
    exports.getAbsoluteGlob = getAbsoluteGlob;
    exports.fixDriveC = fixDriveC;
    // If @vscode/ripgrep is in an .asar file, then the binary is unpacked.
    const rgDiskPath = ripgrep_1.rgPath.replace(/\bnode_modules\.asar\b/, 'node_modules.asar.unpacked');
    function spawnRipgrepCmd(config, folderQuery, includePattern, excludePattern) {
        const rgArgs = getRgArgs(config, folderQuery, includePattern, excludePattern);
        const cwd = folderQuery.folder.fsPath;
        return {
            cmd: cp.spawn(rgDiskPath, rgArgs.args, { cwd }),
            rgDiskPath,
            siblingClauses: rgArgs.siblingClauses,
            rgArgs,
            cwd
        };
    }
    function getRgArgs(config, folderQuery, includePattern, excludePattern) {
        const args = ['--files', '--hidden', '--case-sensitive', '--no-require-git'];
        // includePattern can't have siblingClauses
        foldersToIncludeGlobs([folderQuery], includePattern, false).forEach(globArg => {
            const inclusion = (0, ripgrepSearchUtils_1.anchorGlob)(globArg);
            args.push('-g', inclusion);
            if (platform_1.isMacintosh) {
                const normalized = (0, normalization_1.normalizeNFD)(inclusion);
                if (normalized !== inclusion) {
                    args.push('-g', normalized);
                }
            }
        });
        const rgGlobs = foldersToRgExcludeGlobs([folderQuery], excludePattern, undefined, false);
        rgGlobs.globArgs.forEach(globArg => {
            const exclusion = `!${(0, ripgrepSearchUtils_1.anchorGlob)(globArg)}`;
            args.push('-g', exclusion);
            if (platform_1.isMacintosh) {
                const normalized = (0, normalization_1.normalizeNFD)(exclusion);
                if (normalized !== exclusion) {
                    args.push('-g', normalized);
                }
            }
        });
        if (folderQuery.disregardIgnoreFiles !== false) {
            // Don't use .gitignore or .ignore
            args.push('--no-ignore');
        }
        else if (folderQuery.disregardParentIgnoreFiles !== false) {
            args.push('--no-ignore-parent');
        }
        // Follow symlinks
        if (!folderQuery.ignoreSymlinks) {
            args.push('--follow');
        }
        if (config.exists) {
            args.push('--quiet');
        }
        args.push('--no-config');
        if (folderQuery.disregardGlobalIgnoreFiles) {
            args.push('--no-ignore-global');
        }
        return {
            args,
            siblingClauses: rgGlobs.siblingClauses
        };
    }
    function foldersToRgExcludeGlobs(folderQueries, globalExclude, excludesToSkip, absoluteGlobs = true) {
        const globArgs = [];
        let siblingClauses = {};
        folderQueries.forEach(folderQuery => {
            const totalExcludePattern = Object.assign({}, folderQuery.excludePattern || {}, globalExclude || {});
            const result = globExprsToRgGlobs(totalExcludePattern, absoluteGlobs ? folderQuery.folder.fsPath : undefined, excludesToSkip);
            globArgs.push(...result.globArgs);
            if (result.siblingClauses) {
                siblingClauses = Object.assign(siblingClauses, result.siblingClauses);
            }
        });
        return { globArgs, siblingClauses };
    }
    function foldersToIncludeGlobs(folderQueries, globalInclude, absoluteGlobs = true) {
        const globArgs = [];
        folderQueries.forEach(folderQuery => {
            const totalIncludePattern = Object.assign({}, globalInclude || {}, folderQuery.includePattern || {});
            const result = globExprsToRgGlobs(totalIncludePattern, absoluteGlobs ? folderQuery.folder.fsPath : undefined);
            globArgs.push(...result.globArgs);
        });
        return globArgs;
    }
    function globExprsToRgGlobs(patterns, folder, excludesToSkip) {
        const globArgs = [];
        const siblingClauses = {};
        Object.keys(patterns)
            .forEach(key => {
            if (excludesToSkip && excludesToSkip.has(key)) {
                return;
            }
            if (!key) {
                return;
            }
            const value = patterns[key];
            key = trimTrailingSlash(folder ? getAbsoluteGlob(folder, key) : key);
            // glob.ts requires forward slashes, but a UNC path still must start with \\
            // #38165 and #38151
            if (key.startsWith('\\\\')) {
                key = '\\\\' + key.substr(2).replace(/\\/g, '/');
            }
            else {
                key = key.replace(/\\/g, '/');
            }
            if (typeof value === 'boolean' && value) {
                if (key.startsWith('\\\\')) {
                    // Absolute globs UNC paths don't work properly, see #58758
                    key += '**';
                }
                globArgs.push(fixDriveC(key));
            }
            else if (value && value.when) {
                siblingClauses[key] = value;
            }
        });
        return { globArgs, siblingClauses };
    }
    /**
     * Resolves a glob like "node_modules/**" in "/foo/bar" to "/foo/bar/node_modules/**".
     * Special cases C:/foo paths to write the glob like /foo instead - see https://github.com/BurntSushi/ripgrep/issues/530.
     *
     * Exported for testing
     */
    function getAbsoluteGlob(folder, key) {
        return path.isAbsolute(key) ?
            key :
            path.join(folder, key);
    }
    function trimTrailingSlash(str) {
        str = strings.rtrim(str, '\\');
        return strings.rtrim(str, '/');
    }
    function fixDriveC(path) {
        const root = extpath.getRoot(path);
        return root.toLowerCase() === 'c:/' ?
            path.replace(/^c:[/\\]/i, '/') :
            path;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcEZpbGVTZWFyY2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvbm9kZS9yaXBncmVwRmlsZVNlYXJjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsMENBVUM7SUFtSUQsMENBSUM7SUFPRCw4QkFLQztJQWhLRCx1RUFBdUU7SUFDdkUsTUFBTSxVQUFVLEdBQUcsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsd0JBQXdCLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUUxRixTQUFnQixlQUFlLENBQUMsTUFBa0IsRUFBRSxXQUF5QixFQUFFLGNBQWlDLEVBQUUsY0FBaUM7UUFDbEosTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3RDLE9BQU87WUFDTixHQUFHLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQy9DLFVBQVU7WUFDVixjQUFjLEVBQUUsTUFBTSxDQUFDLGNBQWM7WUFDckMsTUFBTTtZQUNOLEdBQUc7U0FDSCxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsU0FBUyxDQUFDLE1BQWtCLEVBQUUsV0FBeUIsRUFBRSxjQUFpQyxFQUFFLGNBQWlDO1FBQ3JJLE1BQU0sSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBRTdFLDJDQUEyQztRQUMzQyxxQkFBcUIsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLGNBQWMs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