/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/process"], function (require, exports, process) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.delimiter = exports.sep = exports.toNamespacedPath = exports.parse = exports.format = exports.extname = exports.basename = exports.dirname = exports.relative = exports.resolve = exports.join = exports.isAbsolute = exports.normalize = exports.posix = exports.win32 = void 0;
    const CHAR_UPPERCASE_A = 65; /* A */
    const CHAR_LOWERCASE_A = 97; /* a */
    const CHAR_UPPERCASE_Z = 90; /* Z */
    const CHAR_LOWERCASE_Z = 122; /* z */
    const CHAR_DOT = 46; /* . */
    const CHAR_FORWARD_SLASH = 47; /* / */
    const CHAR_BACKWARD_SLASH = 92; /* \ */
    const CHAR_COLON = 58; /* : */
    const CHAR_QUESTION_MARK = 63; /* ? */
    class ErrorInvalidArgType extends Error {
        constructor(name, expected, actual) {
            // determiner: 'must be' or 'must not be'
            let determiner;
            if (typeof expected === 'string' && expected.indexOf('not ') === 0) {
                determiner = 'must not be';
                expected = expected.replace(/^not /, '');
            }
            else {
                determiner = 'must be';
            }
            const type = name.indexOf('.') !== -1 ? 'property' : 'argument';
            let msg = `The "${name}" ${type} ${determiner} of type ${expected}`;
            msg += `. Received type ${typeof actual}`;
            super(msg);
            this.code = 'ERR_INVALID_ARG_TYPE';
        }
    }
    function validateObject(pathObject, name) {
        if (pathObject === null || typeof pathObject !== 'object') {
            throw new ErrorInvalidArgType(name, 'Object', pathObject);
        }
    }
    function validateString(value, name) {
        if (typeof value !== 'string') {
            throw new ErrorInvalidArgType(name, 'string', value);
        }
    }
    const platformIsWin32 = (process.platform === 'win32');
    function isPathSeparator(code) {
        return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    }
    function isPosixPathSeparator(code) {
        return code === CHAR_FORWARD_SLASH;
    }
    function isWindowsDeviceRoot(code) {
        return (code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z) ||
            (code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z);
    }
    // Resolves . and .. elements in a path with directory names
    function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
        let res = '';
        let lastSegmentLength = 0;
        let lastSlash = -1;
        let dots = 0;
        let code = 0;
        for (let i = 0; i <= path.length; ++i) {
            if (i < path.length) {
                code = path.charCodeAt(i);
            }
            else if (isPathSeparator(code)) {
                break;
            }
            else {
                code = CHAR_FORWARD_SLASH;
            }
            if (isPathSeparator(code)) {
                if (lastSlash === i - 1 || dots === 1) {
                    // NOOP
                }
                else if (dots === 2) {
                    if (res.length < 2 || lastSegmentLength !== 2 ||
                        res.charCodeAt(res.length - 1) !== CHAR_DOT ||
                        res.charCodeAt(res.length - 2) !== CHAR_DOT) {
                        if (res.length > 2) {
                            const lastSlashIndex = res.lastIndexOf(separator);
                            if (lastSlashIndex === -1) {
                                res = '';
                                lastSegmentLength = 0;
                            }
                            else {
                                res = res.slice(0, lastSlashIndex);
                                lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                            }
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                        else if (res.length !== 0) {
                            res = '';
                            lastSegmentLength = 0;
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    }
                    if (allowAboveRoot) {
                        res += res.length > 0 ? `${separator}..` : '..';
                        lastSegmentLength = 2;
                    }
                }
                else {
                    if (res.length > 0) {
                        res += `${separator}${path.slice(lastSlash + 1, i)}`;
                    }
                    else {
                        res = path.slice(lastSlash + 1, i);
                    }
                    lastSegmentLength = i - lastSlash - 1;
                }
                lastSlash = i;
                dots = 0;
            }
            else if (code === CHAR_DOT && dots !== -1) {
                ++dots;
            }
            else {
                dots = -1;
            }
        }
        return res;
    }
    function _format(sep, pathObject) {
        validateObject(pathObject, 'pathObject');
        const dir = pathObject.dir || pathObject.root;
        const base = pathObject.base ||
            `${pathObject.name || ''}${pathObject.ext || ''}`;
        if (!dir) {
            return base;
        }
        return dir === pathObject.root ? `${dir}${base}` : `${dir}${sep}${base}`;
    }
    exports.win32 = {
        // path.resolve([from ...], to)
        resolve(...pathSegments) {
            let resolvedDevice = '';
            let resolvedTail = '';
            let resolvedAbsolute = false;
            for (let i = pathSegments.length - 1; i >= -1; i--) {
                let path;
                if (i >= 0) {
                    path = pathSegments[i];
                    validateString(path, 'path');
                    // Skip empty entries
                    if (path.length === 0) {
                        continue;
                    }
                }
                else if (resolvedDevice.length === 0) {
                    path = process.cwd();
                }
                else {
                    // Windows has the concept of drive-specific current working
                    // directories. If we've resolved a drive letter but not yet an
                    // absolute path, get cwd for that drive, or the process cwd if
                    // the drive cwd is not available. We're sure the device is not
                    // a UNC path at this points, because UNC paths are always absolute.
                    path = process.env[`=${resolvedDevice}`] || process.cwd();
                    // Verify that a cwd was found and that it actually points
                    // to our drive. If not, default to the drive's root.
                    if (path === undefined ||
                        (path.slice(0, 2).toLowerCase() !== resolvedDevice.toLowerCase() &&
                            path.charCodeAt(2) === CHAR_BACKWARD_SLASH)) {
                        path = `${resolvedDevice}\\`;
                    }
                }
                const len = path.length;
                let rootEnd = 0;
                let device = '';
                let isAbsolute = false;
                const code = path.charCodeAt(0);
                // Try to match a root
                if (len === 1) {
                    if (isPathSeparator(code)) {
                        // `path` contains just a path separator
                        rootEnd = 1;
                        isAbsolute = true;
                    }
                }
                else if (isPathSeparator(code)) {
                    // Possible UNC root
                    // If we started with a separator, we know we at least have an
                    // absolute path of some kind (UNC or otherwise)
                    isAbsolute = true;
                    if (isPathSeparator(path.charCodeAt(1))) {
                        // Matched double path separator at beginning
                        let j = 2;
                        let last = j;
                        // Match 1 or more non-path separators
                        while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                            j++;
                        }
                        if (j < len && j !== last) {
                            const firstPart = path.slice(last, j);
                            // Matched!
                            last = j;
                            // Match 1 or more path separators
                            while (j < len && isPathSeparator(path.charCodeAt(j))) {
                                j++;
                            }
                            if (j < len && j !== last) {
                                // Matched!
                                last = j;
                                // Match 1 or more non-path separators
                                while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                                    j++;
                                }
                                if (j === len || j !== last) {
                                    // We matched a UNC root
                                    device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                    rootEnd = j;
                                }
                            }
                        }
                    }
                    else {
                        rootEnd = 1;
                    }
                }
                else if (isWindowsDeviceRoot(code) &&
                    path.charCodeAt(1) === CHAR_COLON) {
                    // Possible device root
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2 && isPathSeparator(path.charCodeAt(2))) {
                        // Treat separator following drive name as an absolute path
                        // indicator
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
                if (device.length > 0) {
                    if (resolvedDevice.length > 0) {
                        if (device.toLowerCase() !== resolvedDevice.toLowerCase()) {
                            // This path points to another device so it is not applicable
                            continue;
                        }
                    }
                    else {
                        resolvedDevice = device;
                    }
                }
                if (resolvedAbsolute) {
                    if (resolvedDevice.length > 0) {
                        break;
                    }
                }
                else {
                    resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
                    resolvedAbsolute = isAbsolute;
                    if (isAbsolute && resolvedDevice.length > 0) {
                        break;
                    }
                }
            }
            // At this point the path should be resolved to a full absolute path,
            // but handle relative paths to be safe (might happen when process.cwd()
            // fails)
            // Normalize the tail path
            resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, '\\', isPathSeparator);
            return resolvedAbsolute ?
                `${resolvedDevice}\\${resolvedTail}` :
                `${resolvedDevice}${resolvedTail}` || '.';
        },
        normalize(path) {
            validateString(path, 'path');
            const len = path.length;
            if (len === 0) {
                return '.';
            }
            let rootEnd = 0;
            let device;
            let isAbsolute = false;
            const code = path.charCodeAt(0);
            // Try to match a root
            if (len === 1) {
                // `path` contains just a single char, exit early to avoid
                // unnecessary work
                return isPosixPathSeparator(code) ? '\\' : path;
            }
            if (isPathSeparator(code)) {
                // Possible UNC root
                // If we started with a separator, we know we at least have an absolute
                // path of some kind (UNC or otherwise)
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    // Matched double path separator at beginning
                    let j = 2;
                    let last = j;
                    // Match 1 or more non-path separators
                    while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                        j++;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        // Matched!
                        last = j;
                        // Match 1 or more path separators
                        while (j < len && isPathSeparator(path.charCodeAt(j))) {
                            j++;
                        }
                        if (j < len && j !== last) {
                            // Matched!
                            last = j;
                            // Match 1 or more non-path separators
                            while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                                j++;
                            }
                            if (j === len) {
                                // We matched a UNC root only
                                // Return the normalized version of the UNC root since there
                                // is nothing left to process
                                return `\\\\${firstPart}\\${path.slice(last)}\\`;
                            }
                            if (j !== last) {
                                // We matched a UNC root with leftovers
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                }
                else {
                    rootEnd = 1;
                }
            }
            else if (isWindowsDeviceRoot(code) && path.charCodeAt(1) === CHAR_COLON) {
                // Possible device root
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2 && isPathSeparator(path.charCodeAt(2))) {
                    // Treat separator following drive name as an absolute path
                    // indicator
                    isAbsolute = true;
                    rootEnd = 3;
                }
            }
            let tail = rootEnd < len ?
                normalizeString(path.slice(rootEnd), !isAbsolute, '\\', isPathSeparator) :
                '';
            if (tail.length === 0 && !isAbsolute) {
                tail = '.';
            }
            if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
                tail += '\\';
            }
            if (device === undefined) {
                return isAbsolute ? `\\${tail}` : tail;
            }
            return isAbsolute ? `${device}\\${tail}` : `${device}${tail}`;
        },
        isAbsolute(path) {
            validateString(path, 'path');
            const len = path.length;
            if (len === 0) {
                return false;
            }
            const code = path.charCodeAt(0);
            return isPathSeparator(code) ||
                // Possible device root
                (len > 2 &&
                    isWindowsDeviceRoot(code) &&
                    path.charCodeAt(1) === CHAR_COLON &&
                    isPathSeparator(path.charCodeAt(2)));
        },
        join(...paths) {
            if (paths.length === 0) {
                return '.';
            }
            let joined;
            let firstPart;
            for (let i = 0; i < paths.length; ++i) {
                const arg = paths[i];
                validateString(arg, 'path');
                if (arg.length > 0) {
                    if (joined === undefined) {
                        joined = firstPart = arg;
                    }
                    else {
                        joined += `\\${arg}`;
                    }
                }
            }
            if (joined === undefined) {
                return '.';
            }
            // Make sure that the joined path doesn't start with two slashes, because
            // normalize() will mistake it for a UNC path then.
            //
            // This step is skipped when it is very clear that the user actually
            // intended to point at a UNC path. This is assumed when the first
            // non-empty string arguments starts with exactly two slashes followed by
            // at least one more non-slash character.
            //
            // Note that for normalize() to treat a path as a UNC path it needs to
            // have at least 2 components, so we don't filter for that here.
            // This means that the user can use join to construct UNC paths from
            // a server name and a share name; for example:
            //   path.join('//server', 'share') -> '\\\\server\\share\\')
            let needsReplace = true;
            let slashCount = 0;
            if (typeof firstPart === 'string' && isPathSeparator(firstPart.charCodeAt(0))) {
                ++slashCount;
                const firstLen = firstPart.length;
                if (firstLen > 1 && isPathSeparator(firstPart.charCodeAt(1))) {
                    ++slashCount;
                    if (firstLen > 2) {
                        if (isPathSeparator(firstPart.charCodeAt(2))) {
                            ++slashCount;
                        }
                        else {
                            // We matched a UNC path in the first part
                            needsReplace = false;
                        }
                    }
                }
            }
            if (needsReplace) {
                // Find any more consecutive slashes we need to replace
                while (slashCount < joined.length &&
                    isPathSeparator(joined.charCodeAt(slashCount))) {
                    slashCount++;
                }
                // Replace the slashes if needed
                if (slashCount >= 2) {
                    joined = `\\${joined.slice(slashCount)}`;
                }
            }
            return exports.win32.normalize(joined);
        },
        // It will solve the relative path from `from` to `to`, for instance:
        //  from = 'C:\\orandea\\test\\aaa'
        //  to = 'C:\\orandea\\impl\\bbb'
        // The output of the function should be: '..\\..\\impl\\bbb'
        relative(from, to) {
            validateString(from, 'from');
            validateString(to, 'to');
            if (from === to) {
                return '';
            }
            const fromOrig = exports.win32.resolve(from);
            const toOrig = exports.win32.resolve(to);
            if (fromOrig === toOrig) {
                return '';
            }
            from = fromOrig.toLowerCase();
            to = toOrig.toLowerCase();
            if (from === to) {
                return '';
            }
            // Trim any leading backslashes
            let fromStart = 0;
            while (fromStart < from.length &&
                from.charCodeAt(fromStart) === CHAR_BACKWARD_SLASH) {
                fromStart++;
            }
            // Trim trailing backslashes (applicable to UNC paths only)
            let fromEnd = from.length;
            while (fromEnd - 1 > fromStart &&
                from.charCodeAt(fromEnd - 1) === CHAR_BACKWARD_SLASH) {
                fromEnd--;
            }
            const fromLen = fromEnd - fromStart;
            // Trim any leading backslashes
            let toStart = 0;
            while (toStart < to.length &&
                to.charCodeAt(toStart) === CHAR_BACKWARD_SLASH) {
                toStart++;
            }
            // Trim trailing backslashes (applicable to UNC paths only)
            let toEnd = to.length;
            while (toEnd - 1 > toStart &&
                to.charCodeAt(toEnd - 1) === CHAR_BACKWARD_SLASH) {
                toEnd--;
            }
            const toLen = toEnd - toStart;
            // Compare paths to find the longest common path from root
            const length = fromLen < toLen ? fromLen : toLen;
            let lastCommonSep = -1;
            let i = 0;
            for (; i < length; i++) {
                const fromCode = from.charCodeAt(fromStart + i);
                if (fromCode !== to.charCodeAt(toStart + i)) {
                    break;
                }
                else if (fromCode === CHAR_BACKWARD_SLASH) {
                    lastCommonSep = i;
                }
            }
            // We found a mismatch before the first common path separator was seen, so
            // return the original `to`.
            if (i !== length) {
                if (lastCommonSep === -1) {
                    return toOrig;
                }
            }
            else {
                if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === CHAR_BACKWARD_SLASH) {
                        // We get here if `from` is the exact base path for `to`.
                        // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
                        return toOrig.slice(toStart + i + 1);
                    }
                    if (i === 2) {
                        // We get here if `from` is the device root.
                        // For example: from='C:\\'; to='C:\\foo'
                        return toOrig.slice(toStart + i);
                    }
                }
                if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === CHAR_BACKWARD_SLASH) {
                        // We get here if `to` is the exact base path for `from`.
                        // For example: from='C:\\foo\\bar'; to='C:\\foo'
                        lastCommonSep = i;
                    }
                    else if (i === 2) {
                        // We get here if `to` is the device root.
                        // For example: from='C:\\foo\\bar'; to='C:\\'
                        lastCommonSep = 3;
                    }
                }
                if (lastCommonSep === -1) {
                    lastCommonSep = 0;
                }
            }
            let out = '';
            // Generate the relative path based on the path difference between `to` and
            // `from`
            for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
                if (i === fromEnd || from.charCodeAt(i) === CHAR_BACKWARD_SLASH) {
                    out += out.length === 0 ? '..' : '\\..';
                }
            }
            toStart += lastCommonSep;
            // Lastly, append the rest of the destination (`to`) path that comes after
            // the common path parts
            if (out.length > 0) {
                return `${out}${toOrig.slice(toStart, toEnd)}`;
            }
            if (toOrig.charCodeAt(toStart) === CHAR_BACKWARD_SLASH) {
                ++toStart;
            }
            return toOrig.slice(toStart, toEnd);
        },
        toNamespacedPath(path) {
            // Note: this will *probably* throw somewhere.
            if (typeof path !== 'string' || path.length === 0) {
                return path;
            }
            const resolvedPath = exports.win32.resolve(path);
            if (resolvedPath.length <= 2) {
                return path;
            }
            if (resolvedPath.charCodeAt(0) === CHAR_BACKWARD_SLASH) {
                // Possible UNC root
                if (resolvedPath.charCodeAt(1) === CHAR_BACKWARD_SLASH) {
                    const code = resolvedPath.charCodeAt(2);
                    if (code !== CHAR_QUESTION_MARK && code !== CHAR_DOT) {
                        // Matched non-long UNC root, convert the path to a long UNC path
                        return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                    }
                }
            }
            else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0)) &&
                resolvedPath.charCodeAt(1) === CHAR_COLON &&
                resolvedPath.charCodeAt(2) === CHAR_BACKWARD_SLASH) {
                // Matched device root, convert the path to a long UNC path
                return `\\\\?\\${resolvedPath}`;
            }
            return path;
        },
        dirname(path) {
            validateString(path, 'path');
            const len = path.length;
            if (len === 0) {
                return '.';
            }
            let rootEnd = -1;
            let offset = 0;
            const code = path.charCodeAt(0);
            if (len === 1) {
                // `path` contains just a path separator, exit early to avoid
                // unnecessary work or a dot.
                return isPathSeparator(code) ? path : '.';
            }
            // Try to match a root
            if (isPathSeparator(code)) {
                // Possible UNC root
                rootEnd = offset = 1;
                if (isPathSeparator(path.charCodeAt(1))) {
                    // Matched double path separator at beginning
                    let j = 2;
                    let last = j;
                    // Match 1 or more non-path separators
                    while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                        j++;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more path separators
                        while (j < len && isPathSeparator(path.charCodeAt(j))) {
                            j++;
                        }
                        if (j < len && j !== last) {
                            // Matched!
                            last = j;
                            // Match 1 or more non-path separators
                            while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                                j++;
                            }
                            if (j === len) {
                                // We matched a UNC root only
                                return path;
                            }
                            if (j !== last) {
                                // We matched a UNC root with leftovers
                                // Offset by 1 to include the separator after the UNC root to
                                // treat it as a "normal root" on top of a (UNC) root
                                rootEnd = offset = j + 1;
                            }
                        }
                    }
                }
                // Possible device root
            }
            else if (isWindowsDeviceRoot(code) && path.charCodeAt(1) === CHAR_COLON) {
                rootEnd = len > 2 && isPathSeparator(path.charCodeAt(2)) ? 3 : 2;
                offset = rootEnd;
            }
            let end = -1;
            let matchedSlash = true;
            for (let i = len - 1; i >= offset; --i) {
                if (isPathSeparator(path.charCodeAt(i))) {
                    if (!matchedSlash) {
                        end = i;
                        break;
                    }
                }
                else {
                    // We saw the first non-path separator
                    matchedSlash = false;
                }
            }
            if (end === -1) {
                if (rootEnd === -1) {
                    return '.';
                }
                end = rootEnd;
            }
            return path.slice(0, end);
        },
        basename(path, ext) {
            if (ext !== undefined) {
                validateString(ext, 'ext');
            }
            validateString(path, 'path');
            let start = 0;
            let end = -1;
            let matchedSlash = true;
            let i;
            // Check for a drive letter prefix so as not to mistake the following
            // path separator as an extra separator at the end of the path that can be
            // disregarded
            if (path.length >= 2 &&
                isWindowsDeviceRoot(path.charCodeAt(0)) &&
                path.charCodeAt(1) === CHAR_COLON) {
                start = 2;
            }
            if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
                if (ext === path) {
                    return '';
                }
                let extIdx = ext.length - 1;
                let firstNonSlashEnd = -1;
                for (i = path.length - 1; i >= start; --i) {
                    const code = path.charCodeAt(i);
                    if (isPathSeparator(code)) {
                        // If we reached a path separator that was not part of a set of path
                        // separators at the end of the string, stop now
                        if (!matchedSlash) {
                            start = i + 1;
                            break;
                        }
                    }
                    else {
                        if (firstNonSlashEnd === -1) {
                            // We saw the first non-path separator, remember this index in case
                            // we need it if the extension ends up not matching
                            matchedSlash = false;
                            firstNonSlashEnd = i + 1;
                        }
                        if (extIdx >= 0) {
                            // Try to match the explicit extension
                            if (code === ext.charCodeAt(extIdx)) {
                                if (--extIdx === -1) {
                                    // We matched the extension, so mark this as the end of our path
                                    // component
                                    end = i;
                                }
                            }
                            else {
                                // Extension does not match, so our result is the entire path
                                // component
                                extIdx = -1;
                                end = firstNonSlashEnd;
                            }
                        }
                    }
                }
                if (start === end) {
                    end = firstNonSlashEnd;
                }
                else if (end === -1) {
                    end = path.length;
                }
                return path.slice(start, end);
            }
            for (i = path.length - 1; i >= start; --i) {
                if (isPathSeparator(path.charCodeAt(i))) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // path component
                    matchedSlash = false;
                    end = i + 1;
                }
            }
            if (end === -1) {
                return '';
            }
            return path.slice(start, end);
        },
        extname(path) {
            validateString(path, 'path');
            let start = 0;
            let startDot = -1;
            let startPart = 0;
            let end = -1;
            let matchedSlash = true;
            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            let preDotState = 0;
            // Check for a drive letter prefix so as not to mistake the following
            // path separator as an extra separator at the end of the path that can be
            // disregarded
            if (path.length >= 2 &&
                path.charCodeAt(1) === CHAR_COLON &&
                isWindowsDeviceRoot(path.charCodeAt(0))) {
                start = startPart = 2;
            }
            for (let i = path.length - 1; i >= start; --i) {
                const code = path.charCodeAt(i);
                if (isPathSeparator(code)) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT) {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1) {
                        startDot = i;
                    }
                    else if (preDotState !== 1) {
                        preDotState = 1;
                    }
                }
                else if (startDot !== -1) {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }
            if (startDot === -1 ||
                end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1)) {
                return '';
            }
            return path.slice(startDot, end);
        },
        format: _format.bind(null, '\\'),
        parse(path) {
            validateString(path, 'path');
            const ret = { root: '', dir: '', base: '', ext: '', name: '' };
            if (path.length === 0) {
                return ret;
            }
            const len = path.length;
            let rootEnd = 0;
            let code = path.charCodeAt(0);
            if (len === 1) {
                if (isPathSeparator(code)) {
                    // `path` contains just a path separator, exit early to avoid
                    // unnecessary work
                    ret.root = ret.dir = path;
                    return ret;
                }
                ret.base = ret.name = path;
                return ret;
            }
            // Try to match a root
            if (isPathSeparator(code)) {
                // Possible UNC root
                rootEnd = 1;
                if (isPathSeparator(path.charCodeAt(1))) {
                    // Matched double path separator at beginning
                    let j = 2;
                    let last = j;
                    // Match 1 or more non-path separators
                    while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                        j++;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more path separators
                        while (j < len && isPathSeparator(path.charCodeAt(j))) {
                            j++;
                        }
                        if (j < len && j !== last) {
                            // Matched!
                            last = j;
                            // Match 1 or more non-path separators
                            while (j < len && !isPathSeparator(path.charCodeAt(j))) {
                                j++;
                            }
                            if (j === len) {
                                // We matched a UNC root only
                                rootEnd = j;
                            }
                            else if (j !== last) {
                                // We matched a UNC root with leftovers
                                rootEnd = j + 1;
                            }
                        }
                    }
                }
            }
            else if (isWindowsDeviceRoot(code) && path.charCodeAt(1) === CHAR_COLON) {
                // Possible device root
                if (len <= 2) {
                    // `path` contains just a drive root, exit early to avoid
                    // unnecessary work
                    ret.root = ret.dir = path;
                    return ret;
                }
                rootEnd = 2;
                if (isPathSeparator(path.charCodeAt(2))) {
                    if (len === 3) {
                        // `path` contains just a drive root, exit early to avoid
                        // unnecessary work
                        ret.root = ret.dir = path;
                        return ret;
                    }
                    rootEnd = 3;
                }
            }
            if (rootEnd > 0) {
                ret.root = path.slice(0, rootEnd);
            }
            let startDot = -1;
            let startPart = rootEnd;
            let end = -1;
            let matchedSlash = true;
            let i = path.length - 1;
            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            let preDotState = 0;
            // Get non-dir info
            for (; i >= rootEnd; --i) {
                code = path.charCodeAt(i);
                if (isPathSeparator(code)) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT) {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1) {
                        startDot = i;
                    }
                    else if (preDotState !== 1) {
                        preDotState = 1;
                    }
                }
                else if (startDot !== -1) {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }
            if (end !== -1) {
                if (startDot === -1 ||
                    // We saw a non-dot character immediately before the dot
                    preDotState === 0 ||
                    // The (right-most) trimmed path component is exactly '..'
                    (preDotState === 1 &&
                        startDot === end - 1 &&
                        startDot === startPart + 1)) {
                    ret.base = ret.name = path.slice(startPart, end);
                }
                else {
                    ret.name = path.slice(startPart, startDot);
                    ret.base = path.slice(startPart, end);
                    ret.ext = path.slice(startDot, end);
                }
            }
            // If the directory is the root, use the entire root as the `dir` including
            // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
            // trailing slash (`C:\abc\def` -> `C:\abc`).
            if (startPart > 0 && startPart !== rootEnd) {
                ret.dir = path.slice(0, startPart - 1);
            }
            else {
                ret.dir = ret.root;
            }
            return ret;
        },
        sep: '\\',
        delimiter: ';',
        win32: null,
        posix: null
    };
    const posixCwd = (() => {
        if (platformIsWin32) {
            // Converts Windows' backslash path separators to POSIX forward slashes
            // and truncates any drive indicator
            const regexp = /\\/g;
            return () => {
                const cwd = process.cwd().replace(regexp, '/');
                return cwd.slice(cwd.indexOf('/'));
            };
        }
        // We're already on POSIX, no need for any transformations
        return () => process.cwd();
    })();
    exports.posix = {
        // path.resolve([from ...], to)
        resolve(...pathSegments) {
            let resolvedPath = '';
            let resolvedAbsolute = false;
            for (let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                const path = i >= 0 ? pathSegments[i] : posixCwd();
                validateString(path, 'path');
                // Skip empty entries
                if (path.length === 0) {
                    continue;
                }
                resolvedPath = `${path}/${resolvedPath}`;
                resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            }
            // At this point the path should be resolved to a full absolute path, but
            // handle relative paths to be safe (might happen when process.cwd() fails)
            // Normalize the path
            resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, '/', isPosixPathSeparator);
            if (resolvedAbsolute) {
                return `/${resolvedPath}`;
            }
            return resolvedPath.length > 0 ? resolvedPath : '.';
        },
        normalize(path) {
            validateString(path, 'path');
            if (path.length === 0) {
                return '.';
            }
            const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            const trailingSeparator = path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;
            // Normalize the path
            path = normalizeString(path, !isAbsolute, '/', isPosixPathSeparator);
            if (path.length === 0) {
                if (isAbsolute) {
                    return '/';
                }
                return trailingSeparator ? './' : '.';
            }
            if (trailingSeparator) {
                path += '/';
            }
            return isAbsolute ? `/${path}` : path;
        },
        isAbsolute(path) {
            validateString(path, 'path');
            return path.length > 0 && path.charCodeAt(0) === CHAR_FORWARD_SLASH;
        },
        join(...paths) {
            if (paths.length === 0) {
                return '.';
            }
            let joined;
            for (let i = 0; i < paths.length; ++i) {
                const arg = paths[i];
                validateString(arg, 'path');
                if (arg.length > 0) {
                    if (joined === undefined) {
                        joined = arg;
                    }
                    else {
                        joined += `/${arg}`;
                    }
                }
            }
            if (joined === undefined) {
                return '.';
            }
            return exports.posix.normalize(joined);
        },
        relative(from, to) {
            validateString(from, 'from');
            validateString(to, 'to');
            if (from === to) {
                return '';
            }
            // Trim leading forward slashes.
            from = exports.posix.resolve(from);
            to = exports.posix.resolve(to);
            if (from === to) {
                return '';
            }
            const fromStart = 1;
            const fromEnd = from.length;
            const fromLen = fromEnd - fromStart;
            const toStart = 1;
            const toLen = to.length - toStart;
            // Compare paths to find the longest common path from root
            const length = (fromLen < toLen ? fromLen : toLen);
            let lastCommonSep = -1;
            let i = 0;
            for (; i < length; i++) {
                const fromCode = from.charCodeAt(fromStart + i);
                if (fromCode !== to.charCodeAt(toStart + i)) {
                    break;
                }
                else if (fromCode === CHAR_FORWARD_SLASH) {
                    lastCommonSep = i;
                }
            }
            if (i === length) {
                if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === CHAR_FORWARD_SLASH) {
                        // We get here if `from` is the exact base path for `to`.
                        // For example: from='/foo/bar'; to='/foo/bar/baz'
                        return to.slice(toStart + i + 1);
                    }
                    if (i === 0) {
                        // We get here if `from` is the root
                        // For example: from='/'; to='/foo'
                        return to.slice(toStart + i);
                    }
                }
                else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === CHAR_FORWARD_SLASH) {
                        // We get here if `to` is the exact base path for `from`.
                        // For example: from='/foo/bar/baz'; to='/foo/bar'
                        lastCommonSep = i;
                    }
                    else if (i === 0) {
                        // We get here if `to` is the root.
                        // For example: from='/foo/bar'; to='/'
                        lastCommonSep = 0;
                    }
                }
            }
            let out = '';
            // Generate the relative path based on the path difference between `to`
            // and `from`.
            for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
                if (i === fromEnd || from.charCodeAt(i) === CHAR_FORWARD_SLASH) {
                    out += out.length === 0 ? '..' : '/..';
                }
            }
            // Lastly, append the rest of the destination (`to`) path that comes after
            // the common path parts.
            return `${out}${to.slice(toStart + lastCommonSep)}`;
        },
        toNamespacedPath(path) {
            // Non-op on posix systems
            return path;
        },
        dirname(path) {
            validateString(path, 'path');
            if (path.length === 0) {
                return '.';
            }
            const hasRoot = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            let end = -1;
            let matchedSlash = true;
            for (let i = path.length - 1; i >= 1; --i) {
                if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
                    if (!matchedSlash) {
                        end = i;
                        break;
                    }
                }
                else {
                    // We saw the first non-path separator
                    matchedSlash = false;
                }
            }
            if (end === -1) {
                return hasRoot ? '/' : '.';
            }
            if (hasRoot && end === 1) {
                return '//';
            }
            return path.slice(0, end);
        },
        basename(path, ext) {
            if (ext !== undefined) {
                validateString(ext, 'ext');
            }
            validateString(path, 'path');
            let start = 0;
            let end = -1;
            let matchedSlash = true;
            let i;
            if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
                if (ext === path) {
                    return '';
                }
                let extIdx = ext.length - 1;
                let firstNonSlashEnd = -1;
                for (i = path.length - 1; i >= 0; --i) {
                    const code = path.charCodeAt(i);
                    if (code === CHAR_FORWARD_SLASH) {
                        // If we reached a path separator that was not part of a set of path
                        // separators at the end of the string, stop now
                        if (!matchedSlash) {
                            start = i + 1;
                            break;
                        }
                    }
                    else {
                        if (firstNonSlashEnd === -1) {
                            // We saw the first non-path separator, remember this index in case
                            // we need it if the extension ends up not matching
                            matchedSlash = false;
                            firstNonSlashEnd = i + 1;
                        }
                        if (extIdx >= 0) {
                            // Try to match the explicit extension
                            if (code === ext.charCodeAt(extIdx)) {
                                if (--extIdx === -1) {
                                    // We matched the extension, so mark this as the end of our path
                                    // component
                                    end = i;
                                }
                            }
                            else {
                                // Extension does not match, so our result is the entire path
                                // component
                                extIdx = -1;
                                end = firstNonSlashEnd;
                            }
                        }
                    }
                }
                if (start === end) {
                    end = firstNonSlashEnd;
                }
                else if (end === -1) {
                    end = path.length;
                }
                return path.slice(start, end);
            }
            for (i = path.length - 1; i >= 0; --i) {
                if (path.charCodeAt(i) === CHAR_FORWARD_SLASH) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                }
                else if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // path component
                    matchedSlash = false;
                    end = i + 1;
                }
            }
            if (end === -1) {
                return '';
            }
            return path.slice(start, end);
        },
        extname(path) {
            validateString(path, 'path');
            let startDot = -1;
            let startPart = 0;
            let end = -1;
            let matchedSlash = true;
            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            let preDotState = 0;
            for (let i = path.length - 1; i >= 0; --i) {
                const code = path.charCodeAt(i);
                if (code === CHAR_FORWARD_SLASH) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT) {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1) {
                        startDot = i;
                    }
                    else if (preDotState !== 1) {
                        preDotState = 1;
                    }
                }
                else if (startDot !== -1) {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }
            if (startDot === -1 ||
                end === -1 ||
                // We saw a non-dot character immediately before the dot
                preDotState === 0 ||
                // The (right-most) trimmed path component is exactly '..'
                (preDotState === 1 &&
                    startDot === end - 1 &&
                    startDot === startPart + 1)) {
                return '';
            }
            return path.slice(startDot, end);
        },
        format: _format.bind(null, '/'),
        parse(path) {
            validateString(path, 'path');
            const ret = { root: '', dir: '', base: '', ext: '', name: '' };
            if (path.length === 0) {
                return ret;
            }
            const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
            let start;
            if (isAbsolute) {
                ret.root = '/';
                start = 1;
            }
            else {
                start = 0;
            }
            let startDot = -1;
            let startPart = 0;
            let end = -1;
            let matchedSlash = true;
            let i = path.length - 1;
            // Track the state of characters (if any) we see before our first dot and
            // after any path separator we find
            let preDotState = 0;
            // Get non-dir info
            for (; i >= start; --i) {
                const code = path.charCodeAt(i);
                if (code === CHAR_FORWARD_SLASH) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        startPart = i + 1;
                        break;
                    }
                    continue;
                }
                if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // extension
                    matchedSlash = false;
                    end = i + 1;
                }
                if (code === CHAR_DOT) {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1) {
                        startDot = i;
                    }
                    else if (preDotState !== 1) {
                        preDotState = 1;
                    }
                }
                else if (startDot !== -1) {
                    // We saw a non-dot and non-path separator before our dot, so we should
                    // have a good chance at having a non-empty extension
                    preDotState = -1;
                }
            }
            if (end !== -1) {
                const start = startPart === 0 && isAbsolute ? 1 : startPart;
                if (startDot === -1 ||
                    // We saw a non-dot character immediately before the dot
                    preDotState === 0 ||
                    // The (right-most) trimmed path component is exactly '..'
                    (preDotState === 1 &&
                        startDot === end - 1 &&
                        startDot === startPart + 1)) {
                    ret.base = ret.name = path.slice(start, end);
                }
                else {
                    ret.name = path.slice(start, startDot);
                    ret.base = path.slice(start, end);
                    ret.ext = path.slice(startDot, end);
                }
            }
            if (startPart > 0) {
                ret.dir = path.slice(0, startPart - 1);
            }
            else if (isAbsolute) {
                ret.dir = '/';
            }
            return ret;
        },
        sep: '/',
        delimiter: ':',
        win32: null,
        posix: null
    };
    exports.posix.win32 = exports.win32.win32 = exports.win32;
    exports.posix.posix = exports.win32.posix = exports.posix;
    exports.normalize = (platformIsWin32 ? exports.win32.normalize : exports.posix.normalize);
    exports.isAbsolute = (platformIsWin32 ? exports.win32.isAbsolute : exports.posix.isAbsolute);
    exports.join = (platformIsWin32 ? exports.win32.join : exports.posix.join);
    exports.resolve = (platformIsWin32 ? exports.win32.resolve : exports.posix.resolve);
    exports.relative = (platformIsWin32 ? exports.win32.relative : exports.posix.relative);
    exports.dirname = (platformIsWin32 ? exports.win32.dirname : exports.posix.dirname);
    exports.basename = (platformIsWin32 ? exports.win32.basename : exports.posix.basename);
    exports.extname = (platformIsWin32 ? exports.win32.extname : exports.posix.extname);
    exports.format = (platformIsWin32 ? exports.win32.format : exports.posix.format);
    exports.parse = (platformIsWin32 ? exports.win32.parse : exports.posix.parse);
    exports.toNamespacedPath = (platformIsWin32 ? exports.win32.toNamespacedPath : exports.posix.toNamespacedPath);
    exports.sep = (platformIsWin32 ? exports.win32.sep : exports.posix.sep);
    exports.delimiter = (platformIsWin32 ? exports.win32.delimiter : exports.posix.delimiter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vcGF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4QmhHLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLENBQUEsT0FBTztJQUNuQyxNQUFNLGdCQUFnQixHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU87SUFDcEMsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPO0lBQ3BDLE1BQU0sZ0JBQWdCLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTztJQUNyQyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPO0lBQzVCLE1BQU0sa0JBQWtCLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTztJQUN0QyxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU87SUFDdkMsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTztJQUM5QixNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU87SUFFdEMsTUFBTSxtQkFBb0IsU0FBUSxLQUFLO1FBRXRDLFlBQVksSUFBWSxFQUFFLFFBQWdCLEVBQUUsTUFBZTtZQUMxRCx5Q0FBeUM7WUFDekMsSUFBSSxVQUFVLENBQUM7WUFDZixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNwRSxVQUFVLEdBQUcsYUFBYSxDQUFDO2dCQUMzQixRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDeEIsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO1lBQ2hFLElBQUksR0FBRyxHQUFHLFFBQVEsSUFBSSxLQUFLLElBQUksSUFBSSxVQUFVLFlBQVksUUFBUSxFQUFFLENBQUM7WUFFcEUsR0FBRyxJQUFJLG1CQUFtQixPQUFPLE1BQU0sRUFBRSxDQUFDO1lBQzFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVYLElBQUksQ0FBQyxJQUFJLEdBQUcsc0JBQXNCLENBQUM7UUFDcEMsQ0FBQztLQUNEO0lBRUQsU0FBUyxjQUFjLENBQUMsVUFBa0IsRUFBRSxJQUFZO1FBQ3ZELElBQUksVUFBVSxLQUFLLElBQUksSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMzRCxNQUFNLElBQUksbUJBQW1CLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMzRCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLEtBQWEsRUFBRSxJQUFZO1FBQ2xELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDL0IsTUFBTSxJQUFJLG1CQUFtQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEQsQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLGVBQWUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDLENBQUM7SUFFdkQsU0FBUyxlQUFlLENBQUMsSUFBd0I7UUFDaEQsT0FBTyxJQUFJLEtBQUssa0JBQWtCLElBQUksSUFBSSxLQUFLLG1CQUFtQixDQUFDO0lBQ3BFLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLElBQXdCO1FBQ3JELE9BQU8sSUFBSSxLQUFLLGtCQUFrQixDQUFDO0lBQ3BDLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUFDLElBQVk7UUFDeEMsT0FBTyxDQUFDLElBQUksSUFBSSxnQkFBZ0IsSUFBSSxJQUFJLElBQUksZ0JBQWdCLENBQUM7WUFDNUQsQ0FBQyxJQUFJLElBQUksZ0JBQWdCLElBQUksSUFBSSxJQUFJLGdCQUFnQixDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELDREQUE0RDtJQUM1RCxTQUFTLGVBQWUsQ0FBQyxJQUFZLEVBQUUsY0FBdUIsRUFBRSxTQUFpQixFQUFFLGVBQTJDO1FBQzdILElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25CLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNiLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyQixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixDQUFDO2lCQUNJLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU07WUFDUCxDQUFDO2lCQUNJLENBQUM7Z0JBQ0wsSUFBSSxHQUFHLGtCQUFrQixDQUFDO1lBQzNCLENBQUM7WUFFRCxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMzQixJQUFJLFNBQVMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDdkMsT0FBTztnQkFDUixDQUFDO3FCQUFNLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN2QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLGlCQUFpQixLQUFLLENBQUM7d0JBQzVDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxRQUFRO3dCQUMzQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQzlDLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDcEIsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQzs0QkFDbEQsSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQ0FDM0IsR0FBRyxHQUFHLEVBQUUsQ0FBQztnQ0FDVCxpQkFBaUIsR0FBRyxDQUFDLENBQUM7NEJBQ3ZCLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0NBQ25DLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7NEJBQ2pFLENBQUM7NEJBQ0QsU0FBUyxHQUFHLENBQUMsQ0FBQzs0QkFDZCxJQUFJLEdBQUcsQ0FBQyxDQUFDOzRCQUNULFNBQVM7d0JBQ1YsQ0FBQzs2QkFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7NEJBQzdCLEdBQUcsR0FBRyxFQUFFLENBQUM7NEJBQ1QsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDOzRCQUN0QixTQUFTLEdBQUcsQ0FBQyxDQUFDOzRCQUNkLElBQUksR0FBRyxDQUFDLENBQUM7NEJBQ1QsU0FBUzt3QkFDVixDQUFDO29CQUNGLENBQUM7b0JBQ0QsSUFBSSxjQUFjLEVBQUUsQ0FBQzt3QkFDcEIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7d0JBQ2hELGlCQUFpQixHQUFHLENBQUMsQ0FBQztvQkFDdkIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNwQixHQUFHLElBQUksR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3RELENBQUM7eUJBQ0ksQ0FBQzt3QkFDTCxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxDQUFDO29CQUNELGlCQUFpQixHQUFHLENBQUMsR0FBRyxTQUFTLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELFNBQVMsR0FBRyxDQUFDLENBQUM7Z0JBQ2QsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNWLENBQUM7aUJBQU0sSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM3QyxFQUFFLElBQUksQ0FBQztZQUNSLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQztJQUVELFNBQVMsT0FBTyxDQUFDLEdBQVcsRUFBRSxVQUFzQjtRQUNuRCxjQUFjLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQztRQUM5QyxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSTtZQUMzQixHQUFHLFVBQVUsQ0FBQyxJQUFJLElBQUksRUFBRSxHQUFHLFVBQVUsQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLENBQUM7UUFDbkQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1YsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsT0FBTyxHQUFHLEtBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQztJQUMxRSxDQUFDO0lBNEJZLFFBQUEsS0FBSyxHQUFVO1FBQzNCLCtCQUErQjtRQUMvQixPQUFPLENBQUMsR0FBRyxZQUFzQjtZQUNoQyxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7WUFDeEIsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLElBQUksZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1lBRTdCLEtBQUssSUFBSSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BELElBQUksSUFBSSxDQUFDO2dCQUNULElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNaLElBQUksR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZCLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7b0JBRTdCLHFCQUFxQjtvQkFDckIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN2QixTQUFTO29CQUNWLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3hDLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3RCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCw0REFBNEQ7b0JBQzVELCtEQUErRDtvQkFDL0QsK0RBQStEO29CQUMvRCwrREFBK0Q7b0JBQy9ELG9FQUFvRTtvQkFDcEUsSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFFMUQsMERBQTBEO29CQUMxRCxxREFBcUQ7b0JBQ3JELElBQUksSUFBSSxLQUFLLFNBQVM7d0JBQ3JCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssY0FBYyxDQUFDLFdBQVcsRUFBRTs0QkFDL0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7d0JBQy9DLElBQUksR0FBRyxHQUFHLGNBQWMsSUFBSSxDQUFDO29CQUM5QixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDeEIsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztnQkFDdkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFaEMsc0JBQXNCO2dCQUN0QixJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDZixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUMzQix3Q0FBd0M7d0JBQ3hDLE9BQU8sR0FBRyxDQUFDLENBQUM7d0JBQ1osVUFBVSxHQUFHLElBQUksQ0FBQztvQkFDbkIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ2xDLG9CQUFvQjtvQkFFcEIsOERBQThEO29CQUM5RCxnREFBZ0Q7b0JBQ2hELFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBRWxCLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN6Qyw2Q0FBNkM7d0JBQzdDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDVixJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7d0JBQ2Isc0NBQXNDO3dCQUN0QyxPQUFPLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ3hELENBQUMsRUFBRSxDQUFDO3dCQUNMLENBQUM7d0JBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQzs0QkFDM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQ3RDLFdBQVc7NEJBQ1gsSUFBSSxHQUFHLENBQUMsQ0FBQzs0QkFDVCxrQ0FBa0M7NEJBQ2xDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0NBQ3ZELENBQUMsRUFBRSxDQUFDOzRCQUNMLENBQUM7NEJBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQ0FDM0IsV0FBVztnQ0FDWCxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dDQUNULHNDQUFzQztnQ0FDdEMsT0FBTyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29DQUN4RCxDQUFDLEVBQUUsQ0FBQztnQ0FDTCxDQUFDO2dDQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0NBQzdCLHdCQUF3QjtvQ0FDeEIsTUFBTSxHQUFHLE9BQU8sU0FBUyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7b0NBQ3BELE9BQU8sR0FBRyxDQUFDLENBQUM7Z0NBQ2IsQ0FBQzs0QkFDRixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sR0FBRyxDQUFDLENBQUM7b0JBQ2IsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDO29CQUNuQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVUsRUFBRSxDQUFDO29CQUNwQyx1QkFBdUI7b0JBQ3ZCLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDMUIsT0FBTyxHQUFHLENBQUMsQ0FBQztvQkFDWixJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNwRCwyREFBMkQ7d0JBQzNELFlBQVk7d0JBQ1osVUFBVSxHQUFHLElBQUksQ0FBQzt3QkFDbEIsT0FBTyxHQUFHLENBQUMsQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN2QixJQUFJLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQy9CLElBQUksTUFBTSxDQUFDLFdBQVcsRUFBRSxLQUFLLGNBQWMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDOzRCQUMzRCw2REFBNkQ7NEJBQzdELFNBQVM7d0JBQ1YsQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsY0FBYyxHQUFHLE1BQU0sQ0FBQztvQkFDekIsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdEIsSUFBSSxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUMvQixNQUFNO29CQUNQLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssWUFBWSxFQUFFLENBQUM7b0JBQ3pELGdCQUFnQixHQUFHLFVBQVUsQ0FBQztvQkFDOUIsSUFBSSxVQUFVLElBQUksY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDN0MsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQscUVBQXFFO1lBQ3JFLHdFQUF3RTtZQUN4RSxTQUFTO1lBRVQsMEJBQTBCO1lBQzFCLFlBQVksR0FBRyxlQUFlLENBQUMsWUFBWSxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUNuRSxlQUFlLENBQUMsQ0FBQztZQUVsQixPQUFPLGdCQUFnQixDQUFDLENBQUM7Z0JBQ3hCLEdBQUcsY0FBYyxLQUFLLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ3RDLEdBQUcsY0FBYyxHQUFHLFlBQVksRUFBRSxJQUFJLEdBQUcsQ0FBQztRQUM1QyxDQUFDO1FBRUQsU0FBUyxDQUFDLElBQVk7WUFDckIsY0FBYyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3hCLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNmLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUNELElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNoQixJQUFJLE1BQU0sQ0FBQztZQUNYLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN2QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWhDLHNCQUFzQjtZQUN0QixJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDZiwwREFBMEQ7Z0JBQzFELG1CQUFtQjtnQkFDbkIsT0FBTyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDakQsQ0FBQztZQUNELElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLG9CQUFvQjtnQkFFcEIsdUVBQXVFO2dCQUN2RSx1Q0FBdUM7Z0JBQ3ZDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBRWxCLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN6Qyw2Q0FBNkM7b0JBQzdDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDVixJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7b0JBQ2Isc0NBQXNDO29CQUN0QyxPQUFPLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3hELENBQUMsRUFBRSxDQUFDO29CQUNMLENBQUM7b0JBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDM0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7d0JBQ3RDLFdBQVc7d0JBQ1gsSUFBSSxHQUFHLENBQUMsQ0FBQzt3QkFDVCxrQ0FBa0M7d0JBQ2xDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ3ZELENBQUMsRUFBRSxDQUFDO3dCQUNMLENBQUM7d0JBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQzs0QkFDM0IsV0FBVzs0QkFDWCxJQUFJLEdBQUcsQ0FBQyxDQUFDOzRCQUNULHNDQUFzQzs0QkFDdEMsT0FBTyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dDQUN4RCxDQUFDLEVBQUUsQ0FBQzs0QkFDTCxDQUFDOzRCQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dDQUNmLDZCQUE2QjtnQ0FDN0IsNERBQTREO2dDQUM1RCw2QkFBNkI7Z0NBQzdCLE9BQU8sT0FBTyxTQUFTLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDOzRCQUNsRCxDQUFDOzRCQUNELElBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO2dDQUNoQix1Q0FBdUM7Z0NBQ3ZDLE1BQU0sR0FBRyxPQUFPLFNBQVMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO2dDQUNwRCxPQUFPLEdBQUcsQ0FBQyxDQUFDOzRCQUNiLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDM0UsdUJBQXVCO2dCQUN2QixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQ1osSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDcEQsMkRBQTJEO29CQUMzRCxZQUFZO29CQUNaLFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBQ2xCLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ3pCLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxFQUFFLENBQUM7WUFDSixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksR0FBRyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNsRSxJQUFJLElBQUksSUFBSSxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3hDLENBQUM7WUFDRCxPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDO1FBQy9ELENBQUM7UUFFRCxVQUFVLENBQUMsSUFBWTtZQUN0QixjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDeEIsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQyxPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUM7Z0JBQzNCLHVCQUF1QjtnQkFDdkIsQ0FBQyxHQUFHLEdBQUcsQ0FBQztvQkFDUCxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssVUFBVTtvQkFDakMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFRCxJQUFJLENBQUMsR0FBRyxLQUFlO1lBQ3RCLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUM7WUFDWCxJQUFJLFNBQTZCLENBQUM7WUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixjQUFjLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM1QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3BCLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUMxQixNQUFNLEdBQUcsU0FBUyxHQUFHLEdBQUcsQ0FBQztvQkFDMUIsQ0FBQzt5QkFDSSxDQUFDO3dCQUNMLE1BQU0sSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO29CQUN0QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUVELHlFQUF5RTtZQUN6RSxtREFBbUQ7WUFDbkQsRUFBRTtZQUNGLG9FQUFvRTtZQUNwRSxrRUFBa0U7WUFDbEUseUVBQXlFO1lBQ3pFLHlDQUF5QztZQUN6QyxFQUFFO1lBQ0Ysc0VBQXNFO1lBQ3RFLGdFQUFnRTtZQUNoRSxvRUFBb0U7WUFDcEUsK0NBQStDO1lBQy9DLDZEQUE2RDtZQUM3RCxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDL0UsRUFBRSxVQUFVLENBQUM7Z0JBQ2IsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztnQkFDbEMsSUFBSSxRQUFRLEdBQUcsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDOUQsRUFBRSxVQUFVLENBQUM7b0JBQ2IsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ2xCLElBQUksZUFBZSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUM5QyxFQUFFLFVBQVUsQ0FBQzt3QkFDZCxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsMENBQTBDOzRCQUMxQyxZQUFZLEdBQUcsS0FBSyxDQUFDO3dCQUN0QixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNsQix1REFBdUQ7Z0JBQ3ZELE9BQU8sVUFBVSxHQUFHLE1BQU0sQ0FBQyxNQUFNO29CQUNoQyxlQUFlLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2pELFVBQVUsRUFBRSxDQUFDO2dCQUNkLENBQUM7Z0JBRUQsZ0NBQWdDO2dCQUNoQyxJQUFJLFVBQVUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDckIsTUFBTSxHQUFHLEtBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sYUFBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBR0QscUVBQXFFO1FBQ3JFLG1DQUFtQztRQUNuQyxpQ0FBaUM7UUFDakMsNERBQTREO1FBQzVELFFBQVEsQ0FBQyxJQUFZLEVBQUUsRUFBVTtZQUNoQyxjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdCLGNBQWMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFekIsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLGFBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckMsTUFBTSxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVqQyxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsSUFBSSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM5QixFQUFFLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBRTFCLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCwrQkFBK0I7WUFDL0IsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE9BQU8sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNO2dCQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3JELFNBQVMsRUFBRSxDQUFDO1lBQ2IsQ0FBQztZQUNELDJEQUEyRDtZQUMzRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFCLE9BQU8sT0FBTyxHQUFHLENBQUMsR0FBRyxTQUFTO2dCQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxtQkFBbUIsRUFBRSxDQUFDO2dCQUN2RCxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxPQUFPLEdBQUcsU0FBUyxDQUFDO1lBRXBDLCtCQUErQjtZQUMvQixJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7WUFDaEIsT0FBTyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU07Z0JBQ3pCLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssbUJBQW1CLEVBQUUsQ0FBQztnQkFDakQsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsMkRBQTJEO1lBQzNELElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDdEIsT0FBTyxLQUFLLEdBQUcsQ0FBQyxHQUFHLE9BQU87Z0JBQ3pCLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLG1CQUFtQixFQUFFLENBQUM7Z0JBQ25ELEtBQUssRUFBRSxDQUFDO1lBQ1QsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUM7WUFFOUIsMERBQTBEO1lBQzFELE1BQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ2pELElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNWLE9BQU8sQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxRQUFRLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDN0MsTUFBTTtnQkFDUCxDQUFDO3FCQUFNLElBQUksUUFBUSxLQUFLLG1CQUFtQixFQUFFLENBQUM7b0JBQzdDLGFBQWEsR0FBRyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDO1lBRUQsMEVBQTBFO1lBQzFFLDRCQUE0QjtZQUM1QixJQUFJLENBQUMsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxNQUFNLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLEtBQUssR0FBRyxNQUFNLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxtQkFBbUIsRUFBRSxDQUFDO3dCQUN4RCx5REFBeUQ7d0JBQ3pELDJEQUEyRDt3QkFDM0QsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3RDLENBQUM7b0JBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2IsNENBQTRDO3dCQUM1Qyx5Q0FBeUM7d0JBQ3pDLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLE9BQU8sR0FBRyxNQUFNLEVBQUUsQ0FBQztvQkFDdEIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsS0FBSyxtQkFBbUIsRUFBRSxDQUFDO3dCQUM1RCx5REFBeUQ7d0JBQ3pELGlEQUFpRDt3QkFDakQsYUFBYSxHQUFHLENBQUMsQ0FBQztvQkFDbkIsQ0FBQzt5QkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDcEIsMENBQTBDO3dCQUMxQyw4Q0FBOEM7d0JBQzlDLGFBQWEsR0FBRyxDQUFDLENBQUM7b0JBQ25CLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUMxQixhQUFhLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUNiLDJFQUEyRTtZQUMzRSxTQUFTO1lBQ1QsS0FBSyxDQUFDLEdBQUcsU0FBUyxHQUFHLGFBQWEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUMzRCxJQUFJLENBQUMsS0FBSyxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxtQkFBbUIsRUFBRSxDQUFDO29CQUNqRSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUN6QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxhQUFhLENBQUM7WUFFekIsMEVBQTBFO1lBQzFFLHdCQUF3QjtZQUN4QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNoRCxDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3hELEVBQUUsT0FBTyxDQUFDO1lBQ1gsQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELGdCQUFnQixDQUFDLElBQVk7WUFDNUIsOENBQThDO1lBQzlDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLGFBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFekMsSUFBSSxZQUFZLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM5QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssbUJBQW1CLEVBQUUsQ0FBQztnQkFDeEQsb0JBQW9CO2dCQUNwQixJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssbUJBQW1CLEVBQUUsQ0FBQztvQkFDeEQsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxJQUFJLEtBQUssa0JBQWtCLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUN0RCxpRUFBaUU7d0JBQ2pFLE9BQU8sZUFBZSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQy9DLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVU7Z0JBQ3pDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssbUJBQW1CLEVBQUUsQ0FBQztnQkFDckQsMkRBQTJEO2dCQUMzRCxPQUFPLFVBQVUsWUFBWSxFQUFFLENBQUM7WUFDakMsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sQ0FBQyxJQUFZO1lBQ25CLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUN4QixJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDZixPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWhDLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNmLDZEQUE2RDtnQkFDN0QsNkJBQTZCO2dCQUM3QixPQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDM0MsQ0FBQztZQUVELHNCQUFzQjtZQUN0QixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMzQixvQkFBb0I7Z0JBRXBCLE9BQU8sR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUVyQixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDekMsNkNBQTZDO29CQUM3QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ1YsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO29CQUNiLHNDQUFzQztvQkFDdEMsT0FBTyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN4RCxDQUFDLEVBQUUsQ0FBQztvQkFDTCxDQUFDO29CQUNELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7d0JBQzNCLFdBQVc7d0JBQ1gsSUFBSSxHQUFHLENBQUMsQ0FBQzt3QkFDVCxrQ0FBa0M7d0JBQ2xDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ3ZELENBQUMsRUFBRSxDQUFDO3dCQUNMLENBQUM7d0JBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQzs0QkFDM0IsV0FBVzs0QkFDWCxJQUFJLEdBQUcsQ0FBQyxDQUFDOzRCQUNULHNDQUFzQzs0QkFDdEMsT0FBTyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dDQUN4RCxDQUFDLEVBQUUsQ0FBQzs0QkFDTCxDQUFDOzRCQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO2dDQUNmLDZCQUE2QjtnQ0FDN0IsT0FBTyxJQUFJLENBQUM7NEJBQ2IsQ0FBQzs0QkFDRCxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQ0FDaEIsdUNBQXVDO2dDQUV2Qyw2REFBNkQ7Z0NBQzdELHFEQUFxRDtnQ0FDckQsT0FBTyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUMxQixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUNELHVCQUF1QjtZQUN4QixDQUFDO2lCQUFNLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDM0UsT0FBTyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sR0FBRyxPQUFPLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN6QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLEdBQUcsR0FBRyxDQUFDLENBQUM7d0JBQ1IsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxzQ0FBc0M7b0JBQ3RDLFlBQVksR0FBRyxLQUFLLENBQUM7Z0JBQ3RCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDcEIsT0FBTyxHQUFHLENBQUM7Z0JBQ1osQ0FBQztnQkFFRCxHQUFHLEdBQUcsT0FBTyxDQUFDO1lBQ2YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVELFFBQVEsQ0FBQyxJQUFZLEVBQUUsR0FBWTtZQUNsQyxJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdkIsY0FBYyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBQ0QsY0FBYyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3QixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNiLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsQ0FBQztZQUVOLHFFQUFxRTtZQUNyRSwwRUFBMEU7WUFDMUUsY0FBYztZQUNkLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDO2dCQUNuQixtQkFBbUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNwQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUVELElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEUsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ2xCLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7Z0JBQ0QsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQzVCLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDM0Isb0VBQW9FO3dCQUNwRSxnREFBZ0Q7d0JBQ2hELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQzs0QkFDbkIsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ2QsTUFBTTt3QkFDUCxDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLGdCQUFnQixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQzdCLG1FQUFtRTs0QkFDbkUsbURBQW1EOzRCQUNuRCxZQUFZLEdBQUcsS0FBSyxDQUFDOzRCQUNyQixnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMxQixDQUFDO3dCQUNELElBQUksTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUNqQixzQ0FBc0M7NEJBQ3RDLElBQUksSUFBSSxLQUFLLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQ0FDckMsSUFBSSxFQUFFLE1BQU0sS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29DQUNyQixnRUFBZ0U7b0NBQ2hFLFlBQVk7b0NBQ1osR0FBRyxHQUFHLENBQUMsQ0FBQztnQ0FDVCxDQUFDOzRCQUNGLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCw2REFBNkQ7Z0NBQzdELFlBQVk7Z0NBQ1osTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dDQUNaLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQzs0QkFDeEIsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLEtBQUssS0FBSyxHQUFHLEVBQUUsQ0FBQztvQkFDbkIsR0FBRyxHQUFHLGdCQUFnQixDQUFDO2dCQUN4QixDQUFDO3FCQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUNuQixDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUNELEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3pDLG9FQUFvRTtvQkFDcEUsZ0RBQWdEO29CQUNoRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNkLE1BQU07b0JBQ1AsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLG1FQUFtRTtvQkFDbkUsaUJBQWlCO29CQUNqQixZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUNyQixHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELE9BQU8sQ0FBQyxJQUFZO1lBQ25CLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0IsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEIsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLHlFQUF5RTtZQUN6RSxtQ0FBbUM7WUFDbkMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBRXBCLHFFQUFxRTtZQUNyRSwwRUFBMEU7WUFDMUUsY0FBYztZQUVkLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDO2dCQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVU7Z0JBQ2pDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxLQUFLLEdBQUcsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUN2QixDQUFDO1lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzNCLG9FQUFvRTtvQkFDcEUsZ0RBQWdEO29CQUNoRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNsQixNQUFNO29CQUNQLENBQUM7b0JBQ0QsU0FBUztnQkFDVixDQUFDO2dCQUNELElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2hCLG1FQUFtRTtvQkFDbkUsWUFBWTtvQkFDWixZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUNyQixHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDYixDQUFDO2dCQUNELElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN2QixrRUFBa0U7b0JBQ2xFLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3JCLFFBQVEsR0FBRyxDQUFDLENBQUM7b0JBQ2QsQ0FBQzt5QkFDSSxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDNUIsV0FBVyxHQUFHLENBQUMsQ0FBQztvQkFDakIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzVCLHVFQUF1RTtvQkFDdkUscURBQXFEO29CQUNyRCxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDO2dCQUNsQixHQUFHLEtBQUssQ0FBQyxDQUFDO2dCQUNWLHdEQUF3RDtnQkFDeEQsV0FBVyxLQUFLLENBQUM7Z0JBQ2pCLDBEQUEwRDtnQkFDMUQsQ0FBQyxXQUFXLEtBQUssQ0FBQztvQkFDakIsUUFBUSxLQUFLLEdBQUcsR0FBRyxDQUFDO29CQUNwQixRQUFRLEtBQUssU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVELE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7UUFFaEMsS0FBSyxDQUFDLElBQUk7WUFDVCxjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTdCLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDL0QsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3hCLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNoQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTlCLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNmLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzNCLDZEQUE2RDtvQkFDN0QsbUJBQW1CO29CQUNuQixHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO29CQUMxQixPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDO2dCQUNELEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBQzNCLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUNELHNCQUFzQjtZQUN0QixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMzQixvQkFBb0I7Z0JBRXBCLE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQ1osSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3pDLDZDQUE2QztvQkFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNWLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztvQkFDYixzQ0FBc0M7b0JBQ3RDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDeEQsQ0FBQyxFQUFFLENBQUM7b0JBQ0wsQ0FBQztvQkFDRCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO3dCQUMzQixXQUFXO3dCQUNYLElBQUksR0FBRyxDQUFDLENBQUM7d0JBQ1Qsa0NBQWtDO3dCQUNsQyxPQUFPLENBQUMsR0FBRyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUN2RCxDQUFDLEVBQUUsQ0FBQzt3QkFDTCxDQUFDO3dCQUNELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7NEJBQzNCLFdBQVc7NEJBQ1gsSUFBSSxHQUFHLENBQUMsQ0FBQzs0QkFDVCxzQ0FBc0M7NEJBQ3RDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQ0FDeEQsQ0FBQyxFQUFFLENBQUM7NEJBQ0wsQ0FBQzs0QkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQ0FDZiw2QkFBNkI7Z0NBQzdCLE9BQU8sR0FBRyxDQUFDLENBQUM7NEJBQ2IsQ0FBQztpQ0FBTSxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQ0FDdkIsdUNBQXVDO2dDQUN2QyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDakIsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUMzRSx1QkFBdUI7Z0JBQ3ZCLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUNkLHlEQUF5RDtvQkFDekQsbUJBQW1CO29CQUNuQixHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO29CQUMxQixPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDO2dCQUNELE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQ1osSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3pDLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUNmLHlEQUF5RDt3QkFDekQsbUJBQW1CO3dCQUNuQixHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO3dCQUMxQixPQUFPLEdBQUcsQ0FBQztvQkFDWixDQUFDO29CQUNELE9BQU8sR0FBRyxDQUFDLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDakIsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRXhCLHlFQUF5RTtZQUN6RSxtQ0FBbUM7WUFDbkMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBRXBCLG1CQUFtQjtZQUNuQixPQUFPLENBQUMsSUFBSSxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQzNCLG9FQUFvRTtvQkFDcEUsZ0RBQWdEO29CQUNoRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNsQixNQUFNO29CQUNQLENBQUM7b0JBQ0QsU0FBUztnQkFDVixDQUFDO2dCQUNELElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2hCLG1FQUFtRTtvQkFDbkUsWUFBWTtvQkFDWixZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUNyQixHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDYixDQUFDO2dCQUNELElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN2QixrRUFBa0U7b0JBQ2xFLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3JCLFFBQVEsR0FBRyxDQUFDLENBQUM7b0JBQ2QsQ0FBQzt5QkFBTSxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDOUIsV0FBVyxHQUFHLENBQUMsQ0FBQztvQkFDakIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzVCLHVFQUF1RTtvQkFDdkUscURBQXFEO29CQUNyRCxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDO29CQUNsQix3REFBd0Q7b0JBQ3hELFdBQVcsS0FBSyxDQUFDO29CQUNqQiwwREFBMEQ7b0JBQzFELENBQUMsV0FBVyxLQUFLLENBQUM7d0JBQ2pCLFFBQVEsS0FBSyxHQUFHLEdBQUcsQ0FBQzt3QkFDcEIsUUFBUSxLQUFLLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUMvQixHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2xELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUMzQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUN0QyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO1lBQ0YsQ0FBQztZQUVELDJFQUEyRTtZQUMzRSwwRUFBMEU7WUFDMUUsNkNBQTZDO1lBQzdDLElBQUksU0FBUyxHQUFHLENBQUMsSUFBSSxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQzVDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDcEIsQ0FBQztZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELEdBQUcsRUFBRSxJQUFJO1FBQ1QsU0FBUyxFQUFFLEdBQUc7UUFDZCxLQUFLLEVBQUUsSUFBSTtRQUNYLEtBQUssRUFBRSxJQUFJO0tBQ1gsQ0FBQztJQUVGLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFO1FBQ3RCLElBQUksZUFBZSxFQUFFLENBQUM7WUFDckIsdUVBQXVFO1lBQ3ZFLG9DQUFvQztZQUNwQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDckIsT0FBTyxHQUFHLEVBQUU7Z0JBQ1gsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQy9DLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztRQUVELDBEQUEwRDtRQUMxRCxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDO0lBRVEsUUFBQSxLQUFLLEdBQVU7UUFDM0IsK0JBQStCO1FBQy9CLE9BQU8sQ0FBQyxHQUFHLFlBQXNCO1lBQ2hDLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztZQUN0QixJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUU3QixLQUFLLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pFLE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBRW5ELGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRTdCLHFCQUFxQjtnQkFDckIsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN2QixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsWUFBWSxHQUFHLEdBQUcsSUFBSSxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUN6QyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixDQUFDO1lBQzlELENBQUM7WUFFRCx5RUFBeUU7WUFDekUsMkVBQTJFO1lBRTNFLHFCQUFxQjtZQUNyQixZQUFZLEdBQUcsZUFBZSxDQUFDLFlBQVksRUFBRSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFDbEUsb0JBQW9CLENBQUMsQ0FBQztZQUV2QixJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUMzQixDQUFDO1lBQ0QsT0FBTyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7UUFDckQsQ0FBQztRQUVELFNBQVMsQ0FBQyxJQUFZO1lBQ3JCLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFN0IsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixDQUFDO1lBQzdELE1BQU0saUJBQWlCLEdBQ3RCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxrQkFBa0IsQ0FBQztZQUV6RCxxQkFBcUI7WUFDckIsSUFBSSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFckUsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixPQUFPLEdBQUcsQ0FBQztnQkFDWixDQUFDO2dCQUNELE9BQU8saUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ3ZDLENBQUM7WUFDRCxJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3ZCLElBQUksSUFBSSxHQUFHLENBQUM7WUFDYixDQUFDO1lBRUQsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN2QyxDQUFDO1FBRUQsVUFBVSxDQUFDLElBQVk7WUFDdEIsY0FBYyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3QixPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLENBQUM7UUFDckUsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFHLEtBQWU7WUFDdEIsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QixPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFDRCxJQUFJLE1BQU0sQ0FBQztZQUNYLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDNUIsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNwQixJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDMUIsTUFBTSxHQUFHLEdBQUcsQ0FBQztvQkFDZCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ3JCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxHQUFHLENBQUM7WUFDWixDQUFDO1lBQ0QsT0FBTyxhQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxRQUFRLENBQUMsSUFBWSxFQUFFLEVBQVU7WUFDaEMsY0FBYyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3QixjQUFjLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXpCLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDO2dCQUNqQixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxnQ0FBZ0M7WUFDaEMsSUFBSSxHQUFHLGFBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0IsRUFBRSxHQUFHLGFBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdkIsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzVCLE1BQU0sT0FBTyxHQUFHLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFDcEMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1lBRWxDLDBEQUEwRDtZQUMxRCxNQUFNLE1BQU0sR0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ1YsT0FBTyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLFFBQVEsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUM3QyxNQUFNO2dCQUNQLENBQUM7cUJBQU0sSUFBSSxRQUFRLEtBQUssa0JBQWtCLEVBQUUsQ0FBQztvQkFDNUMsYUFBYSxHQUFHLENBQUMsQ0FBQztnQkFDbkIsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxLQUFLLEdBQUcsTUFBTSxFQUFFLENBQUM7b0JBQ3BCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEVBQUUsQ0FBQzt3QkFDdkQseURBQXlEO3dCQUN6RCxrREFBa0Q7d0JBQ2xELE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxDQUFDO29CQUNELElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUNiLG9DQUFvQzt3QkFDcEMsbUNBQW1DO3dCQUNuQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUM5QixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxPQUFPLEdBQUcsTUFBTSxFQUFFLENBQUM7b0JBQzdCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEVBQUUsQ0FBQzt3QkFDM0QseURBQXlEO3dCQUN6RCxrREFBa0Q7d0JBQ2xELGFBQWEsR0FBRyxDQUFDLENBQUM7b0JBQ25CLENBQUM7eUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3BCLG1DQUFtQzt3QkFDbkMsdUNBQXVDO3dCQUN2QyxhQUFhLEdBQUcsQ0FBQyxDQUFDO29CQUNuQixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1lBQ2IsdUVBQXVFO1lBQ3ZFLGNBQWM7WUFDZCxLQUFLLENBQUMsR0FBRyxTQUFTLEdBQUcsYUFBYSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQzNELElBQUksQ0FBQyxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixFQUFFLENBQUM7b0JBQ2hFLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ3hDLENBQUM7WUFDRixDQUFDO1lBRUQsMEVBQTBFO1lBQzFFLHlCQUF5QjtZQUN6QixPQUFPLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxFQUFFLENBQUM7UUFDckQsQ0FBQztRQUVELGdCQUFnQixDQUFDLElBQVk7WUFDNUIsMEJBQTBCO1lBQzFCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sQ0FBQyxJQUFZO1lBQ25CLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0IsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixDQUFDO1lBQzFELElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssa0JBQWtCLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNuQixHQUFHLEdBQUcsQ0FBQyxDQUFDO3dCQUNSLE1BQU07b0JBQ1AsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1Asc0NBQXNDO29CQUN0QyxZQUFZLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUM1QixDQUFDO1lBQ0QsSUFBSSxPQUFPLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFFRCxRQUFRLENBQUMsSUFBWSxFQUFFLEdBQVk7WUFDbEMsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3ZCLGNBQWMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFN0IsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDYixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDeEIsSUFBSSxDQUFDLENBQUM7WUFFTixJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RFLElBQUksR0FBRyxLQUFLLElBQUksRUFBRSxDQUFDO29CQUNsQixPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO2dCQUNELElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hDLElBQUksSUFBSSxLQUFLLGtCQUFrQixFQUFFLENBQUM7d0JBQ2pDLG9FQUFvRTt3QkFDcEUsZ0RBQWdEO3dCQUNoRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7NEJBQ25CLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUNkLE1BQU07d0JBQ1AsQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxnQkFBZ0IsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUM3QixtRUFBbUU7NEJBQ25FLG1EQUFtRDs0QkFDbkQsWUFBWSxHQUFHLEtBQUssQ0FBQzs0QkFDckIsZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDMUIsQ0FBQzt3QkFDRCxJQUFJLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDakIsc0NBQXNDOzRCQUN0QyxJQUFJLElBQUksS0FBSyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0NBQ3JDLElBQUksRUFBRSxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQ0FDckIsZ0VBQWdFO29DQUNoRSxZQUFZO29DQUNaLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0NBQ1QsQ0FBQzs0QkFDRixDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsNkRBQTZEO2dDQUM3RCxZQUFZO2dDQUNaLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQ0FDWixHQUFHLEdBQUcsZ0JBQWdCLENBQUM7NEJBQ3hCLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxLQUFLLEtBQUssR0FBRyxFQUFFLENBQUM7b0JBQ25CLEdBQUcsR0FBRyxnQkFBZ0IsQ0FBQztnQkFDeEIsQ0FBQztxQkFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN2QixHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDbkIsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFDRCxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxrQkFBa0IsRUFBRSxDQUFDO29CQUMvQyxvRUFBb0U7b0JBQ3BFLGdEQUFnRDtvQkFDaEQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUNuQixLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDZCxNQUFNO29CQUNQLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUN2QixtRUFBbUU7b0JBQ25FLGlCQUFpQjtvQkFDakIsWUFBWSxHQUFHLEtBQUssQ0FBQztvQkFDckIsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxPQUFPLENBQUMsSUFBWTtZQUNuQixjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdCLElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNsQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNiLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztZQUN4Qix5RUFBeUU7WUFDekUsbUNBQW1DO1lBQ25DLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNwQixLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxJQUFJLEtBQUssa0JBQWtCLEVBQUUsQ0FBQztvQkFDakMsb0VBQW9FO29CQUNwRSxnREFBZ0Q7b0JBQ2hELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDbkIsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2xCLE1BQU07b0JBQ1AsQ0FBQztvQkFDRCxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDaEIsbUVBQW1FO29CQUNuRSxZQUFZO29CQUNaLFlBQVksR0FBRyxLQUFLLENBQUM7b0JBQ3JCLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3ZCLGtFQUFrRTtvQkFDbEUsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDckIsUUFBUSxHQUFHLENBQUMsQ0FBQztvQkFDZCxDQUFDO3lCQUNJLElBQUksV0FBVyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUM1QixXQUFXLEdBQUcsQ0FBQyxDQUFDO29CQUNqQixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDNUIsdUVBQXVFO29CQUN2RSxxREFBcUQ7b0JBQ3JELFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDbEIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUM7Z0JBQ2xCLEdBQUcsS0FBSyxDQUFDLENBQUM7Z0JBQ1Ysd0RBQXdEO2dCQUN4RCxXQUFXLEtBQUssQ0FBQztnQkFDakIsMERBQTBEO2dCQUMxRCxDQUFDLFdBQVcsS0FBSyxDQUFDO29CQUNqQixRQUFRLEtBQUssR0FBRyxHQUFHLENBQUM7b0JBQ3BCLFFBQVEsS0FBSyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsTUFBTSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztRQUUvQixLQUFLLENBQUMsSUFBWTtZQUNqQixjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBRTdCLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFDL0QsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLGtCQUFrQixDQUFDO1lBQzdELElBQUksS0FBSyxDQUFDO1lBQ1YsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7Z0JBQ2YsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNYLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUNELElBQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2xCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNsQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNiLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQztZQUN4QixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUV4Qix5RUFBeUU7WUFDekUsbUNBQW1DO1lBQ25DLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztZQUVwQixtQkFBbUI7WUFDbkIsT0FBTyxDQUFDLElBQUksS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksSUFBSSxLQUFLLGtCQUFrQixFQUFFLENBQUM7b0JBQ2pDLG9FQUFvRTtvQkFDcEUsZ0RBQWdEO29CQUNoRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ25CLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNsQixNQUFNO29CQUNQLENBQUM7b0JBQ0QsU0FBUztnQkFDVixDQUFDO2dCQUNELElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ2hCLG1FQUFtRTtvQkFDbkUsWUFBWTtvQkFDWixZQUFZLEdBQUcsS0FBSyxDQUFDO29CQUNyQixHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDYixDQUFDO2dCQUNELElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN2QixrRUFBa0U7b0JBQ2xFLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3JCLFFBQVEsR0FBRyxDQUFDLENBQUM7b0JBQ2QsQ0FBQzt5QkFBTSxJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDOUIsV0FBVyxHQUFHLENBQUMsQ0FBQztvQkFDakIsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksUUFBUSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzVCLHVFQUF1RTtvQkFDdkUscURBQXFEO29CQUNyRCxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxLQUFLLEdBQUcsU0FBUyxLQUFLLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUM1RCxJQUFJLFFBQVEsS0FBSyxDQUFDLENBQUM7b0JBQ2xCLHdEQUF3RDtvQkFDeEQsV0FBVyxLQUFLLENBQUM7b0JBQ2pCLDBEQUEwRDtvQkFDMUQsQ0FBQyxXQUFXLEtBQUssQ0FBQzt3QkFDakIsUUFBUSxLQUFLLEdBQUcsR0FBRyxDQUFDO3dCQUNwQixRQUFRLEtBQUssU0FBUyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQy9CLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ3ZDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQ2xDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ25CLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7aUJBQU0sSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDdkIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDZixDQUFDO1lBRUQsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRUQsR0FBRyxFQUFFLEdBQUc7UUFDUixTQUFTLEVBQUUsR0FBRztRQUNkLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLElBQUk7S0FDWCxDQUFDO0lBRUYsYUFBSyxDQUFDLEtBQUssR0FBRyxhQUFLLENBQUMsS0FBSyxHQUFHLGFBQUssQ0FBQztJQUNsQyxhQUFLLENBQUMsS0FBSyxHQUFHLGFBQUssQ0FBQyxLQUFLLEdBQUcsYUFBSyxDQUFDO0lBRXJCLFFBQUEsU0FBUyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbEUsUUFBQSxVQUFVLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNyRSxRQUFBLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25ELFFBQUEsT0FBTyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUQsUUFBQSxRQUFRLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvRCxRQUFBLE9BQU8sR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVELFFBQUEsUUFBUSxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0QsUUFBQSxPQUFPLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1RCxRQUFBLE1BQU0sR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELFFBQUEsS0FBSyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEQsUUFBQSxnQkFBZ0IsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN2RixRQUFBLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hELFFBQUEsU0FBUyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLENBQUMifQ==