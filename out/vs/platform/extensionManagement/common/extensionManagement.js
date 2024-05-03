/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesLocalizedLabel = exports.ExtensionsLocalizedLabel = exports.IExtensionTipsService = exports.IGlobalExtensionEnablementService = exports.ENABLED_EXTENSIONS_STORAGE_PATH = exports.DISABLED_EXTENSIONS_STORAGE_PATH = exports.IExtensionManagementService = exports.ExtensionGalleryError = exports.ExtensionGalleryErrorCode = exports.ExtensionManagementError = exports.ExtensionSignaturetErrorCode = exports.ExtensionManagementErrorCode = exports.IExtensionGalleryService = exports.InstallOperation = exports.StatisticType = exports.SortOrder = exports.SortBy = exports.EXTENSION_INSTALL_DEP_PACK_CONTEXT = exports.EXTENSION_INSTALL_SYNC_CONTEXT = exports.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT = exports.WEB_EXTENSION_TAG = exports.EXTENSION_IDENTIFIER_REGEX = exports.EXTENSION_IDENTIFIER_PATTERN = void 0;
    exports.TargetPlatformToString = TargetPlatformToString;
    exports.toTargetPlatform = toTargetPlatform;
    exports.getTargetPlatform = getTargetPlatform;
    exports.isNotWebExtensionInWebTargetPlatform = isNotWebExtensionInWebTargetPlatform;
    exports.isTargetPlatformCompatible = isTargetPlatformCompatible;
    exports.isIExtensionIdentifier = isIExtensionIdentifier;
    exports.EXTENSION_IDENTIFIER_PATTERN = '^([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$';
    exports.EXTENSION_IDENTIFIER_REGEX = new RegExp(exports.EXTENSION_IDENTIFIER_PATTERN);
    exports.WEB_EXTENSION_TAG = '__web_extension';
    exports.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT = 'skipWalkthrough';
    exports.EXTENSION_INSTALL_SYNC_CONTEXT = 'extensionsSync';
    exports.EXTENSION_INSTALL_DEP_PACK_CONTEXT = 'dependecyOrPackExtensionInstall';
    function TargetPlatformToString(targetPlatform) {
        switch (targetPlatform) {
            case "win32-x64" /* TargetPlatform.WIN32_X64 */: return 'Windows 64 bit';
            case "win32-arm64" /* TargetPlatform.WIN32_ARM64 */: return 'Windows ARM';
            case "linux-x64" /* TargetPlatform.LINUX_X64 */: return 'Linux 64 bit';
            case "linux-arm64" /* TargetPlatform.LINUX_ARM64 */: return 'Linux ARM 64';
            case "linux-armhf" /* TargetPlatform.LINUX_ARMHF */: return 'Linux ARM';
            case "alpine-x64" /* TargetPlatform.ALPINE_X64 */: return 'Alpine Linux 64 bit';
            case "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */: return 'Alpine ARM 64';
            case "darwin-x64" /* TargetPlatform.DARWIN_X64 */: return 'Mac';
            case "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */: return 'Mac Silicon';
            case "web" /* TargetPlatform.WEB */: return 'Web';
            case "universal" /* TargetPlatform.UNIVERSAL */: return "universal" /* TargetPlatform.UNIVERSAL */;
            case "unknown" /* TargetPlatform.UNKNOWN */: return "unknown" /* TargetPlatform.UNKNOWN */;
            case "undefined" /* TargetPlatform.UNDEFINED */: return "undefined" /* TargetPlatform.UNDEFINED */;
        }
    }
    function toTargetPlatform(targetPlatform) {
        switch (targetPlatform) {
            case "win32-x64" /* TargetPlatform.WIN32_X64 */: return "win32-x64" /* TargetPlatform.WIN32_X64 */;
            case "win32-arm64" /* TargetPlatform.WIN32_ARM64 */: return "win32-arm64" /* TargetPlatform.WIN32_ARM64 */;
            case "linux-x64" /* TargetPlatform.LINUX_X64 */: return "linux-x64" /* TargetPlatform.LINUX_X64 */;
            case "linux-arm64" /* TargetPlatform.LINUX_ARM64 */: return "linux-arm64" /* TargetPlatform.LINUX_ARM64 */;
            case "linux-armhf" /* TargetPlatform.LINUX_ARMHF */: return "linux-armhf" /* TargetPlatform.LINUX_ARMHF */;
            case "alpine-x64" /* TargetPlatform.ALPINE_X64 */: return "alpine-x64" /* TargetPlatform.ALPINE_X64 */;
            case "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */: return "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */;
            case "darwin-x64" /* TargetPlatform.DARWIN_X64 */: return "darwin-x64" /* TargetPlatform.DARWIN_X64 */;
            case "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */: return "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */;
            case "web" /* TargetPlatform.WEB */: return "web" /* TargetPlatform.WEB */;
            case "universal" /* TargetPlatform.UNIVERSAL */: return "universal" /* TargetPlatform.UNIVERSAL */;
            default: return "unknown" /* TargetPlatform.UNKNOWN */;
        }
    }
    function getTargetPlatform(platform, arch) {
        switch (platform) {
            case 3 /* Platform.Windows */:
                if (arch === 'x64') {
                    return "win32-x64" /* TargetPlatform.WIN32_X64 */;
                }
                if (arch === 'arm64') {
                    return "win32-arm64" /* TargetPlatform.WIN32_ARM64 */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 2 /* Platform.Linux */:
                if (arch === 'x64') {
                    return "linux-x64" /* TargetPlatform.LINUX_X64 */;
                }
                if (arch === 'arm64') {
                    return "linux-arm64" /* TargetPlatform.LINUX_ARM64 */;
                }
                if (arch === 'arm') {
                    return "linux-armhf" /* TargetPlatform.LINUX_ARMHF */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 'alpine':
                if (arch === 'x64') {
                    return "alpine-x64" /* TargetPlatform.ALPINE_X64 */;
                }
                if (arch === 'arm64') {
                    return "alpine-arm64" /* TargetPlatform.ALPINE_ARM64 */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 1 /* Platform.Mac */:
                if (arch === 'x64') {
                    return "darwin-x64" /* TargetPlatform.DARWIN_X64 */;
                }
                if (arch === 'arm64') {
                    return "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */;
                }
                return "unknown" /* TargetPlatform.UNKNOWN */;
            case 0 /* Platform.Web */: return "web" /* TargetPlatform.WEB */;
        }
    }
    function isNotWebExtensionInWebTargetPlatform(allTargetPlatforms, productTargetPlatform) {
        // Not a web extension in web target platform
        return productTargetPlatform === "web" /* TargetPlatform.WEB */ && !allTargetPlatforms.includes("web" /* TargetPlatform.WEB */);
    }
    function isTargetPlatformCompatible(extensionTargetPlatform, allTargetPlatforms, productTargetPlatform) {
        // Not compatible when extension is not a web extension in web target platform
        if (isNotWebExtensionInWebTargetPlatform(allTargetPlatforms, productTargetPlatform)) {
            return false;
        }
        // Compatible when extension target platform is not defined
        if (extensionTargetPlatform === "undefined" /* TargetPlatform.UNDEFINED */) {
            return true;
        }
        // Compatible when extension target platform is universal
        if (extensionTargetPlatform === "universal" /* TargetPlatform.UNIVERSAL */) {
            return true;
        }
        // Not compatible when extension target platform is unknown
        if (extensionTargetPlatform === "unknown" /* TargetPlatform.UNKNOWN */) {
            return false;
        }
        // Compatible when extension and product target platforms matches
        if (extensionTargetPlatform === productTargetPlatform) {
            return true;
        }
        return false;
    }
    function isIExtensionIdentifier(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.id === 'string'
            && (!thing.uuid || typeof thing.uuid === 'string');
    }
    var SortBy;
    (function (SortBy) {
        SortBy[SortBy["NoneOrRelevance"] = 0] = "NoneOrRelevance";
        SortBy[SortBy["LastUpdatedDate"] = 1] = "LastUpdatedDate";
        SortBy[SortBy["Title"] = 2] = "Title";
        SortBy[SortBy["PublisherName"] = 3] = "PublisherName";
        SortBy[SortBy["InstallCount"] = 4] = "InstallCount";
        SortBy[SortBy["PublishedDate"] = 10] = "PublishedDate";
        SortBy[SortBy["AverageRating"] = 6] = "AverageRating";
        SortBy[SortBy["WeightedRating"] = 12] = "WeightedRating";
    })(SortBy || (exports.SortBy = SortBy = {}));
    var SortOrder;
    (function (SortOrder) {
        SortOrder[SortOrder["Default"] = 0] = "Default";
        SortOrder[SortOrder["Ascending"] = 1] = "Ascending";
        SortOrder[SortOrder["Descending"] = 2] = "Descending";
    })(SortOrder || (exports.SortOrder = SortOrder = {}));
    var StatisticType;
    (function (StatisticType) {
        StatisticType["Install"] = "install";
        StatisticType["Uninstall"] = "uninstall";
    })(StatisticType || (exports.StatisticType = StatisticType = {}));
    var InstallOperation;
    (function (InstallOperation) {
        InstallOperation[InstallOperation["None"] = 1] = "None";
        InstallOperation[InstallOperation["Install"] = 2] = "Install";
        InstallOperation[InstallOperation["Update"] = 3] = "Update";
        InstallOperation[InstallOperation["Migrate"] = 4] = "Migrate";
    })(InstallOperation || (exports.InstallOperation = InstallOperation = {}));
    exports.IExtensionGalleryService = (0, instantiation_1.createDecorator)('extensionGalleryService');
    var ExtensionManagementErrorCode;
    (function (ExtensionManagementErrorCode) {
        ExtensionManagementErrorCode["Unsupported"] = "Unsupported";
        ExtensionManagementErrorCode["Deprecated"] = "Deprecated";
        ExtensionManagementErrorCode["Malicious"] = "Malicious";
        ExtensionManagementErrorCode["Incompatible"] = "Incompatible";
        ExtensionManagementErrorCode["IncompatibleTargetPlatform"] = "IncompatibleTargetPlatform";
        ExtensionManagementErrorCode["ReleaseVersionNotFound"] = "ReleaseVersionNotFound";
        ExtensionManagementErrorCode["Invalid"] = "Invalid";
        ExtensionManagementErrorCode["Download"] = "Download";
        ExtensionManagementErrorCode["DownloadSignature"] = "DownloadSignature";
        ExtensionManagementErrorCode["UpdateMetadata"] = "UpdateMetadata";
        ExtensionManagementErrorCode["Extract"] = "Extract";
        ExtensionManagementErrorCode["Scanning"] = "Scanning";
        ExtensionManagementErrorCode["Delete"] = "Delete";
        ExtensionManagementErrorCode["Rename"] = "Rename";
        ExtensionManagementErrorCode["CorruptZip"] = "CorruptZip";
        ExtensionManagementErrorCode["IncompleteZip"] = "IncompleteZip";
        ExtensionManagementErrorCode["Signature"] = "Signature";
        ExtensionManagementErrorCode["NotAllowed"] = "NotAllowed";
        ExtensionManagementErrorCode["Gallery"] = "Gallery";
        ExtensionManagementErrorCode["Unknown"] = "Unknown";
        ExtensionManagementErrorCode["Internal"] = "Internal";
    })(ExtensionManagementErrorCode || (exports.ExtensionManagementErrorCode = ExtensionManagementErrorCode = {}));
    var ExtensionSignaturetErrorCode;
    (function (ExtensionSignaturetErrorCode) {
        ExtensionSignaturetErrorCode["UnknownError"] = "UnknownError";
        ExtensionSignaturetErrorCode["PackageIsInvalidZip"] = "PackageIsInvalidZip";
        ExtensionSignaturetErrorCode["SignatureArchiveIsInvalidZip"] = "SignatureArchiveIsInvalidZip";
    })(ExtensionSignaturetErrorCode || (exports.ExtensionSignaturetErrorCode = ExtensionSignaturetErrorCode = {}));
    class ExtensionManagementError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
            this.name = code;
        }
    }
    exports.ExtensionManagementError = ExtensionManagementError;
    var ExtensionGalleryErrorCode;
    (function (ExtensionGalleryErrorCode) {
        ExtensionGalleryErrorCode["Timeout"] = "Timeout";
        ExtensionGalleryErrorCode["Cancelled"] = "Cancelled";
        ExtensionGalleryErrorCode["Failed"] = "Failed";
    })(ExtensionGalleryErrorCode || (exports.ExtensionGalleryErrorCode = ExtensionGalleryErrorCode = {}));
    class ExtensionGalleryError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
            this.name = code;
        }
    }
    exports.ExtensionGalleryError = ExtensionGalleryError;
    exports.IExtensionManagementService = (0, instantiation_1.createDecorator)('extensionManagementService');
    exports.DISABLED_EXTENSIONS_STORAGE_PATH = 'extensionsIdentifiers/disabled';
    exports.ENABLED_EXTENSIONS_STORAGE_PATH = 'extensionsIdentifiers/enabled';
    exports.IGlobalExtensionEnablementService = (0, instantiation_1.createDecorator)('IGlobalExtensionEnablementService');
    exports.IExtensionTipsService = (0, instantiation_1.createDecorator)('IExtensionTipsService');
    exports.ExtensionsLocalizedLabel = (0, nls_1.localize2)('extensions', "Extensions");
    exports.PreferencesLocalizedLabel = (0, nls_1.localize2)('preferences', 'Preferences');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uTWFuYWdlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLHdEQXFCQztJQUVELDRDQW9CQztJQUVELDhDQTJDQztJQUVELG9GQUdDO0lBRUQsZ0VBMkJDO0lBNEJELHdEQUtDO0lBdktZLFFBQUEsNEJBQTRCLEdBQUcsMkRBQTJELENBQUM7SUFDM0YsUUFBQSwwQkFBMEIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxvQ0FBNEIsQ0FBQyxDQUFDO0lBQ3RFLFFBQUEsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7SUFDdEMsUUFBQSwwQ0FBMEMsR0FBRyxpQkFBaUIsQ0FBQztJQUMvRCxRQUFBLDhCQUE4QixHQUFHLGdCQUFnQixDQUFDO0lBQ2xELFFBQUEsa0NBQWtDLEdBQUcsaUNBQWlDLENBQUM7SUFPcEYsU0FBZ0Isc0JBQXNCLENBQUMsY0FBOEI7UUFDcEUsUUFBUSxjQUFjLEVBQUUsQ0FBQztZQUN4QiwrQ0FBNkIsQ0FBQyxDQUFDLE9BQU8sZ0JBQWdCLENBQUM7WUFDdkQsbURBQStCLENBQUMsQ0FBQyxPQUFPLGFBQWEsQ0FBQztZQUV0RCwrQ0FBNkIsQ0FBQyxDQUFDLE9BQU8sY0FBYyxDQUFDO1lBQ3JELG1EQUErQixDQUFDLENBQUMsT0FBTyxjQUFjLENBQUM7WUFDdkQsbURBQStCLENBQUMsQ0FBQyxPQUFPLFdBQVcsQ0FBQztZQUVwRCxpREFBOEIsQ0FBQyxDQUFDLE9BQU8scUJBQXFCLENBQUM7WUFDN0QscURBQWdDLENBQUMsQ0FBQyxPQUFPLGVBQWUsQ0FBQztZQUV6RCxpREFBOEIsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDO1lBQzdDLHFEQUFnQyxDQUFDLENBQUMsT0FBTyxhQUFhLENBQUM7WUFFdkQsbUNBQXVCLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQztZQUV0QywrQ0FBNkIsQ0FBQyxDQUFDLGtEQUFnQztZQUMvRCwyQ0FBMkIsQ0FBQyxDQUFDLDhDQUE4QjtZQUMzRCwrQ0FBNkIsQ0FBQyxDQUFDLGtEQUFnQztRQUNoRSxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGdCQUFnQixDQUFDLGNBQXNCO1FBQ3RELFFBQVEsY0FBYyxFQUFFLENBQUM7WUFDeEIsK0NBQTZCLENBQUMsQ0FBQyxrREFBZ0M7WUFDL0QsbURBQStCLENBQUMsQ0FBQyxzREFBa0M7WUFFbkUsK0NBQTZCLENBQUMsQ0FBQyxrREFBZ0M7WUFDL0QsbURBQStCLENBQUMsQ0FBQyxzREFBa0M7WUFDbkUsbURBQStCLENBQUMsQ0FBQyxzREFBa0M7WUFFbkUsaURBQThCLENBQUMsQ0FBQyxvREFBaUM7WUFDakUscURBQWdDLENBQUMsQ0FBQyx3REFBbUM7WUFFckUsaURBQThCLENBQUMsQ0FBQyxvREFBaUM7WUFDakUscURBQWdDLENBQUMsQ0FBQyx3REFBbUM7WUFFckUsbUNBQXVCLENBQUMsQ0FBQyxzQ0FBMEI7WUFFbkQsK0NBQTZCLENBQUMsQ0FBQyxrREFBZ0M7WUFDL0QsT0FBTyxDQUFDLENBQUMsOENBQThCO1FBQ3hDLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsaUJBQWlCLENBQUMsUUFBNkIsRUFBRSxJQUF3QjtRQUN4RixRQUFRLFFBQVEsRUFBRSxDQUFDO1lBQ2xCO2dCQUNDLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUNwQixrREFBZ0M7Z0JBQ2pDLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQ3RCLHNEQUFrQztnQkFDbkMsQ0FBQztnQkFDRCw4Q0FBOEI7WUFFL0I7Z0JBQ0MsSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFLENBQUM7b0JBQ3BCLGtEQUFnQztnQkFDakMsQ0FBQztnQkFDRCxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDdEIsc0RBQWtDO2dCQUNuQyxDQUFDO2dCQUNELElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUNwQixzREFBa0M7Z0JBQ25DLENBQUM7Z0JBQ0QsOENBQThCO1lBRS9CLEtBQUssUUFBUTtnQkFDWixJQUFJLElBQUksS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDcEIsb0RBQWlDO2dCQUNsQyxDQUFDO2dCQUNELElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO29CQUN0Qix3REFBbUM7Z0JBQ3BDLENBQUM7Z0JBQ0QsOENBQThCO1lBRS9CO2dCQUNDLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUNwQixvREFBaUM7Z0JBQ2xDLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQ3RCLHdEQUFtQztnQkFDcEMsQ0FBQztnQkFDRCw4Q0FBOEI7WUFFL0IseUJBQWlCLENBQUMsQ0FBQyxzQ0FBMEI7UUFDOUMsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFnQixvQ0FBb0MsQ0FBQyxrQkFBb0MsRUFBRSxxQkFBcUM7UUFDL0gsNkNBQTZDO1FBQzdDLE9BQU8scUJBQXFCLG1DQUF1QixJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxnQ0FBb0IsQ0FBQztJQUN6RyxDQUFDO0lBRUQsU0FBZ0IsMEJBQTBCLENBQUMsdUJBQXVDLEVBQUUsa0JBQW9DLEVBQUUscUJBQXFDO1FBQzlKLDhFQUE4RTtRQUM5RSxJQUFJLG9DQUFvQyxDQUFDLGtCQUFrQixFQUFFLHFCQUFxQixDQUFDLEVBQUUsQ0FBQztZQUNyRixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCwyREFBMkQ7UUFDM0QsSUFBSSx1QkFBdUIsK0NBQTZCLEVBQUUsQ0FBQztZQUMxRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCx5REFBeUQ7UUFDekQsSUFBSSx1QkFBdUIsK0NBQTZCLEVBQUUsQ0FBQztZQUMxRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCwyREFBMkQ7UUFDM0QsSUFBSSx1QkFBdUIsMkNBQTJCLEVBQUUsQ0FBQztZQUN4RCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxpRUFBaUU7UUFDakUsSUFBSSx1QkFBdUIsS0FBSyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3ZELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQTRCRCxTQUFnQixzQkFBc0IsQ0FBQyxLQUFVO1FBQ2hELE9BQU8sS0FBSztlQUNSLE9BQU8sS0FBSyxLQUFLLFFBQVE7ZUFDekIsT0FBTyxLQUFLLENBQUMsRUFBRSxLQUFLLFFBQVE7ZUFDNUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFxRkQsSUFBa0IsTUFTakI7SUFURCxXQUFrQixNQUFNO1FBQ3ZCLHlEQUFtQixDQUFBO1FBQ25CLHlEQUFtQixDQUFBO1FBQ25CLHFDQUFTLENBQUE7UUFDVCxxREFBaUIsQ0FBQTtRQUNqQixtREFBZ0IsQ0FBQTtRQUNoQixzREFBa0IsQ0FBQTtRQUNsQixxREFBaUIsQ0FBQTtRQUNqQix3REFBbUIsQ0FBQTtJQUNwQixDQUFDLEVBVGlCLE1BQU0sc0JBQU4sTUFBTSxRQVN2QjtJQUVELElBQWtCLFNBSWpCO0lBSkQsV0FBa0IsU0FBUztRQUMxQiwrQ0FBVyxDQUFBO1FBQ1gsbURBQWEsQ0FBQTtRQUNiLHFEQUFjLENBQUE7SUFDZixDQUFDLEVBSmlCLFNBQVMseUJBQVQsU0FBUyxRQUkxQjtJQWNELElBQWtCLGFBR2pCO0lBSEQsV0FBa0IsYUFBYTtRQUM5QixvQ0FBbUIsQ0FBQTtRQUNuQix3Q0FBdUIsQ0FBQTtJQUN4QixDQUFDLEVBSGlCLGFBQWEsNkJBQWIsYUFBYSxRQUc5QjtJQXlCRCxJQUFrQixnQkFLakI7SUFMRCxXQUFrQixnQkFBZ0I7UUFDakMsdURBQVEsQ0FBQTtRQUNSLDZEQUFPLENBQUE7UUFDUCwyREFBTSxDQUFBO1FBQ04sNkRBQU8sQ0FBQTtJQUNSLENBQUMsRUFMaUIsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFLakM7SUFvQlksUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLHlCQUF5QixDQUFDLENBQUM7SUE0RDdHLElBQVksNEJBc0JYO0lBdEJELFdBQVksNEJBQTRCO1FBQ3ZDLDJEQUEyQixDQUFBO1FBQzNCLHlEQUF5QixDQUFBO1FBQ3pCLHVEQUF1QixDQUFBO1FBQ3ZCLDZEQUE2QixDQUFBO1FBQzdCLHlGQUF5RCxDQUFBO1FBQ3pELGlGQUFpRCxDQUFBO1FBQ2pELG1EQUFtQixDQUFBO1FBQ25CLHFEQUFxQixDQUFBO1FBQ3JCLHVFQUF1QyxDQUFBO1FBQ3ZDLGlFQUFpQyxDQUFBO1FBQ2pDLG1EQUFtQixDQUFBO1FBQ25CLHFEQUFxQixDQUFBO1FBQ3JCLGlEQUFpQixDQUFBO1FBQ2pCLGlEQUFpQixDQUFBO1FBQ2pCLHlEQUF5QixDQUFBO1FBQ3pCLCtEQUErQixDQUFBO1FBQy9CLHVEQUF1QixDQUFBO1FBQ3ZCLHlEQUF5QixDQUFBO1FBQ3pCLG1EQUFtQixDQUFBO1FBQ25CLG1EQUFtQixDQUFBO1FBQ25CLHFEQUFxQixDQUFBO0lBQ3RCLENBQUMsRUF0QlcsNEJBQTRCLDRDQUE1Qiw0QkFBNEIsUUFzQnZDO0lBRUQsSUFBWSw0QkFJWDtJQUpELFdBQVksNEJBQTRCO1FBQ3ZDLDZEQUE2QixDQUFBO1FBQzdCLDJFQUEyQyxDQUFBO1FBQzNDLDZGQUE2RCxDQUFBO0lBQzlELENBQUMsRUFKVyw0QkFBNEIsNENBQTVCLDRCQUE0QixRQUl2QztJQUVELE1BQWEsd0JBQXlCLFNBQVEsS0FBSztRQUNsRCxZQUFZLE9BQWUsRUFBVyxJQUFrQztZQUN2RSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFEc0IsU0FBSSxHQUFKLElBQUksQ0FBOEI7WUFFdkUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBTEQsNERBS0M7SUFFRCxJQUFZLHlCQUlYO0lBSkQsV0FBWSx5QkFBeUI7UUFDcEMsZ0RBQW1CLENBQUE7UUFDbkIsb0RBQXVCLENBQUE7UUFDdkIsOENBQWlCLENBQUE7SUFDbEIsQ0FBQyxFQUpXLHlCQUF5Qix5Q0FBekIseUJBQXlCLFFBSXBDO0lBRUQsTUFBYSxxQkFBc0IsU0FBUSxLQUFLO1FBQy9DLFlBQVksT0FBZSxFQUFXLElBQStCO1lBQ3BFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQURzQixTQUFJLEdBQUosSUFBSSxDQUEyQjtZQUVwRSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFMRCxzREFLQztJQStCWSxRQUFBLDJCQUEyQixHQUFHLElBQUEsK0JBQWUsRUFBOEIsNEJBQTRCLENBQUMsQ0FBQztJQW1DekcsUUFBQSxnQ0FBZ0MsR0FBRyxnQ0FBZ0MsQ0FBQztJQUNwRSxRQUFBLCtCQUErQixHQUFHLCtCQUErQixDQUFDO0lBQ2xFLFFBQUEsaUNBQWlDLEdBQUcsSUFBQSwrQkFBZSxFQUFvQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBK0I1SCxRQUFBLHFCQUFxQixHQUFHLElBQUEsK0JBQWUsRUFBd0IsdUJBQXVCLENBQUMsQ0FBQztJQVN4RixRQUFBLHdCQUF3QixHQUFHLElBQUEsZUFBUyxFQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNqRSxRQUFBLHlCQUF5QixHQUFHLElBQUEsZUFBUyxFQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQyJ9