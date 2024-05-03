/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/strings"], function (require, exports, arrays_1, extpath_1, path_1, platform_1, resources_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPathLabel = getPathLabel;
    exports.normalizeDriveLetter = normalizeDriveLetter;
    exports.tildify = tildify;
    exports.untildify = untildify;
    exports.shorten = shorten;
    exports.template = template;
    exports.mnemonicMenuLabel = mnemonicMenuLabel;
    exports.mnemonicButtonLabel = mnemonicButtonLabel;
    exports.unmnemonicLabel = unmnemonicLabel;
    exports.splitRecentLabel = splitRecentLabel;
    function getPathLabel(resource, formatting) {
        const { os, tildify: tildifier, relative: relatifier } = formatting;
        // return early with a relative path if we can resolve one
        if (relatifier) {
            const relativePath = getRelativePathLabel(resource, relatifier, os);
            if (typeof relativePath === 'string') {
                return relativePath;
            }
        }
        // otherwise try to resolve a absolute path label and
        // apply target OS standard path separators if target
        // OS differs from actual OS we are running in
        let absolutePath = resource.fsPath;
        if (os === 1 /* OperatingSystem.Windows */ && !platform_1.isWindows) {
            absolutePath = absolutePath.replace(/\//g, '\\');
        }
        else if (os !== 1 /* OperatingSystem.Windows */ && platform_1.isWindows) {
            absolutePath = absolutePath.replace(/\\/g, '/');
        }
        // macOS/Linux: tildify with provided user home directory
        if (os !== 1 /* OperatingSystem.Windows */ && tildifier?.userHome) {
            const userHome = tildifier.userHome.fsPath;
            // This is a bit of a hack, but in order to figure out if the
            // resource is in the user home, we need to make sure to convert it
            // to a user home resource. We cannot assume that the resource is
            // already a user home resource.
            let userHomeCandidate;
            if (resource.scheme !== tildifier.userHome.scheme && resource.path[0] === path_1.posix.sep && resource.path[1] !== path_1.posix.sep) {
                userHomeCandidate = tildifier.userHome.with({ path: resource.path }).fsPath;
            }
            else {
                userHomeCandidate = absolutePath;
            }
            absolutePath = tildify(userHomeCandidate, userHome, os);
        }
        // normalize
        const pathLib = os === 1 /* OperatingSystem.Windows */ ? path_1.win32 : path_1.posix;
        return pathLib.normalize(normalizeDriveLetter(absolutePath, os === 1 /* OperatingSystem.Windows */));
    }
    function getRelativePathLabel(resource, relativePathProvider, os) {
        const pathLib = os === 1 /* OperatingSystem.Windows */ ? path_1.win32 : path_1.posix;
        const extUriLib = os === 3 /* OperatingSystem.Linux */ ? resources_1.extUri : resources_1.extUriIgnorePathCase;
        const workspace = relativePathProvider.getWorkspace();
        const firstFolder = (0, arrays_1.firstOrDefault)(workspace.folders);
        if (!firstFolder) {
            return undefined;
        }
        // This is a bit of a hack, but in order to figure out the folder
        // the resource belongs to, we need to make sure to convert it
        // to a workspace resource. We cannot assume that the resource is
        // already matching the workspace.
        if (resource.scheme !== firstFolder.uri.scheme && resource.path[0] === path_1.posix.sep && resource.path[1] !== path_1.posix.sep) {
            resource = firstFolder.uri.with({ path: resource.path });
        }
        const folder = relativePathProvider.getWorkspaceFolder(resource);
        if (!folder) {
            return undefined;
        }
        let relativePathLabel = undefined;
        if (extUriLib.isEqual(folder.uri, resource)) {
            relativePathLabel = ''; // no label if paths are identical
        }
        else {
            relativePathLabel = extUriLib.relativePath(folder.uri, resource) ?? '';
        }
        // normalize
        if (relativePathLabel) {
            relativePathLabel = pathLib.normalize(relativePathLabel);
        }
        // always show root basename if there are multiple folders
        if (workspace.folders.length > 1 && !relativePathProvider.noPrefix) {
            const rootName = folder.name ? folder.name : extUriLib.basenameOrAuthority(folder.uri);
            relativePathLabel = relativePathLabel ? `${rootName} • ${relativePathLabel}` : rootName;
        }
        return relativePathLabel;
    }
    function normalizeDriveLetter(path, isWindowsOS = platform_1.isWindows) {
        if ((0, extpath_1.hasDriveLetter)(path, isWindowsOS)) {
            return path.charAt(0).toUpperCase() + path.slice(1);
        }
        return path;
    }
    let normalizedUserHomeCached = Object.create(null);
    function tildify(path, userHome, os = platform_1.OS) {
        if (os === 1 /* OperatingSystem.Windows */ || !path || !userHome) {
            return path; // unsupported on Windows
        }
        let normalizedUserHome = normalizedUserHomeCached.original === userHome ? normalizedUserHomeCached.normalized : undefined;
        if (!normalizedUserHome) {
            normalizedUserHome = userHome;
            if (platform_1.isWindows) {
                normalizedUserHome = (0, extpath_1.toSlashes)(normalizedUserHome); // make sure that the path is POSIX normalized on Windows
            }
            normalizedUserHome = `${(0, strings_1.rtrim)(normalizedUserHome, path_1.posix.sep)}${path_1.posix.sep}`;
            normalizedUserHomeCached = { original: userHome, normalized: normalizedUserHome };
        }
        let normalizedPath = path;
        if (platform_1.isWindows) {
            normalizedPath = (0, extpath_1.toSlashes)(normalizedPath); // make sure that the path is POSIX normalized on Windows
        }
        // Linux: case sensitive, macOS: case insensitive
        if (os === 3 /* OperatingSystem.Linux */ ? normalizedPath.startsWith(normalizedUserHome) : (0, strings_1.startsWithIgnoreCase)(normalizedPath, normalizedUserHome)) {
            return `~/${normalizedPath.substr(normalizedUserHome.length)}`;
        }
        return path;
    }
    function untildify(path, userHome) {
        return path.replace(/^~($|\/|\\)/, `${userHome}$1`);
    }
    /**
     * Shortens the paths but keeps them easy to distinguish.
     * Replaces not important parts with ellipsis.
     * Every shorten path matches only one original path and vice versa.
     *
     * Algorithm for shortening paths is as follows:
     * 1. For every path in list, find unique substring of that path.
     * 2. Unique substring along with ellipsis is shortened path of that path.
     * 3. To find unique substring of path, consider every segment of length from 1 to path.length of path from end of string
     *    and if present segment is not substring to any other paths then present segment is unique path,
     *    else check if it is not present as suffix of any other path and present segment is suffix of path itself,
     *    if it is true take present segment as unique path.
     * 4. Apply ellipsis to unique segment according to whether segment is present at start/in-between/end of path.
     *
     * Example 1
     * 1. consider 2 paths i.e. ['a\\b\\c\\d', 'a\\f\\b\\c\\d']
     * 2. find unique path of first path,
     * 	a. 'd' is present in path2 and is suffix of path2, hence not unique of present path.
     * 	b. 'c' is present in path2 and 'c' is not suffix of present path, similarly for 'b' and 'a' also.
     * 	c. 'd\\c' is suffix of path2.
     *  d. 'b\\c' is not suffix of present path.
     *  e. 'a\\b' is not present in path2, hence unique path is 'a\\b...'.
     * 3. for path2, 'f' is not present in path1 hence unique is '...\\f\\...'.
     *
     * Example 2
     * 1. consider 2 paths i.e. ['a\\b', 'a\\b\\c'].
     * 	a. Even if 'b' is present in path2, as 'b' is suffix of path1 and is not suffix of path2, unique path will be '...\\b'.
     * 2. for path2, 'c' is not present in path1 hence unique path is '..\\c'.
     */
    const ellipsis = '\u2026';
    const unc = '\\\\';
    const home = '~';
    function shorten(paths, pathSeparator = path_1.sep) {
        const shortenedPaths = new Array(paths.length);
        // for every path
        let match = false;
        for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
            const originalPath = paths[pathIndex];
            if (originalPath === '') {
                shortenedPaths[pathIndex] = `.${pathSeparator}`;
                continue;
            }
            if (!originalPath) {
                shortenedPaths[pathIndex] = originalPath;
                continue;
            }
            match = true;
            // trim for now and concatenate unc path (e.g. \\network) or root path (/etc, ~/etc) later
            let prefix = '';
            let trimmedPath = originalPath;
            if (trimmedPath.indexOf(unc) === 0) {
                prefix = trimmedPath.substr(0, trimmedPath.indexOf(unc) + unc.length);
                trimmedPath = trimmedPath.substr(trimmedPath.indexOf(unc) + unc.length);
            }
            else if (trimmedPath.indexOf(pathSeparator) === 0) {
                prefix = trimmedPath.substr(0, trimmedPath.indexOf(pathSeparator) + pathSeparator.length);
                trimmedPath = trimmedPath.substr(trimmedPath.indexOf(pathSeparator) + pathSeparator.length);
            }
            else if (trimmedPath.indexOf(home) === 0) {
                prefix = trimmedPath.substr(0, trimmedPath.indexOf(home) + home.length);
                trimmedPath = trimmedPath.substr(trimmedPath.indexOf(home) + home.length);
            }
            // pick the first shortest subpath found
            const segments = trimmedPath.split(pathSeparator);
            for (let subpathLength = 1; match && subpathLength <= segments.length; subpathLength++) {
                for (let start = segments.length - subpathLength; match && start >= 0; start--) {
                    match = false;
                    let subpath = segments.slice(start, start + subpathLength).join(pathSeparator);
                    // that is unique to any other path
                    for (let otherPathIndex = 0; !match && otherPathIndex < paths.length; otherPathIndex++) {
                        // suffix subpath treated specially as we consider no match 'x' and 'x/...'
                        if (otherPathIndex !== pathIndex && paths[otherPathIndex] && paths[otherPathIndex].indexOf(subpath) > -1) {
                            const isSubpathEnding = (start + subpathLength === segments.length);
                            // Adding separator as prefix for subpath, such that 'endsWith(src, trgt)' considers subpath as directory name instead of plain string.
                            // prefix is not added when either subpath is root directory or path[otherPathIndex] does not have multiple directories.
                            const subpathWithSep = (start > 0 && paths[otherPathIndex].indexOf(pathSeparator) > -1) ? pathSeparator + subpath : subpath;
                            const isOtherPathEnding = paths[otherPathIndex].endsWith(subpathWithSep);
                            match = !isSubpathEnding || isOtherPathEnding;
                        }
                    }
                    // found unique subpath
                    if (!match) {
                        let result = '';
                        // preserve disk drive or root prefix
                        if (segments[0].endsWith(':') || prefix !== '') {
                            if (start === 1) {
                                // extend subpath to include disk drive prefix
                                start = 0;
                                subpathLength++;
                                subpath = segments[0] + pathSeparator + subpath;
                            }
                            if (start > 0) {
                                result = segments[0] + pathSeparator;
                            }
                            result = prefix + result;
                        }
                        // add ellipsis at the beginning if needed
                        if (start > 0) {
                            result = result + ellipsis + pathSeparator;
                        }
                        result = result + subpath;
                        // add ellipsis at the end if needed
                        if (start + subpathLength < segments.length) {
                            result = result + pathSeparator + ellipsis;
                        }
                        shortenedPaths[pathIndex] = result;
                    }
                }
            }
            if (match) {
                shortenedPaths[pathIndex] = originalPath; // use original path if no unique subpaths found
            }
        }
        return shortenedPaths;
    }
    var Type;
    (function (Type) {
        Type[Type["TEXT"] = 0] = "TEXT";
        Type[Type["VARIABLE"] = 1] = "VARIABLE";
        Type[Type["SEPARATOR"] = 2] = "SEPARATOR";
    })(Type || (Type = {}));
    /**
     * Helper to insert values for specific template variables into the string. E.g. "this $(is) a $(template)" can be
     * passed to this function together with an object that maps "is" and "template" to strings to have them replaced.
     * @param value string to which template is applied
     * @param values the values of the templates to use
     */
    function template(template, values = Object.create(null)) {
        const segments = [];
        let inVariable = false;
        let curVal = '';
        for (const char of template) {
            // Beginning of variable
            if (char === '$' || (inVariable && char === '{')) {
                if (curVal) {
                    segments.push({ value: curVal, type: Type.TEXT });
                }
                curVal = '';
                inVariable = true;
            }
            // End of variable
            else if (char === '}' && inVariable) {
                const resolved = values[curVal];
                // Variable
                if (typeof resolved === 'string') {
                    if (resolved.length) {
                        segments.push({ value: resolved, type: Type.VARIABLE });
                    }
                }
                // Separator
                else if (resolved) {
                    const prevSegment = segments[segments.length - 1];
                    if (!prevSegment || prevSegment.type !== Type.SEPARATOR) {
                        segments.push({ value: resolved.label, type: Type.SEPARATOR }); // prevent duplicate separators
                    }
                }
                curVal = '';
                inVariable = false;
            }
            // Text or Variable Name
            else {
                curVal += char;
            }
        }
        // Tail
        if (curVal && !inVariable) {
            segments.push({ value: curVal, type: Type.TEXT });
        }
        return segments.filter((segment, index) => {
            // Only keep separator if we have values to the left and right
            if (segment.type === Type.SEPARATOR) {
                const left = segments[index - 1];
                const right = segments[index + 1];
                return [left, right].every(segment => segment && (segment.type === Type.VARIABLE || segment.type === Type.TEXT) && segment.value.length > 0);
            }
            // accept any TEXT and VARIABLE
            return true;
        }).map(segment => segment.value).join('');
    }
    /**
     * Handles mnemonics for menu items. Depending on OS:
     * - Windows: Supported via & character (replace && with &)
     * -   Linux: Supported via & character (replace && with &)
     * -   macOS: Unsupported (replace && with empty string)
     */
    function mnemonicMenuLabel(label, forceDisableMnemonics) {
        if (platform_1.isMacintosh || forceDisableMnemonics) {
            return label.replace(/\(&&\w\)|&&/g, '').replace(/&/g, platform_1.isMacintosh ? '&' : '&&');
        }
        return label.replace(/&&|&/g, m => m === '&' ? '&&' : '&');
    }
    /**
     * Handles mnemonics for buttons. Depending on OS:
     * - Windows: Supported via & character (replace && with & and & with && for escaping)
     * -   Linux: Supported via _ character (replace && with _)
     * -   macOS: Unsupported (replace && with empty string)
     */
    function mnemonicButtonLabel(label, forceDisableMnemonics) {
        if (platform_1.isMacintosh || forceDisableMnemonics) {
            return label.replace(/\(&&\w\)|&&/g, '');
        }
        if (platform_1.isWindows) {
            return label.replace(/&&|&/g, m => m === '&' ? '&&' : '&');
        }
        return label.replace(/&&/g, '_');
    }
    function unmnemonicLabel(label) {
        return label.replace(/&/g, '&&');
    }
    /**
     * Splits a recent label in name and parent path, supporting both '/' and '\' and workspace suffixes.
     * If the location is remote, the remote name is included in the name part.
     */
    function splitRecentLabel(recentLabel) {
        if (recentLabel.endsWith(']')) {
            // label with workspace suffix
            const lastIndexOfSquareBracket = recentLabel.lastIndexOf(' [', recentLabel.length - 2);
            if (lastIndexOfSquareBracket !== -1) {
                const split = splitName(recentLabel.substring(0, lastIndexOfSquareBracket));
                const remoteNameWithSpace = recentLabel.substring(lastIndexOfSquareBracket);
                return { name: split.name + remoteNameWithSpace, parentPath: split.parentPath };
            }
        }
        return splitName(recentLabel);
    }
    function splitName(fullPath) {
        const p = fullPath.indexOf('/') !== -1 ? path_1.posix : path_1.win32;
        const name = p.basename(fullPath);
        const parentPath = p.dirname(fullPath);
        if (name.length) {
            return { name, parentPath };
        }
        // only the root segment
        return { name: parentPath, parentPath: '' };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFiZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9sYWJlbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpRGhHLG9DQTBDQztJQThDRCxvREFNQztJQUdELDBCQTBCQztJQUVELDhCQUVDO0lBa0NELDBCQW9HQztJQXVCRCw0QkErREM7SUFRRCw4Q0FNQztJQVFELGtEQVVDO0lBRUQsMENBRUM7SUFNRCw0Q0FXQztJQWhaRCxTQUFnQixZQUFZLENBQUMsUUFBYSxFQUFFLFVBQWdDO1FBQzNFLE1BQU0sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEdBQUcsVUFBVSxDQUFDO1FBRXBFLDBEQUEwRDtRQUMxRCxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEUsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxZQUFZLENBQUM7WUFDckIsQ0FBQztRQUNGLENBQUM7UUFFRCxxREFBcUQ7UUFDckQscURBQXFEO1FBQ3JELDhDQUE4QztRQUM5QyxJQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ25DLElBQUksRUFBRSxvQ0FBNEIsSUFBSSxDQUFDLG9CQUFTLEVBQUUsQ0FBQztZQUNsRCxZQUFZLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEQsQ0FBQzthQUFNLElBQUksRUFBRSxvQ0FBNEIsSUFBSSxvQkFBUyxFQUFFLENBQUM7WUFDeEQsWUFBWSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFF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