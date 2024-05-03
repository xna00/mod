/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri"], function (require, exports, extpath, network_1, paths, platform_1, strings_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DataUri = exports.addTrailingPathSeparator = exports.removeTrailingPathSeparator = exports.hasTrailingPathSeparator = exports.isEqualAuthority = exports.isAbsolutePath = exports.resolvePath = exports.relativePath = exports.normalizePath = exports.joinPath = exports.dirname = exports.extname = exports.basename = exports.basenameOrAuthority = exports.getComparisonKey = exports.isEqualOrParent = exports.isEqual = exports.extUriIgnorePathCase = exports.extUriBiasedIgnorePathCase = exports.extUri = exports.ExtUri = void 0;
    exports.originalFSPath = originalFSPath;
    exports.distinctParents = distinctParents;
    exports.toLocalResource = toLocalResource;
    function originalFSPath(uri) {
        return (0, uri_1.uriToFsPath)(uri, true);
    }
    class ExtUri {
        constructor(_ignorePathCasing) {
            this._ignorePathCasing = _ignorePathCasing;
        }
        compare(uri1, uri2, ignoreFragment = false) {
            if (uri1 === uri2) {
                return 0;
            }
            return (0, strings_1.compare)(this.getComparisonKey(uri1, ignoreFragment), this.getComparisonKey(uri2, ignoreFragment));
        }
        isEqual(uri1, uri2, ignoreFragment = false) {
            if (uri1 === uri2) {
                return true;
            }
            if (!uri1 || !uri2) {
                return false;
            }
            return this.getComparisonKey(uri1, ignoreFragment) === this.getComparisonKey(uri2, ignoreFragment);
        }
        getComparisonKey(uri, ignoreFragment = false) {
            return uri.with({
                path: this._ignorePathCasing(uri) ? uri.path.toLowerCase() : undefined,
                fragment: ignoreFragment ? null : undefined
            }).toString();
        }
        ignorePathCasing(uri) {
            return this._ignorePathCasing(uri);
        }
        isEqualOrParent(base, parentCandidate, ignoreFragment = false) {
            if (base.scheme === parentCandidate.scheme) {
                if (base.scheme === network_1.Schemas.file) {
                    return extpath.isEqualOrParent(originalFSPath(base), originalFSPath(parentCandidate), this._ignorePathCasing(base)) && base.query === parentCandidate.query && (ignoreFragment || base.fragment === parentCandidate.fragment);
                }
                if ((0, exports.isEqualAuthority)(base.authority, parentCandidate.authority)) {
                    return extpath.isEqualOrParent(base.path, parentCandidate.path, this._ignorePathCasing(base), '/') && base.query === parentCandidate.query && (ignoreFragment || base.fragment === parentCandidate.fragment);
                }
            }
            return false;
        }
        // --- path math
        joinPath(resource, ...pathFragment) {
            return uri_1.URI.joinPath(resource, ...pathFragment);
        }
        basenameOrAuthority(resource) {
            return (0, exports.basename)(resource) || resource.authority;
        }
        basename(resource) {
            return paths.posix.basename(resource.path);
        }
        extname(resource) {
            return paths.posix.extname(resource.path);
        }
        dirname(resource) {
            if (resource.path.length === 0) {
                return resource;
            }
            let dirname;
            if (resource.scheme === network_1.Schemas.file) {
                dirname = uri_1.URI.file(paths.dirname(originalFSPath(resource))).path;
            }
            else {
                dirname = paths.posix.dirname(resource.path);
                if (resource.authority && dirname.length && dirname.charCodeAt(0) !== 47 /* CharCode.Slash */) {
                    console.error(`dirname("${resource.toString})) resulted in a relative path`);
                    dirname = '/'; // If a URI contains an authority component, then the path component must either be empty or begin with a CharCode.Slash ("/") character
                }
            }
            return resource.with({
                path: dirname
            });
        }
        normalizePath(resource) {
            if (!resource.path.length) {
                return resource;
            }
            let normalizedPath;
            if (resource.scheme === network_1.Schemas.file) {
                normalizedPath = uri_1.URI.file(paths.normalize(originalFSPath(resource))).path;
            }
            else {
                normalizedPath = paths.posix.normalize(resource.path);
            }
            return resource.with({
                path: normalizedPath
            });
        }
        relativePath(from, to) {
            if (from.scheme !== to.scheme || !(0, exports.isEqualAuthority)(from.authority, to.authority)) {
                return undefined;
            }
            if (from.scheme === network_1.Schemas.file) {
                const relativePath = paths.relative(originalFSPath(from), originalFSPath(to));
                return platform_1.isWindows ? extpath.toSlashes(relativePath) : relativePath;
            }
            let fromPath = from.path || '/';
            const toPath = to.path || '/';
            if (this._ignorePathCasing(from)) {
                // make casing of fromPath match toPath
                let i = 0;
                for (const len = Math.min(fromPath.length, toPath.length); i < len; i++) {
                    if (fromPath.charCodeAt(i) !== toPath.charCodeAt(i)) {
                        if (fromPath.charAt(i).toLowerCase() !== toPath.charAt(i).toLowerCase()) {
                            break;
                        }
                    }
                }
                fromPath = toPath.substr(0, i) + fromPath.substr(i);
            }
            return paths.posix.relative(fromPath, toPath);
        }
        resolvePath(base, path) {
            if (base.scheme === network_1.Schemas.file) {
                const newURI = uri_1.URI.file(paths.resolve(originalFSPath(base), path));
                return base.with({
                    authority: newURI.authority,
                    path: newURI.path
                });
            }
            path = extpath.toPosixPath(path); // we allow path to be a windows path
            return base.with({
                path: paths.posix.resolve(base.path, path)
            });
        }
        // --- misc
        isAbsolutePath(resource) {
            return !!resource.path && resource.path[0] === '/';
        }
        isEqualAuthority(a1, a2) {
            return a1 === a2 || (a1 !== undefined && a2 !== undefined && (0, strings_1.equalsIgnoreCase)(a1, a2));
        }
        hasTrailingPathSeparator(resource, sep = paths.sep) {
            if (resource.scheme === network_1.Schemas.file) {
                const fsp = originalFSPath(resource);
                return fsp.length > extpath.getRoot(fsp).length && fsp[fsp.length - 1] === sep;
            }
            else {
                const p = resource.path;
                return (p.length > 1 && p.charCodeAt(p.length - 1) === 47 /* CharCode.Slash */) && !(/^[a-zA-Z]:(\/$|\\$)/.test(resource.fsPath)); // ignore the slash at offset 0
            }
        }
        removeTrailingPathSeparator(resource, sep = paths.sep) {
            // Make sure that the path isn't a drive letter. A trailing separator there is not removable.
            if ((0, exports.hasTrailingPathSeparator)(resource, sep)) {
                return resource.with({ path: resource.path.substr(0, resource.path.length - 1) });
            }
            return resource;
        }
        addTrailingPathSeparator(resource, sep = paths.sep) {
            let isRootSep = false;
            if (resource.scheme === network_1.Schemas.file) {
                const fsp = originalFSPath(resource);
                isRootSep = ((fsp !== undefined) && (fsp.length === extpath.getRoot(fsp).length) && (fsp[fsp.length - 1] === sep));
            }
            else {
                sep = '/';
                const p = resource.path;
                isRootSep = p.length === 1 && p.charCodeAt(p.length - 1) === 47 /* CharCode.Slash */;
            }
            if (!isRootSep && !(0, exports.hasTrailingPathSeparator)(resource, sep)) {
                return resource.with({ path: resource.path + '/' });
            }
            return resource;
        }
    }
    exports.ExtUri = ExtUri;
    /**
     * Unbiased utility that takes uris "as they are". This means it can be interchanged with
     * uri#toString() usages. The following is true
     * ```
     * assertEqual(aUri.toString() === bUri.toString(), exturi.isEqual(aUri, bUri))
     * ```
     */
    exports.extUri = new ExtUri(() => false);
    /**
     * BIASED utility that _mostly_ ignored the case of urs paths. ONLY use this util if you
     * understand what you are doing.
     *
     * This utility is INCOMPATIBLE with `uri.toString()`-usages and both CANNOT be used interchanged.
     *
     * When dealing with uris from files or documents, `extUri` (the unbiased friend)is sufficient
     * because those uris come from a "trustworthy source". When creating unknown uris it's always
     * better to use `IUriIdentityService` which exposes an `IExtUri`-instance which knows when path
     * casing matters.
     */
    exports.extUriBiasedIgnorePathCase = new ExtUri(uri => {
        // A file scheme resource is in the same platform as code, so ignore case for non linux platforms
        // Resource can be from another platform. Lowering the case as an hack. Should come from File system provider
        return uri.scheme === network_1.Schemas.file ? !platform_1.isLinux : true;
    });
    /**
     * BIASED utility that always ignores the casing of uris paths. ONLY use this util if you
     * understand what you are doing.
     *
     * This utility is INCOMPATIBLE with `uri.toString()`-usages and both CANNOT be used interchanged.
     *
     * When dealing with uris from files or documents, `extUri` (the unbiased friend)is sufficient
     * because those uris come from a "trustworthy source". When creating unknown uris it's always
     * better to use `IUriIdentityService` which exposes an `IExtUri`-instance which knows when path
     * casing matters.
     */
    exports.extUriIgnorePathCase = new ExtUri(_ => true);
    exports.isEqual = exports.extUri.isEqual.bind(exports.extUri);
    exports.isEqualOrParent = exports.extUri.isEqualOrParent.bind(exports.extUri);
    exports.getComparisonKey = exports.extUri.getComparisonKey.bind(exports.extUri);
    exports.basenameOrAuthority = exports.extUri.basenameOrAuthority.bind(exports.extUri);
    exports.basename = exports.extUri.basename.bind(exports.extUri);
    exports.extname = exports.extUri.extname.bind(exports.extUri);
    exports.dirname = exports.extUri.dirname.bind(exports.extUri);
    exports.joinPath = exports.extUri.joinPath.bind(exports.extUri);
    exports.normalizePath = exports.extUri.normalizePath.bind(exports.extUri);
    exports.relativePath = exports.extUri.relativePath.bind(exports.extUri);
    exports.resolvePath = exports.extUri.resolvePath.bind(exports.extUri);
    exports.isAbsolutePath = exports.extUri.isAbsolutePath.bind(exports.extUri);
    exports.isEqualAuthority = exports.extUri.isEqualAuthority.bind(exports.extUri);
    exports.hasTrailingPathSeparator = exports.extUri.hasTrailingPathSeparator.bind(exports.extUri);
    exports.removeTrailingPathSeparator = exports.extUri.removeTrailingPathSeparator.bind(exports.extUri);
    exports.addTrailingPathSeparator = exports.extUri.addTrailingPathSeparator.bind(exports.extUri);
    //#endregion
    function distinctParents(items, resourceAccessor) {
        const distinctParents = [];
        for (let i = 0; i < items.length; i++) {
            const candidateResource = resourceAccessor(items[i]);
            if (items.some((otherItem, index) => {
                if (index === i) {
                    return false;
                }
                return (0, exports.isEqualOrParent)(candidateResource, resourceAccessor(otherItem));
            })) {
                continue;
            }
            distinctParents.push(items[i]);
        }
        return distinctParents;
    }
    /**
     * Data URI related helpers.
     */
    var DataUri;
    (function (DataUri) {
        DataUri.META_DATA_LABEL = 'label';
        DataUri.META_DATA_DESCRIPTION = 'description';
        DataUri.META_DATA_SIZE = 'size';
        DataUri.META_DATA_MIME = 'mime';
        function parseMetaData(dataUri) {
            const metadata = new Map();
            // Given a URI of:  data:image/png;size:2313;label:SomeLabel;description:SomeDescription;base64,77+9UE5...
            // the metadata is: size:2313;label:SomeLabel;description:SomeDescription
            const meta = dataUri.path.substring(dataUri.path.indexOf(';') + 1, dataUri.path.lastIndexOf(';'));
            meta.split(';').forEach(property => {
                const [key, value] = property.split(':');
                if (key && value) {
                    metadata.set(key, value);
                }
            });
            // Given a URI of:  data:image/png;size:2313;label:SomeLabel;description:SomeDescription;base64,77+9UE5...
            // the mime is: image/png
            const mime = dataUri.path.substring(0, dataUri.path.indexOf(';'));
            if (mime) {
                metadata.set(DataUri.META_DATA_MIME, mime);
            }
            return metadata;
        }
        DataUri.parseMetaData = parseMetaData;
    })(DataUri || (exports.DataUri = DataUri = {}));
    function toLocalResource(resource, authority, localScheme) {
        if (authority) {
            let path = resource.path;
            if (path && path[0] !== paths.posix.sep) {
                path = paths.posix.sep + path;
            }
            return resource.with({ scheme: localScheme, authority, path });
        }
        return resource.with({ scheme: localScheme });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9yZXNvdXJjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLHdDQUVDO0lBMldELDBDQWtCQztJQW9DRCwwQ0FXQztJQTlhRCxTQUFnQixjQUFjLENBQUMsR0FBUTtRQUN0QyxPQUFPLElBQUEsaUJBQVcsRUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQTJIRCxNQUFhLE1BQU07UUFFbEIsWUFBb0IsaUJBQXdDO1lBQXhDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUI7UUFBSSxDQUFDO1FBRWpFLE9BQU8sQ0FBQyxJQUFTLEVBQUUsSUFBUyxFQUFFLGlCQUEwQixLQUFLO1lBQzVELElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNuQixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFDRCxPQUFPLElBQUEsaUJBQVUsRUFBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUM3RyxDQUFDO1FBRUQsT0FBTyxDQUFDLElBQXFCLEVBQUUsSUFBcUIsRUFBRSxpQkFBMEIsS0FBSztZQUNwRixJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNwQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLEtBQUssSUFB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