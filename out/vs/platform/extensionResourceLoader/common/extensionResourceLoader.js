/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/network"], function (require, exports, platform_1, strings_1, uri_1, instantiation_1, serviceMachineId_1, telemetryUtils_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractExtensionResourceLoaderService = exports.IExtensionResourceLoaderService = void 0;
    exports.migratePlatformSpecificExtensionGalleryResourceURL = migratePlatformSpecificExtensionGalleryResourceURL;
    const WEB_EXTENSION_RESOURCE_END_POINT_SEGMENT = '/web-extension-resource/';
    exports.IExtensionResourceLoaderService = (0, instantiation_1.createDecorator)('extensionResourceLoaderService');
    function migratePlatformSpecificExtensionGalleryResourceURL(resource, targetPlatform) {
        if (resource.query !== `target=${targetPlatform}`) {
            return undefined;
        }
        const paths = resource.path.split('/');
        if (!paths[3]) {
            return undefined;
        }
        paths[3] = `${paths[3]}+${targetPlatform}`;
        return resource.with({ query: null, path: paths.join('/') });
    }
    class AbstractExtensionResourceLoaderService {
        constructor(_fileService, _storageService, _productService, _environmentService, _configurationService) {
            this._fileService = _fileService;
            this._storageService = _storageService;
            this._productService = _productService;
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            if (_productService.extensionsGallery) {
                this._extensionGalleryResourceUrlTemplate = _productService.extensionsGallery.resourceUrlTemplate;
                this._extensionGalleryAuthority = this._extensionGalleryResourceUrlTemplate ? this._getExtensionGalleryAuthority(uri_1.URI.parse(this._extensionGalleryResourceUrlTemplate)) : undefined;
            }
        }
        get supportsExtensionGalleryResources() {
            return this._extensionGalleryResourceUrlTemplate !== undefined;
        }
        getExtensionGalleryResourceURL({ publisher, name, version, targetPlatform }, path) {
            if (this._extensionGalleryResourceUrlTemplate) {
                const uri = uri_1.URI.parse((0, strings_1.format2)(this._extensionGalleryResourceUrlTemplate, {
                    publisher,
                    name,
                    version: targetPlatform !== undefined
                        && targetPlatform !== "undefined" /* TargetPlatform.UNDEFINED */
                        && targetPlatform !== "unknown" /* TargetPlatform.UNKNOWN */
                        && targetPlatform !== "universal" /* TargetPlatform.UNIVERSAL */
                        ? `${version}+${targetPlatform}`
                        : version,
                    path: 'extension'
                }));
                return this._isWebExtensionResourceEndPoint(uri) ? uri.with({ scheme: network_1.RemoteAuthorities.getPreferredWebSchema() }) : uri;
            }
            return undefined;
        }
        isExtensionGalleryResource(uri) {
            return !!this._extensionGalleryAuthority && this._extensionGalleryAuthority === this._getExtensionGalleryAuthority(uri);
        }
        async getExtensionGalleryRequestHeaders() {
            const headers = {
                'X-Client-Name': `${this._productService.applicationName}${platform_1.isWeb ? '-web' : ''}`,
                'X-Client-Version': this._productService.version
            };
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService) === 3 /* TelemetryLevel.USAGE */) {
                headers['X-Machine-Id'] = await this._getServiceMachineId();
            }
            if (this._productService.commit) {
                headers['X-Client-Commit'] = this._productService.commit;
            }
            return headers;
        }
        _getServiceMachineId() {
            if (!this._serviceMachineIdPromise) {
                this._serviceMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(this._environmentService, this._fileService, this._storageService);
            }
            return this._serviceMachineIdPromise;
        }
        _getExtensionGalleryAuthority(uri) {
            if (this._isWebExtensionResourceEndPoint(uri)) {
                return uri.authority;
            }
            const index = uri.authority.indexOf('.');
            return index !== -1 ? uri.authority.substring(index + 1) : undefined;
        }
        _isWebExtensionResourceEndPoint(uri) {
            const uriPath = uri.path, serverRootPath = network_1.RemoteAuthorities.getServerRootPath();
            // test if the path starts with the server root path followed by the web extension resource end point segment
            return uriPath.startsWith(serverRootPath) && uriPath.startsWith(WEB_EXTENSION_RESOURCE_END_POINT_SEGMENT, serverRootPath.length);
        }
    }
    exports.AbstractExtensionResourceLoaderService = AbstractExtensionResourceLoaderService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVzb3VyY2VMb2FkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvblJlc291cmNlTG9hZGVyL2NvbW1vbi9leHRlbnNpb25SZXNvdXJjZUxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpRGhHLGdIQVVDO0lBekNELE1BQU0sd0NBQXdDLEdBQUcsMEJBQTBCLENBQUM7SUFFL0QsUUFBQSwrQkFBK0IsR0FBRyxJQUFBLCtCQUFlLEVBQWtDLGdDQUFnQyxDQUFDLENBQUM7SUE2QmxJLFNBQWdCLGtEQUFrRCxDQUFDLFFBQWEsRUFBRSxjQUE4QjtRQUMvRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLEtBQUssVUFBVSxjQUFjLEVBQUUsRUFBRSxDQUFDO1lBQ25ELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFDRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDZixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQzNDLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRCxNQUFzQixzQ0FBc0M7UUFPM0QsWUFDb0IsWUFBMEIsRUFDNUIsZUFBZ0MsRUFDaEMsZUFBZ0MsRUFDaEMsbUJBQXdDLEVBQ3hDLHFC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