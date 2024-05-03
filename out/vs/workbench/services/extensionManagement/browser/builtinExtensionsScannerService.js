/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/base/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/network", "vs/base/common/uri", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/product/common/productService", "vs/platform/extensionManagement/common/extensionNls", "vs/platform/log/common/log", "vs/base/browser/window"], function (require, exports, extensions_1, platform_1, environmentService_1, uriIdentity_1, extensions_2, extensionManagementUtil_1, network_1, uri_1, extensionResourceLoader_1, productService_1, extensionNls_1, log_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BuiltinExtensionsScannerService = void 0;
    let BuiltinExtensionsScannerService = class BuiltinExtensionsScannerService {
        constructor(environmentService, uriIdentityService, extensionResourceLoaderService, productService, logService) {
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.logService = logService;
            this.builtinExtensionsPromises = [];
            if (platform_1.isWeb) {
                const nlsBaseUrl = productService.extensionsGallery?.nlsBaseUrl;
                // Only use the nlsBaseUrl if we are using a language other than the default, English.
                if (nlsBaseUrl && productService.commit && !platform_1.Language.isDefaultVariant()) {
                    this.nlsUrl = uri_1.URI.joinPath(uri_1.URI.parse(nlsBaseUrl), productService.commit, productService.version, platform_1.Language.value());
                }
                const builtinExtensionsServiceUrl = network_1.FileAccess.asBrowserUri(network_1.builtinExtensionsPath);
                if (builtinExtensionsServiceUrl) {
                    let bundledExtensions = [];
                    if (environmentService.isBuilt) {
                        // Built time configuration (do NOT modify)
                        bundledExtensions = [ /*BUILD->INSERT_BUILTIN_EXTENSIONS*/];
                    }
                    else {
                        // Find builtin extensions by checking for DOM
                        const builtinExtensionsElement = window_1.mainWindow.document.getElementById('vscode-workbench-builtin-extensions');
                        const builtinExtensionsElementAttribute = builtinExtensionsElement ? builtinExtensionsElement.getAttribute('data-settings') : undefined;
                        if (builtinExtensionsElementAttribute) {
                            try {
                                bundledExtensions = JSON.parse(builtinExtensionsElementAttribute);
                            }
                            catch (error) { /* ignore error*/ }
                        }
                    }
                    this.builtinExtensionsPromises = bundledExtensions.map(async (e) => {
                        const id = (0, extensionManagementUtil_1.getGalleryExtensionId)(e.packageJSON.publisher, e.packageJSON.name);
                        return {
                            identifier: { id },
                            location: uriIdentityService.extUri.joinPath(builtinExtensionsServiceUrl, e.extensionPath),
                            type: 0 /* ExtensionType.System */,
                            isBuiltin: true,
                            manifest: e.packageNLS ? await this.localizeManifest(id, e.packageJSON, e.packageNLS) : e.packageJSON,
                            readmeUrl: e.readmePath ? uriIdentityService.extUri.joinPath(builtinExtensionsServiceUrl, e.readmePath) : undefined,
                            changelogUrl: e.changelogPath ? uriIdentityService.extUri.joinPath(builtinExtensionsServiceUrl, e.changelogPath) : undefined,
                            targetPlatform: "web" /* TargetPlatform.WEB */,
                            validations: [],
                            isValid: true
                        };
                    });
                }
            }
        }
        async scanBuiltinExtensions() {
            return [...await Promise.all(this.builtinExtensionsPromises)];
        }
        async localizeManifest(extensionId, manifest, fallbackTranslations) {
            if (!this.nlsUrl) {
                return (0, extensionNls_1.localizeManifest)(this.logService, manifest, fallbackTranslations);
            }
            // the `package` endpoint returns the translations in a key-value format similar to the package.nls.json file.
            const uri = uri_1.URI.joinPath(this.nlsUrl, extensionId, 'package');
            try {
                const res = await this.extensionResourceLoaderService.readExtensionResource(uri);
                const json = JSON.parse(res.toString());
                return (0, extensionNls_1.localizeManifest)(this.logService, manifest, json, fallbackTranslations);
            }
            catch (e) {
                this.logService.error(e);
                return (0, extensionNls_1.localizeManifest)(this.logService, manifest, fallbackTranslations);
            }
        }
    };
    exports.BuiltinExtensionsScannerService = BuiltinExtensionsScannerService;
    exports.BuiltinExtensionsScannerService = BuiltinExtensionsScannerService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, productService_1.IProductService),
        __param(4, log_1.ILogService)
    ], BuiltinExtensionsScannerService);
    (0, extensions_2.registerSingleton)(extensions_1.IBuiltinExtensionsScannerService, BuiltinExtensionsScannerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHRpbkV4dGVuc2lvbnNTY2FubmVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbk1hbmFnZW1lbnQvYnJvd3Nlci9idWlsdGluRXh0ZW5zaW9uc1NjYW5uZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdCekYsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBK0I7UUFRM0MsWUFDK0Isa0JBQWdELEVBQ3pELGtCQUF1QyxFQUMzQiw4QkFBZ0YsRUFDaEcsY0FBK0IsRUFDbkMsVUFBd0M7WUFGSCxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWlDO1lBRW5GLGVBQVUsR0FBVixVQUFVLENBQWE7WUFUckMsOEJBQXlCLEdBQTBCLEVBQUUsQ0FBQztZQVd0RSxJQUFJLGdCQUFLLEVBQUUsQ0FBQztnQkFDWCxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDO2dCQUNoRSxzRkFBc0Y7Z0JBQ3RGLElBQUksVUFBVSxJQUFJLGNBQWMsQ0FBQyxNQUFNLElBQUksQ0FBQyxtQkFBUSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQztvQkFDekUsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFHLENBQUMsUUFBUSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsY0FBYyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsT0FBTyxFQUFFLG1CQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDcEgsQ0FBQztnQkFFRCxNQUFNLDJCQUEyQixHQUFHLG9CQUFVLENBQUMsWUFBWSxDQUFDLCtCQUFxQixDQUFDLENBQUM7Z0JBQ25GLElBQUksMkJBQTJCLEVBQUUsQ0FBQztv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