/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeNonWindowsPath = escapeNonWindowsPath;
    exports.collapseTildePath = collapseTildePath;
    exports.sanitizeCwd = sanitizeCwd;
    exports.shouldUseEnvironmentVariableCollection = shouldUseEnvironmentVariableCollection;
    /**
     * Aggressively escape non-windows paths to prepare for being sent to a shell. This will do some
     * escaping inaccurately to be careful about possible script injection via the file path. For
     * example, we're trying to prevent this sort of attack: `/foo/file$(echo evil)`.
     */
    function escapeNonWindowsPath(path) {
        let newPath = path;
        if (newPath.includes('\\')) {
            newPath = newPath.replace(/\\/g, '\\\\');
        }
        const bannedChars = /[\`\$\|\&\>\~\#\!\^\*\;\<\"\']/g;
        newPath = newPath.replace(bannedChars, '');
        return `'${newPath}'`;
    }
    /**
     * Collapses the user's home directory into `~` if it exists within the path, this gives a shorter
     * path that is more suitable within the context of a terminal.
     */
    function collapseTildePath(path, userHome, separator) {
        if (!path) {
            return '';
        }
        if (!userHome) {
            return path;
        }
        // Trim the trailing separator from the end if it exists
        if (userHome.match(/[\/\\]$/)) {
            userHome = userHome.slice(0, userHome.length - 1);
        }
        const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
        const normalizedUserHome = userHome.replace(/\\/g, '/').toLowerCase();
        if (!normalizedPath.includes(normalizedUserHome)) {
            return path;
        }
        return `~${separator}${path.slice(userHome.length + 1)}`;
    }
    /**
     * Sanitizes a cwd string, removing any wrapping quotes and making the Windows drive letter
     * uppercase.
     * @param cwd The directory to sanitize.
     */
    function sanitizeCwd(cwd) {
        // Sanity check that the cwd is not wrapped in quotes (see #160109)
        if (cwd.match(/^['"].*['"]$/)) {
            cwd = cwd.substring(1, cwd.length - 1);
        }
        // Make the drive letter uppercase on Windows (see #9448)
        if (platform_1.OS === 1 /* OperatingSystem.Windows */ && cwd && cwd[1] === ':') {
            return cwd[0].toUpperCase() + cwd.substring(1);
        }
        return cwd;
    }
    /**
     * Determines whether the given shell launch config should use the environment variable collection.
     * @param slc The shell launch config to check.
     */
    function shouldUseEnvironmentVariableCollection(slc) {
        return !slc.strictEnv;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFbnZpcm9ubWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL3Rlcm1pbmFsRW52aXJvbm1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsb0RBUUM7SUFNRCw4Q0FpQkM7SUFPRCxrQ0FVQztJQU1ELHdGQUVDO0lBN0REOzs7O09BSUc7SUFDSCxTQUFnQixvQkFBb0IsQ0FBQyxJQUFZO1FBQ2hELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztRQUNuQixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUM1QixPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUNELE1BQU0sV0FBVyxHQUFHLGlDQUFpQyxDQUFDO1FBQ3RELE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzQyxPQUFPLElBQUksT0FBTyxHQUFHLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7T0FHRztJQUNILFNBQWdCLGlCQUFpQixDQUFDLElBQXdCLEVBQUUsUUFBNEIsRUFBRSxTQUFpQjtRQUMxRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCx3REFBd0Q7UUFDeEQsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDL0IsUUFBUSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUNELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzlELE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdEUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDO1lBQ2xELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELE9BQU8sSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDMUQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQixXQUFXLENBQUMsR0FBVztRQUN0QyxtRUFBbUU7UUFDbkUsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7WUFDL0IsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELHlEQUF5RDtRQUN6RCxJQUFJLGFBQUUsb0NBQTRCLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUM3RCxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUM7SUFFRDs7O09BR0c7SUFDSCxTQUFnQixzQ0FBc0MsQ0FBQyxHQUF1QjtRQUM3RSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUN2QixDQUFDIn0=