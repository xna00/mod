/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings", "vs/base/node/pfs"], function (require, exports, fs, path_1, platform_1, strings_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.realcaseSync = realcaseSync;
    exports.realcase = realcase;
    exports.realpath = realpath;
    exports.realpathSync = realpathSync;
    /**
     * Copied from: https://github.com/microsoft/vscode-node-debug/blob/master/src/node/pathUtilities.ts#L83
     *
     * Given an absolute, normalized, and existing file path 'realcase' returns the exact path that the file has on disk.
     * On a case insensitive file system, the returned path might differ from the original path by character casing.
     * On a case sensitive file system, the returned path will always be identical to the original path.
     * In case of errors, null is returned. But you cannot use this function to verify that a path exists.
     * realcaseSync does not handle '..' or '.' path segments and it does not take the locale into account.
     */
    function realcaseSync(path) {
        if (platform_1.isLinux) {
            // This method is unsupported on OS that have case sensitive
            // file system where the same path can exist in different forms
            // (see also https://github.com/microsoft/vscode/issues/139709)
            return path;
        }
        const dir = (0, path_1.dirname)(path);
        if (path === dir) { // end recursion
            return path;
        }
        const name = ((0, path_1.basename)(path) /* can be '' for windows drive letters */ || path).toLowerCase();
        try {
            const entries = (0, pfs_1.readdirSync)(dir);
            const found = entries.filter(e => e.toLowerCase() === name); // use a case insensitive search
            if (found.length === 1) {
                // on a case sensitive filesystem we cannot determine here, whether the file exists or not, hence we need the 'file exists' precondition
                const prefix = realcaseSync(dir); // recurse
                if (prefix) {
                    return (0, path_1.join)(prefix, found[0]);
                }
            }
            else if (found.length > 1) {
                // must be a case sensitive $filesystem
                const ix = found.indexOf(name);
                if (ix >= 0) { // case sensitive
                    const prefix = realcaseSync(dir); // recurse
                    if (prefix) {
                        return (0, path_1.join)(prefix, found[ix]);
                    }
                }
            }
        }
        catch (error) {
            // silently ignore error
        }
        return null;
    }
    async function realcase(path, token) {
        if (platform_1.isLinux) {
            // This method is unsupported on OS that have case sensitive
            // file system where the same path can exist in different forms
            // (see also https://github.com/microsoft/vscode/issues/139709)
            return path;
        }
        const dir = (0, path_1.dirname)(path);
        if (path === dir) { // end recursion
            return path;
        }
        const name = ((0, path_1.basename)(path) /* can be '' for windows drive letters */ || path).toLowerCase();
        try {
            if (token?.isCancellationRequested) {
                return null;
            }
            const entries = await pfs_1.Promises.readdir(dir);
            const found = entries.filter(e => e.toLowerCase() === name); // use a case insensitive search
            if (found.length === 1) {
                // on a case sensitive filesystem we cannot determine here, whether the file exists or not, hence we need the 'file exists' precondition
                const prefix = await realcase(dir, token); // recurse
                if (prefix) {
                    return (0, path_1.join)(prefix, found[0]);
                }
            }
            else if (found.length > 1) {
                // must be a case sensitive $filesystem
                const ix = found.indexOf(name);
                if (ix >= 0) { // case sensitive
                    const prefix = await realcase(dir, token); // recurse
                    if (prefix) {
                        return (0, path_1.join)(prefix, found[ix]);
                    }
                }
            }
        }
        catch (error) {
            // silently ignore error
        }
        return null;
    }
    async function realpath(path) {
        try {
            // DO NOT USE `fs.promises.realpath` here as it internally
            // calls `fs.native.realpath` which will result in subst
            // drives to be resolved to their target on Windows
            // https://github.com/microsoft/vscode/issues/118562
            return await pfs_1.Promises.realpath(path);
        }
        catch (error) {
            // We hit an error calling fs.realpath(). Since fs.realpath() is doing some path normalization
            // we now do a similar normalization and then try again if we can access the path with read
            // permissions at least. If that succeeds, we return that path.
            // fs.realpath() is resolving symlinks and that can fail in certain cases. The workaround is
            // to not resolve links but to simply see if the path is read accessible or not.
            const normalizedPath = normalizePath(path);
            await pfs_1.Promises.access(normalizedPath, fs.constants.R_OK);
            return normalizedPath;
        }
    }
    function realpathSync(path) {
        try {
            return fs.realpathSync(path);
        }
        catch (error) {
            // We hit an error calling fs.realpathSync(). Since fs.realpathSync() is doing some path normalization
            // we now do a similar normalization and then try again if we can access the path with read
            // permissions at least. If that succeeds, we return that path.
            // fs.realpath() is resolving symlinks and that can fail in certain cases. The workaround is
            // to not resolve links but to simply see if the path is read accessible or not.
            const normalizedPath = normalizePath(path);
            fs.accessSync(normalizedPath, fs.constants.R_OK); // throws in case of an error
            return normalizedPath;
        }
    }
    function normalizePath(path) {
        return (0, strings_1.rtrim)((0, path_1.normalize)(path), path_1.sep);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cGF0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9ub2RlL2V4dHBhdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLG9DQXNDQztJQUVELDRCQTBDQztJQUVELDRCQW9CQztJQUVELG9DQWdCQztJQW5JRDs7Ozs7Ozs7T0FRRztJQUNILFNBQWdCLFlBQVksQ0FBQyxJQUFZO1FBQ3hDLElBQUksa0JBQU8sRUFBRSxDQUFDO1lBQ2IsNERBQTREO1lBQzVELCtEQUErRDtZQUMvRCwrREFBK0Q7WUFDL0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxHQUFHLEdBQUcsSUFBQSxjQUFPLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0I7WUFDbkMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQyx5Q0FBeUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM5RixJQUFJLENBQUM7WUFDSixNQUFNLE9BQU8sR0FBRyxJQUFBLGlCQUFXLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLGdDQUFnQztZQUM3RixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLHdJQUF3STtnQkFDeEksTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUcsVUFBVTtnQkFD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