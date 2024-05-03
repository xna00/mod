/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/process", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, strings_1, extensionManagement_1, extensions_1, platform_1, uri_1, errors_1, process_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BetterMergeId = exports.ExtensionKey = void 0;
    exports.areSameExtensions = areSameExtensions;
    exports.getIdAndVersion = getIdAndVersion;
    exports.getExtensionId = getExtensionId;
    exports.adoptToGalleryExtensionId = adoptToGalleryExtensionId;
    exports.getGalleryExtensionId = getGalleryExtensionId;
    exports.groupByExtension = groupByExtension;
    exports.getLocalExtensionTelemetryData = getLocalExtensionTelemetryData;
    exports.getGalleryExtensionTelemetryData = getGalleryExtensionTelemetryData;
    exports.getExtensionDependencies = getExtensionDependencies;
    exports.computeTargetPlatform = computeTargetPlatform;
    function areSameExtensions(a, b) {
        if (a.uuid && b.uuid) {
            return a.uuid === b.uuid;
        }
        if (a.id === b.id) {
            return true;
        }
        return (0, strings_1.compareIgnoreCase)(a.id, b.id) === 0;
    }
    const ExtensionKeyRegex = /^([^.]+\..+)-(\d+\.\d+\.\d+)(-(.+))?$/;
    class ExtensionKey {
        static create(extension) {
            const version = extension.manifest ? extension.manifest.version : extension.version;
            const targetPlatform = extension.manifest ? extension.targetPlatform : extension.properties.targetPlatform;
            return new ExtensionKey(extension.identifier, version, targetPlatform);
        }
        static parse(key) {
            const matches = ExtensionKeyRegex.exec(key);
            return matches && matches[1] && matches[2] ? new ExtensionKey({ id: matches[1] }, matches[2], matches[4] || undefined) : null;
        }
        constructor(identifier, version, targetPlatform = "undefined" /* TargetPlatform.UNDEFINED */) {
            this.version = version;
            this.targetPlatform = targetPlatform;
            this.id = identifier.id;
        }
        toString() {
            return `${this.id}-${this.version}${this.targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */ ? `-${this.targetPlatform}` : ''}`;
        }
        equals(o) {
            if (!(o instanceof ExtensionKey)) {
                return false;
            }
            return areSameExtensions(this, o) && this.version === o.version && this.targetPlatform === o.targetPlatform;
        }
    }
    exports.ExtensionKey = ExtensionKey;
    const EXTENSION_IDENTIFIER_WITH_VERSION_REGEX = /^([^.]+\..+)@((prerelease)|(\d+\.\d+\.\d+(-.*)?))$/;
    function getIdAndVersion(id) {
        const matches = EXTENSION_IDENTIFIER_WITH_VERSION_REGEX.exec(id);
        if (matches && matches[1]) {
            return [adoptToGalleryExtensionId(matches[1]), matches[2]];
        }
        return [adoptToGalleryExtensionId(id), undefined];
    }
    function getExtensionId(publisher, name) {
        return `${publisher}.${name}`;
    }
    function adoptToGalleryExtensionId(id) {
        return id.toLowerCase();
    }
    function getGalleryExtensionId(publisher, name) {
        return adoptToGalleryExtensionId(getExtensionId(publisher ?? extensions_1.UNDEFINED_PUBLISHER, name));
    }
    function groupByExtension(extensions, getExtensionIdentifier) {
        const byExtension = [];
        const findGroup = (extension) => {
            for (const group of byExtension) {
                if (group.some(e => areSameExtensions(getExtensionIdentifier(e), getExtensionIdentifier(extension)))) {
                    return group;
                }
            }
            return null;
        };
        for (const extension of extensions) {
            const group = findGroup(extension);
            if (group) {
                group.push(extension);
            }
            else {
                byExtension.push([extension]);
            }
        }
        return byExtension;
    }
    function getLocalExtensionTelemetryData(extension) {
        return {
            id: extension.identifier.id,
            name: extension.manifest.name,
            galleryId: null,
            publisherId: extension.publisherId,
            publisherName: extension.manifest.publisher,
            publisherDisplayName: extension.publisherDisplayName,
            dependencies: extension.manifest.extensionDependencies && extension.manifest.extensionDependencies.length > 0
        };
    }
    /* __GDPR__FRAGMENT__
        "GalleryExtensionTelemetryData" : {
            "id" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "name": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "galleryId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherId": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "publisherDisplayName": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "isPreReleaseVersion": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "dependencies": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
            "isSigned": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
            "${include}": [
                "${GalleryExtensionTelemetryData2}"
            ]
        }
    */
    function getGalleryExtensionTelemetryData(extension) {
        return {
            id: new telemetryUtils_1.TelemetryTrustedValue(extension.identifier.id),
            name: new telemetryUtils_1.TelemetryTrustedValue(extension.name),
            galleryId: extension.identifier.uuid,
            publisherId: extension.publisherId,
            publisherName: extension.publisher,
            publisherDisplayName: extension.publisherDisplayName,
            isPreReleaseVersion: extension.properties.isPreReleaseVersion,
            dependencies: !!(extension.properties.dependencies && extension.properties.dependencies.length > 0),
            isSigned: extension.isSigned,
            ...extension.telemetryData
        };
    }
    exports.BetterMergeId = new extensions_1.ExtensionIdentifier('pprice.better-merge');
    function getExtensionDependencies(installedExtensions, extension) {
        const dependencies = [];
        const extensions = extension.manifest.extensionDependencies?.slice(0) ?? [];
        while (extensions.length) {
            const id = extensions.shift();
            if (id && dependencies.every(e => !areSameExtensions(e.identifier, { id }))) {
                const ext = installedExtensions.filter(e => areSameExtensions(e.identifier, { id }));
                if (ext.length === 1) {
                    dependencies.push(ext[0]);
                    extensions.push(...ext[0].manifest.extensionDependencies?.slice(0) ?? []);
                }
            }
        }
        return dependencies;
    }
    async function isAlpineLinux(fileService, logService) {
        if (!platform_1.isLinux) {
            return false;
        }
        let content;
        try {
            const fileContent = await fileService.readFile(uri_1.URI.file('/etc/os-release'));
            content = fileContent.value.toString();
        }
        catch (error) {
            try {
                const fileContent = await fileService.readFile(uri_1.URI.file('/usr/lib/os-release'));
                content = fileContent.value.toString();
            }
            catch (error) {
                /* Ignore */
                logService.debug(`Error while getting the os-release file.`, (0, errors_1.getErrorMessage)(error));
            }
        }
        return !!content && (content.match(/^ID=([^\u001b\r\n]*)/m) || [])[1] === 'alpine';
    }
    async function computeTargetPlatform(fileService, logService) {
        const alpineLinux = await isAlpineLinux(fileService, logService);
        const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(alpineLinux ? 'alpine' : platform_1.platform, process_1.arch);
        logService.debug('ComputeTargetPlatform:', targetPlatform);
        return targetPlatform;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFV0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbk1hbmFnZW1lbnRVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyw4Q0FRQztJQXdDRCwwQ0FNQztJQUVELHdDQUVDO0lBRUQsOERBRUM7SUFFRCxzREFFQztJQUVELDRDQW1CQztJQUVELHdFQVVDO0lBbUJELDRFQWFDO0lBSUQsNERBaUJDO0lBc0JELHNEQUtDO0lBbkxELFNBQWdCLGlCQUFpQixDQUFDLENBQXVCLEVBQUUsQ0FBdUI7UUFDakYsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QixPQUFPLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztRQUMxQixDQUFDO1FBQ0QsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNuQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxPQUFPLElBQUEsMkJBQWlCLEVBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxNQUFNLGlCQUFpQixHQUFHLHVDQUF1QyxDQUFDO0lBRWxFLE1BQWEsWUFBWTtRQUV4QixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQXlDO1lBQ3RELE1BQU0sT0FBTyxHQUFJLFNBQXdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBRSxTQUF3QixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFFLFNBQStCLENBQUMsT0FBTyxDQUFDO1lBQzNJLE1B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