/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/platform/remote/common/remoteHosts"], function (require, exports, strings, instantiation_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IBuiltinExtensionsScannerService = exports.ExtensionIdentifierMap = exports.ExtensionIdentifierSet = exports.ExtensionIdentifier = exports.TargetPlatform = exports.ExtensionType = exports.EXTENSION_CATEGORIES = exports.ALL_EXTENSION_KINDS = exports.UNDEFINED_PUBLISHER = exports.BUILTIN_MANIFEST_CACHE_FILE = exports.USER_MANIFEST_CACHE_FILE = void 0;
    exports.getWorkspaceSupportTypeMessage = getWorkspaceSupportTypeMessage;
    exports.isApplicationScopedExtension = isApplicationScopedExtension;
    exports.isLanguagePackExtension = isLanguagePackExtension;
    exports.isAuthenticationProviderExtension = isAuthenticationProviderExtension;
    exports.isResolverExtension = isResolverExtension;
    exports.USER_MANIFEST_CACHE_FILE = 'extensions.user.cache';
    exports.BUILTIN_MANIFEST_CACHE_FILE = 'extensions.builtin.cache';
    exports.UNDEFINED_PUBLISHER = 'undefined_publisher';
    exports.ALL_EXTENSION_KINDS = ['ui', 'workspace', 'web'];
    function getWorkspaceSupportTypeMessage(supportType) {
        if (typeof supportType === 'object' && supportType !== null) {
            if (supportType.supported !== true) {
                return supportType.description;
            }
        }
        return undefined;
    }
    exports.EXTENSION_CATEGORIES = [
        'Azure',
        'Data Science',
        'Debuggers',
        'Extension Packs',
        'Education',
        'Formatters',
        'Keymaps',
        'Language Packs',
        'Linters',
        'Machine Learning',
        'Notebooks',
        'Programming Languages',
        'SCM Providers',
        'Snippets',
        'Testing',
        'Themes',
        'Visualization',
        'AI',
        'Chat',
        'Other',
    ];
    var ExtensionType;
    (function (ExtensionType) {
        ExtensionType[ExtensionType["System"] = 0] = "System";
        ExtensionType[ExtensionType["User"] = 1] = "User";
    })(ExtensionType || (exports.ExtensionType = ExtensionType = {}));
    var TargetPlatform;
    (function (TargetPlatform) {
        TargetPlatform["WIN32_X64"] = "win32-x64";
        TargetPlatform["WIN32_ARM64"] = "win32-arm64";
        TargetPlatform["LINUX_X64"] = "linux-x64";
        TargetPlatform["LINUX_ARM64"] = "linux-arm64";
        TargetPlatform["LINUX_ARMHF"] = "linux-armhf";
        TargetPlatform["ALPINE_X64"] = "alpine-x64";
        TargetPlatform["ALPINE_ARM64"] = "alpine-arm64";
        TargetPlatform["DARWIN_X64"] = "darwin-x64";
        TargetPlatform["DARWIN_ARM64"] = "darwin-arm64";
        TargetPlatform["WEB"] = "web";
        TargetPlatform["UNIVERSAL"] = "universal";
        TargetPlatform["UNKNOWN"] = "unknown";
        TargetPlatform["UNDEFINED"] = "undefined";
    })(TargetPlatform || (exports.TargetPlatform = TargetPlatform = {}));
    /**
     * **!Do not construct directly!**
     *
     * **!Only static methods because it gets serialized!**
     *
     * This represents the "canonical" version for an extension identifier. Extension ids
     * have to be case-insensitive (due to the marketplace), but we must ensure case
     * preservation because the extension API is already public at this time.
     *
     * For example, given an extension with the publisher `"Hello"` and the name `"World"`,
     * its canonical extension identifier is `"Hello.World"`. This extension could be
     * referenced in some other extension's dependencies using the string `"hello.world"`.
     *
     * To make matters more complicated, an extension can optionally have an UUID. When two
     * extensions have the same UUID, they are considered equal even if their identifier is different.
     */
    class ExtensionIdentifier {
        constructor(value) {
            this.value = value;
            this._lower = value.toLowerCase();
        }
        static equals(a, b) {
            if (typeof a === 'undefined' || a === null) {
                return (typeof b === 'undefined' || b === null);
            }
            if (typeof b === 'undefined' || b === null) {
                return false;
            }
            if (typeof a === 'string' || typeof b === 'string') {
                // At least one of the arguments is an extension id in string form,
                // so we have to use the string comparison which ignores case.
                const aValue = (typeof a === 'string' ? a : a.value);
                const bValue = (typeof b === 'string' ? b : b.value);
                return strings.equalsIgnoreCase(aValue, bValue);
            }
            // Now we know both arguments are ExtensionIdentifier
            return (a._lower === b._lower);
        }
        /**
         * Gives the value by which to index (for equality).
         */
        static toKey(id) {
            if (typeof id === 'string') {
                return id.toLowerCase();
            }
            return id._lower;
        }
    }
    exports.ExtensionIdentifier = ExtensionIdentifier;
    class ExtensionIdentifierSet {
        get size() {
            return this._set.size;
        }
        constructor(iterable) {
            this._set = new Set();
            if (iterable) {
                for (const value of iterable) {
                    this.add(value);
                }
            }
        }
        add(id) {
            this._set.add(ExtensionIdentifier.toKey(id));
        }
        delete(extensionId) {
            return this._set.delete(ExtensionIdentifier.toKey(extensionId));
        }
        has(id) {
            return this._set.has(ExtensionIdentifier.toKey(id));
        }
    }
    exports.ExtensionIdentifierSet = ExtensionIdentifierSet;
    class ExtensionIdentifierMap {
        constructor() {
            this._map = new Map();
        }
        clear() {
            this._map.clear();
        }
        delete(id) {
            this._map.delete(ExtensionIdentifier.toKey(id));
        }
        get(id) {
            return this._map.get(ExtensionIdentifier.toKey(id));
        }
        has(id) {
            return this._map.has(ExtensionIdentifier.toKey(id));
        }
        set(id, value) {
            this._map.set(ExtensionIdentifier.toKey(id), value);
        }
        values() {
            return this._map.values();
        }
        forEach(callbackfn) {
            this._map.forEach(callbackfn);
        }
        [Symbol.iterator]() {
            return this._map[Symbol.iterator]();
        }
    }
    exports.ExtensionIdentifierMap = ExtensionIdentifierMap;
    function isApplicationScopedExtension(manifest) {
        return isLanguagePackExtension(manifest);
    }
    function isLanguagePackExtension(manifest) {
        return manifest.contributes && manifest.contributes.localizations ? manifest.contributes.localizations.length > 0 : false;
    }
    function isAuthenticationProviderExtension(manifest) {
        return manifest.contributes && manifest.contributes.authentication ? manifest.contributes.authentication.length > 0 : false;
    }
    function isResolverExtension(manifest, remoteAuthority) {
        if (remoteAuthority) {
            const activationEvent = `onResolveRemoteAuthority:${(0, remoteHosts_1.getRemoteName)(remoteAuthority)}`;
            return !!manifest.activationEvents?.includes(activationEvent);
        }
        return false;
    }
    exports.IBuiltinExtensionsScannerService = (0, instantiation_1.createDecorator)('IBuiltinExtensionsScannerService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2TmhHLHdFQU9DO0lBZ1BELG9FQUVDO0lBRUQsMERBRUM7SUFFRCw4RUFFQztJQUVELGtEQU1DO0lBNWRZLFFBQUEsd0JBQXdCLEdBQUcsdUJBQXVCLENBQUM7SUFDbkQsUUFBQSwyQkFBMkIsR0FBRywwQkFBMEIsQ0FBQztJQUN6RCxRQUFBLG1CQUFtQixHQUFHLHFCQUFxQixDQUFDO0lBd001QyxRQUFBLG1CQUFtQixHQUE2QixDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFTeEYsU0FBZ0IsOEJBQThCLENBQUMsV0FBOEY7UUFDNUksSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLElBQUksV0FBVyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQzdELElBQUksV0FBVyxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDcEMsT0FBTyxXQUFXLENBQUMsV0FBVyxDQUFDO1lBQ2hDLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQVFZLFFBQUEsb0JBQW9CLEdBQUc7UUFDbkMsT0FBTztRQUNQLGNBQWM7UUFDZCxXQUFXO1FBQ1gsaUJBQWlCO1FBQ2pCLFdBQVc7UUFDWCxZQUFZO1FBQ1osU0FBUztRQUNULGdCQUFnQjtRQUNoQixTQUFTO1FBQ1Qsa0JBQWtCO1FBQ2xCLFdBQVc7UUFDWCx1QkFBdUI7UUFDdkIsZUFBZTtRQUNmLFVBQVU7UUFDVixTQUFTO1FBQ1QsUUFBUTtRQUNSLGVBQWU7UUFDZixJQUFJO1FBQ0osTUFBTTtRQUNOLE9BQU87S0FDUCxDQUFD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