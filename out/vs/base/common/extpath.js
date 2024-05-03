/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/types"], function (require, exports, path_1, platform_1, strings_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isPathSeparator = isPathSeparator;
    exports.toSlashes = toSlashes;
    exports.toPosixPath = toPosixPath;
    exports.getRoot = getRoot;
    exports.isUNC = isUNC;
    exports.isValidBasename = isValidBasename;
    exports.isEqual = isEqual;
    exports.isEqualOrParent = isEqualOrParent;
    exports.isWindowsDriveLetter = isWindowsDriveLetter;
    exports.sanitizeFilePath = sanitizeFilePath;
    exports.isRootOrDriveLetter = isRootOrDriveLetter;
    exports.hasDriveLetter = hasDriveLetter;
    exports.getDriveLetter = getDriveLetter;
    exports.indexOfPath = indexOfPath;
    exports.parseLineAndColumnAware = parseLineAndColumnAware;
    exports.randomPath = randomPath;
    function isPathSeparator(code) {
        return code === 47 /* CharCode.Slash */ || code === 92 /* CharCode.Backslash */;
    }
    /**
     * Takes a Windows OS path and changes backward slashes to forward slashes.
     * This should only be done for OS paths from Windows (or user provided paths potentially from Windows).
     * Using it on a Linux or MaxOS path might change it.
     */
    function toSlashes(osPath) {
        return osPath.replace(/[\\/]/g, path_1.posix.sep);
    }
    /**
     * Takes a Windows OS path (using backward or forward slashes) and turns it into a posix path:
     * - turns backward slashes into forward slashes
     * - makes it absolute if it starts with a drive letter
     * This should only be done for OS paths from Windows (or user provided paths potentially from Windows).
     * Using it on a Linux or MaxOS path might change it.
     */
    function toPosixPath(osPath) {
        if (osPath.indexOf('/') === -1) {
            osPath = toSlashes(osPath);
        }
        if (/^[a-zA-Z]:(\/|$)/.test(osPath)) { // starts with a drive letter
            osPath = '/' + osPath;
        }
        return osPath;
    }
    /**
     * Computes the _root_ this path, like `getRoot('c:\files') === c:\`,
     * `getRoot('files:///files/path') === files:///`,
     * or `getRoot('\\server\shares\path') === \\server\shares\`
     */
    function getRoot(path, sep = path_1.posix.sep) {
        if (!path) {
            return '';
        }
        const len = path.length;
        const firstLetter = path.charCodeAt(0);
        if (isPathSeparator(firstLetter)) {
            if (isPathSeparator(path.charCodeAt(1))) {
                // UNC candidate \\localhost\shares\ddd
                //               ^^^^^^^^^^^^^^^^^^^
                if (!isPathSeparator(path.charCodeAt(2))) {
                    let pos = 3;
                    const start = pos;
                    for (; pos < len; pos++) {
                        if (isPathSeparator(path.charCodeAt(pos))) {
                            break;
                        }
                    }
                    if (start !== pos && !isPathSeparator(path.charCodeAt(pos + 1))) {
                        pos += 1;
                        for (; pos < len; pos++) {
                            if (isPathSeparator(path.charCodeAt(pos))) {
                                return path.slice(0, pos + 1) // consume this separator
                                    .replace(/[\\/]/g, sep);
                            }
                        }
                    }
                }
            }
            // /user/far
            // ^
            return sep;
        }
        else if (isWindowsDriveLetter(firstLetter)) {
            // check for windows drive letter c:\ or c:
            if (path.charCodeAt(1) === 58 /* CharCode.Colon */) {
                if (isPathSeparator(path.charCodeAt(2))) {
                    // C:\fff
                    // ^^^
                    return path.slice(0, 2) + sep;
                }
                else {
                    // C:
                    // ^^
                    return path.slice(0, 2);
                }
            }
        }
        // check for URI
        // scheme://authority/path
        // ^^^^^^^^^^^^^^^^^^^
        let pos = path.indexOf('://');
        if (pos !== -1) {
            pos += 3; // 3 -> "://".length
            for (; pos < len; pos++) {
                if (isPathSeparator(path.charCodeAt(pos))) {
                    return path.slice(0, pos + 1); // consume this separator
                }
            }
        }
        return '';
    }
    /**
     * Check if the path follows this pattern: `\\hostname\sharename`.
     *
     * @see https://msdn.microsoft.com/en-us/library/gg465305.aspx
     * @return A boolean indication if the path is a UNC path, on none-windows
     * always false.
     */
    function isUNC(path) {
        if (!platform_1.isWindows) {
            // UNC is a windows concept
            return false;
        }
        if (!path || path.length < 5) {
            // at least \\a\b
            return false;
        }
        let code = path.charCodeAt(0);
        if (code !== 92 /* CharCode.Backslash */) {
            return false;
        }
        code = path.charCodeAt(1);
        if (code !== 92 /* CharCode.Backslash */) {
            return false;
        }
        let pos = 2;
        const start = pos;
        for (; pos < path.length; pos++) {
            code = path.charCodeAt(pos);
            if (code === 92 /* CharCode.Backslash */) {
                break;
            }
        }
        if (start === pos) {
            return false;
        }
        code = path.charCodeAt(pos + 1);
        if (isNaN(code) || code === 92 /* CharCode.Backslash */) {
            return false;
        }
        return true;
    }
    // Reference: https://en.wikipedia.org/wiki/Filename
    const WINDOWS_INVALID_FILE_CHARS = /[\\/:\*\?"<>\|]/g;
    const UNIX_INVALID_FILE_CHARS = /[\\/]/g;
    const WINDOWS_FORBIDDEN_NAMES = /^(con|prn|aux|clock\$|nul|lpt[0-9]|com[0-9])(\.(.*?))?$/i;
    function isValidBasename(name, isWindowsOS = platform_1.isWindows) {
        const invalidFileChars = isWindowsOS ? WINDOWS_INVALID_FILE_CHARS : UNIX_INVALID_FILE_CHARS;
        if (!name || name.length === 0 || /^\s+$/.test(name)) {
            return false; // require a name that is not just whitespace
        }
        invalidFileChars.lastIndex = 0; // the holy grail of software development
        if (invalidFileChars.test(name)) {
            return false; // check for certain invalid file characters
        }
        if (isWindowsOS && WINDOWS_FORBIDDEN_NAMES.test(name)) {
            return false; // check for certain invalid file names
        }
        if (name === '.' || name === '..') {
            return false; // check for reserved values
        }
        if (isWindowsOS && name[name.length - 1] === '.') {
            return false; // Windows: file cannot end with a "."
        }
        if (isWindowsOS && name.length !== name.trim().length) {
            return false; // Windows: file cannot end with a whitespace
        }
        if (name.length > 255) {
            return false; // most file systems do not allow files > 255 length
        }
        return true;
    }
    /**
     * @deprecated please use `IUriIdentityService.extUri.isEqual` instead. If you are
     * in a context without services, consider to pass down the `extUri` from the outside
     * or use `extUriBiasedIgnorePathCase` if you know what you are doing.
     */
    function isEqual(pathA, pathB, ignoreCase) {
        const identityEquals = (pathA === pathB);
        if (!ignoreCase || identityEquals) {
            return identityEquals;
        }
        if (!pathA || !pathB) {
            return false;
        }
        return (0, strings_1.equalsIgnoreCase)(pathA, pathB);
    }
    /**
     * @deprecated please use `IUriIdentityService.extUri.isEqualOrParent` instead. If
     * you are in a context without services, consider to pass down the `extUri` from the
     * outside, or use `extUriBiasedIgnorePathCase` if you know what you are doing.
     */
    function isEqualOrParent(base, parentCandidate, ignoreCase, separator = path_1.sep) {
        if (base === parentCandidate) {
            return true;
        }
        if (!base || !parentCandidate) {
            return false;
        }
        if (parentCandidate.length > base.length) {
            return false;
        }
        if (ignoreCase) {
            const beginsWith = (0, strings_1.startsWithIgnoreCase)(base, parentCandidate);
            if (!beginsWith) {
                return false;
            }
            if (parentCandidate.length === base.length) {
                return true; // same path, different casing
            }
            let sepOffset = parentCandidate.length;
            if (parentCandidate.charAt(parentCandidate.length - 1) === separator) {
                sepOffset--; // adjust the expected sep offset in case our candidate already ends in separator character
            }
            return base.charAt(sepOffset) === separator;
        }
        if (parentCandidate.charAt(parentCandidate.length - 1) !== separator) {
            parentCandidate += separator;
        }
        return base.indexOf(parentCandidate) === 0;
    }
    function isWindowsDriveLetter(char0) {
        return char0 >= 65 /* CharCode.A */ && char0 <= 90 /* CharCode.Z */ || char0 >= 97 /* CharCode.a */ && char0 <= 122 /* CharCode.z */;
    }
    function sanitizeFilePath(candidate, cwd) {
        // Special case: allow to open a drive letter without trailing backslash
        if (platform_1.isWindows && candidate.endsWith(':')) {
            candidate += path_1.sep;
        }
        // Ensure absolute
        if (!(0, path_1.isAbsolute)(candidate)) {
            candidate = (0, path_1.join)(cwd, candidate);
        }
        // Ensure normalized
        candidate = (0, path_1.normalize)(candidate);
        // Ensure no trailing slash/backslash
        if (platform_1.isWindows) {
            candidate = (0, strings_1.rtrim)(candidate, path_1.sep);
            // Special case: allow to open drive root ('C:\')
            if (candidate.endsWith(':')) {
                candidate += path_1.sep;
            }
        }
        else {
            candidate = (0, strings_1.rtrim)(candidate, path_1.sep);
            // Special case: allow to open root ('/')
            if (!candidate) {
                candidate = path_1.sep;
            }
        }
        return candidate;
    }
    function isRootOrDriveLetter(path) {
        const pathNormalized = (0, path_1.normalize)(path);
        if (platform_1.isWindows) {
            if (path.length > 3) {
                return false;
            }
            return hasDriveLetter(pathNormalized) &&
                (path.length === 2 || pathNormalized.charCodeAt(2) === 92 /* CharCode.Backslash */);
        }
        return pathNormalized === path_1.posix.sep;
    }
    function hasDriveLetter(path, isWindowsOS = platform_1.isWindows) {
        if (isWindowsOS) {
            return isWindowsDriveLetter(path.charCodeAt(0)) && path.charCodeAt(1) === 58 /* CharCode.Colon */;
        }
        return false;
    }
    function getDriveLetter(path, isWindowsOS = platform_1.isWindows) {
        return hasDriveLetter(path, isWindowsOS) ? path[0] : undefined;
    }
    function indexOfPath(path, candidate, ignoreCase) {
        if (candidate.length > path.length) {
            return -1;
        }
        if (path === candidate) {
            return 0;
        }
        if (ignoreCase) {
            path = path.toLowerCase();
            candidate = candidate.toLowerCase();
        }
        return path.indexOf(candidate);
    }
    function parseLineAndColumnAware(rawPath) {
        const segments = rawPath.split(':'); // C:\file.txt:<line>:<column>
        let path = undefined;
        let line = undefined;
        let column = undefined;
        for (const segment of segments) {
            const segmentAsNumber = Number(segment);
            if (!(0, types_1.isNumber)(segmentAsNumber)) {
                path = !!path ? [path, segment].join(':') : segment; // a colon can well be part of a path (e.g. C:\...)
            }
            else if (line === undefined) {
                line = segmentAsNumber;
            }
            else if (column === undefined) {
                column = segmentAsNumber;
            }
        }
        if (!path) {
            throw new Error('Format for `--goto` should be: `FILE:LINE(:COLUMN)`');
        }
        return {
            path,
            line: line !== undefined ? line : undefined,
            column: column !== undefined ? column : line !== undefined ? 1 : undefined // if we have a line, make sure column is also set
        };
    }
    const pathChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const windowsSafePathFirstChars = 'BDEFGHIJKMOQRSTUVWXYZbdefghijkmoqrstuvwxyz0123456789';
    function randomPath(parent, prefix, randomLength = 8) {
        let suffix = '';
        for (let i = 0; i < randomLength; i++) {
            let pathCharsTouse;
            if (i === 0 && platform_1.isWindows && !prefix && (randomLength === 3 || randomLength === 4)) {
                // Windows has certain reserved file names that cannot be used, such
                // as AUX, CON, PRN, etc. We want to avoid generating a random name
                // that matches that pattern, so we use a different set of characters
                // for the first character of the name that does not include any of
                // the reserved names first characters.
                pathCharsTouse = windowsSafePathFirstChars;
            }
            else {
                pathCharsTouse = pathChars;
            }
            suffix += pathCharsTouse.charAt(Math.floor(Math.random() * pathCharsTouse.length));
        }
        let randomFileName;
        if (prefix) {
            randomFileName = `${prefix}-${suffix}`;
        }
        else {
            randomFileName = suffix;
        }
        if (parent) {
            return (0, path_1.join)(parent, randomFileName);
        }
        return randomFileName;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cGF0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vZXh0cGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRywwQ0FFQztJQU9ELDhCQUVDO0lBU0Qsa0NBUUM7SUFPRCwwQkFpRUM7SUFTRCxzQkEwQ0M7SUFNRCwwQ0FpQ0M7SUFPRCwwQkFXQztJQU9ELDBDQW9DQztJQUVELG9EQUVDO0lBRUQsNENBa0NDO0lBRUQsa0RBYUM7SUFFRCx3Q0FNQztJQUVELHdDQUVDO0lBRUQsa0NBZUM7SUFRRCwwREEyQkM7SUFLRCxnQ0FnQ0M7SUF2WkQsU0FBZ0IsZUFBZSxDQUFDLElBQVk7UUFDM0MsT0FBTyxJQUFJLDRCQUFtQixJQUFJLElBQUksZ0NBQXVCLENBQUM7SUFDL0QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQixTQUFTLENBQUMsTUFBYztRQUN2QyxPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFlBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsU0FBZ0IsV0FBVyxDQUFDLE1BQWM7UUFDekMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDaEMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBQ0QsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLDZCQUE2QjtZQUNuRSxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQztRQUN2QixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLE9BQU8sQ0FBQyxJQUFZLEVBQUUsTUFBYyxZQUFLLENBQUMsR0FBRztRQUM1RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3hCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsSUFBSSxlQUFlLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUNsQyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDekMsdUNBQXVDO2dCQUN2QyxvQ0FBb0M7Z0JBQ3BDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzFDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztvQkFDWixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7b0JBQ2xCLE9BQU8sR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUN6QixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDM0MsTUFBTTt3QkFDUCxDQUFDO29CQUNGLENBQUM7b0JBQ0QsSUFBSSxLQUFLLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDakUsR0FBRyxJQUFJLENBQUMsQ0FBQzt3QkFDVCxPQUFPLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQzs0QkFDekIsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0NBQzNDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLHlCQUF5QjtxQ0FDckQsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQzs0QkFDMUIsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxZQUFZO1lBQ1osSUFBSTtZQUNKLE9BQU8sR0FBRyxDQUFDO1FBRVosQ0FBQzthQUFNLElBQUksb0JBQW9CLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztZQUM5QywyQ0FBMkM7WUFFM0MsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyw0QkFBbUIsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDekMsU0FBUztvQkFDVCxNQUFNO29CQUNOLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUMvQixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsS0FBSztvQkFDTCxLQUFLO29CQUNMLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELGdCQUFnQjtRQUNoQiwwQkFBMEI7UUFDMUIsc0JBQXNCO1FBQ3RCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUIsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNoQixHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsb0JBQW9CO1lBQzlCLE9BQU8sR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUN6QixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyx5QkFBeUI7Z0JBQ3pELENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFNBQWdCLEtBQUssQ0FBQyxJQUFZO1FBQ2pDLElBQUksQ0FBQyxvQkFBUyxFQUFFLENBQUM7WUFDaEIsMkJBQTJCO1lBQzNCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM5QixpQkFBaUI7WUFDakIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLElBQUksZ0NBQXVCLEVBQUUsQ0FBQztZQUNqQyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUxQixJQUFJLElBQUksZ0NBQXVCLEVBQUUsQ0FBQztZQUNqQyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDWixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7UUFDbEIsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBQ2pDLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLElBQUksSUFBSSxnQ0FBdUIsRUFBRSxDQUFDO2dCQUNqQyxNQUFNO1lBQ1AsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLEtBQUssS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNuQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFaEMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxnQ0FBdUIsRUFBRSxDQUFDO1lBQ2hELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxNQUFNLDBCQUEwQixHQUFHLGtCQUFrQixDQUFDO0lBQ3RELE1BQU0sdUJBQXVCLEdBQUcsUUFBUSxDQUFDO0lBQ3pDLE1BQU0sdUJBQXVCLEdBQUcsMERBQTBELENBQUM7SUFDM0YsU0FBZ0IsZUFBZSxDQUFDLElBQStCLEVBQUUsY0FBdUIsb0JBQVM7UUFDaEcsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQztRQUU1RixJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN0RCxPQUFPLEtBQUssQ0FBQyxDQUFDLDZDQUE2QztRQUM1RCxDQUFDO1FBRUQsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLHlDQUF5QztRQUN6RSxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE9BQU8sS0FBSyxDQUFDLENBQUMsNENBQTRDO1FBQzNELENBQUM7UUFFRCxJQUFJLFdBQVcsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN2RCxPQUFPLEtBQUssQ0FBQyxDQUFDLHVDQUF1QztRQUN0RCxDQUFDO1FBRUQsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNuQyxPQUFPLEtBQUssQ0FBQyxDQUFDLDRCQUE0QjtRQUMzQyxDQUFDO1FBRUQsSUFBSSxXQUFXLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDbEQsT0FBTyxLQUFLLENBQUMsQ0FBQyxzQ0FBc0M7UUFDckQsQ0FBQztRQUVELElBQUksV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3ZELE9BQU8sS0FBSyxDQUFDLENBQUMsNkNBQTZDO1FBQzVELENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDdkIsT0FBTyxLQUFLLENBQUMsQ0FBQyxvREFBb0Q7UUFDbkUsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxTQUFnQixPQUFPLENBQUMsS0FBYSxFQUFFLEtBQWEsRUFBRSxVQUFvQjtRQUN6RSxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsVUFBVSxJQUFJLGNBQWMsRUFBRSxDQUFDO1lBQ25DLE9BQU8sY0FBYyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsT0FBTyxJQUFBLDBCQUFnQixFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFNBQWdCLGVBQWUsQ0FBQyxJQUFZLEVBQUUsZUFBdUIsRUFBRSxVQUFvQixFQUFFLFNBQVMsR0FBRyxVQUFHO1FBQzNHLElBQUksSUFBSSxLQUFLLGVBQWUsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMvQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLGVBQWUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzFDLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksVUFBVSxFQUFFLENBQUM7WUFDaEIsTUFBTSxVQUFVLEdBQUcsSUFBQSw4QkFBb0IsRUFBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLGVBQWUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QyxPQUFPLElBQUksQ0FBQyxDQUFDLDhCQUE4QjtZQUM1QyxDQUFDO1lBRUQsSUFBSSxTQUFTLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztZQUN2QyxJQUFJLGVBQWUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdEUsU0FBUyxFQUFFLENBQUMsQ0FBQywyRkFBMkY7WUFDekcsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUM7UUFDN0MsQ0FBQztRQUVELElBQUksZUFBZSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3RFLGVBQWUsSUFBSSxTQUFTLENBQUM7UUFDOUIsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELFNBQWdCLG9CQUFvQixDQUFDLEtBQWE7UUFDakQsT0FBTyxLQUFLLHVCQUFjLElBQUksS0FBSyx1QkFBYyxJQUFJLEtBQUssdUJBQWMsSUFBSSxLQUFLLHdCQUFjLENBQUM7SUFDakcsQ0FBQztJQUVELFNBQWdCLGdCQUFnQixDQUFDLFNBQWlCLEVBQUUsR0FBVztRQUU5RCx3RUFBd0U7UUFDeEUsSUFBSSxvQkFBUyxJQUFJLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMxQyxTQUFTLElBQUksVUFBRyxDQUFDO1FBQ2xCLENBQUM7UUFFRCxrQkFBa0I7UUFDbEIsSUFBSSxDQUFDLElBQUEsaUJBQVUsRUFBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQzVCLFNBQVMsR0FBRyxJQUFBLFdBQUksRUFBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELG9CQUFvQjtRQUNwQixTQUFTLEdBQUcsSUFBQSxnQkFBUyxFQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWpDLHFDQUFxQztRQUNyQyxJQUFJLG9CQUFTLEVBQUUsQ0FBQztZQUNmLFNBQVMsR0FBRyxJQUFBLGVBQUssRUFBQyxTQUFTLEVBQUUsVUFBRyxDQUFDLENBQUM7WUFFbEMsaURBQWlEO1lBQ2pELElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM3QixTQUFTLElBQUksVUFBRyxDQUFDO1lBQ2xCLENBQUM7UUFFRixDQUFDO2FBQU0sQ0FBQztZQUNQLFNBQVMsR0FBRyxJQUFBLGVBQUssRUFBQyxTQUFTLEVBQUUsVUFBRyxDQUFDLENBQUM7WUFFbEMseUNBQXlDO1lBQ3pDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsU0FBUyxHQUFHLFVBQUcsQ0FBQztZQUNqQixDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxJQUFZO1FBQy9DLE1BQU0sY0FBYyxHQUFHLElBQUEsZ0JBQVMsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxJQUFJLG9CQUFTLEVBQUUsQ0FBQztZQUNmLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDckIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDO2dCQUNwQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLGdDQUF1QixDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELE9BQU8sY0FBYyxLQUFLLFlBQUssQ0FBQyxHQUFHLENBQUM7SUFDckMsQ0FBQztJQUVELFNBQWdCLGNBQWMsQ0FBQyxJQUFZLEVBQUUsY0FBdUIsb0JBQVM7UUFDNUUsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNqQixPQUFPLG9CQUFvQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyw0QkFBbUIsQ0FBQztRQUMxRixDQUFDO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLElBQVksRUFBRSxjQUF1QixvQkFBUztRQUM1RSxPQUFPLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ2hFLENBQUM7SUFFRCxTQUFnQixXQUFXLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsVUFBb0I7UUFDaEYsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQztRQUVELElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVELElBQUksVUFBVSxFQUFFLENBQUM7WUFDaEIsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQixTQUFTLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JDLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQVFELFNBQWdCLHVCQUF1QixDQUFDLE9BQWU7UUFDdEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLDhCQUE4QjtRQUVuRSxJQUFJLElBQUksR0FBdUIsU0FBUyxDQUFDO1FBQ3pDLElBQUksSUFBSSxHQUF1QixTQUFTLENBQUM7UUFDekMsSUFBSSxNQUFNLEdBQXVCLFNBQVMsQ0FBQztRQUUzQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsSUFBQSxnQkFBUSxFQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLG1EQUFtRDtZQUN6RyxDQUFDO2lCQUFNLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMvQixJQUFJLEdBQUcsZUFBZSxDQUFDO1lBQ3hCLENBQUM7aUJBQU0sSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sR0FBRyxlQUFlLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJO1lBQ0osSUFBSSxFQUFFLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUztZQUMzQyxNQUFNLEVBQUUsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxrREFBa0Q7U0FDN0gsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLFNBQVMsR0FBRyxnRUFBZ0UsQ0FBQztJQUNuRixNQUFNLHlCQUF5QixHQUFHLHNEQUFzRCxDQUFDO0lBRXpGLFNBQWdCLFVBQVUsQ0FBQyxNQUFlLEVBQUUsTUFBZSxFQUFFLFlBQVksR0FBRyxDQUFDO1FBQzVFLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkMsSUFBSSxjQUFzQixDQUFDO1lBQzNCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxvQkFBUyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsWUFBWSxLQUFLLENBQUMsSUFBSSxZQUFZLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFFbkYsb0VBQW9FO2dCQUNwRSxtRUFBbUU7Z0JBQ25FLHFFQUFxRTtnQkFDckUsbUVBQW1FO2dCQUNuRSx1Q0FBdUM7Z0JBRXZDLGNBQWMsR0FBRyx5QkFBeUIsQ0FBQztZQUM1QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsY0FBYyxHQUFHLFNBQVMsQ0FBQztZQUM1QixDQUFDO1lBRUQsTUFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDcEYsQ0FBQztRQUVELElBQUksY0FBc0IsQ0FBQztRQUMzQixJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1osY0FBYyxHQUFHLEdBQUcsTUFBTSxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3hDLENBQUM7YUFBTSxDQUFDO1lBQ1AsY0FBYyxHQUFHLE1BQU0sQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNaLE9BQU8sSUFBQSxXQUFJLEVBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxPQUFPLGNBQWMsQ0FBQztJQUN2QixDQUFDIn0=