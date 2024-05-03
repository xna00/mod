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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/arrays", "vs/platform/product/common/productService", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/base/common/types", "vs/platform/workspace/common/workspaceTrust", "vs/platform/log/common/log", "vs/base/common/platform"], function (require, exports, configuration_1, extensions_1, extensionsRegistry_1, extensionManagementUtil_1, arrays_1, productService_1, instantiation_1, extensions_2, lifecycle_1, workspaceTrust_1, types_1, workspaceTrust_2, log_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManifestPropertiesService = exports.IExtensionManifestPropertiesService = void 0;
    exports.IExtensionManifestPropertiesService = (0, instantiation_1.createDecorator)('extensionManifestPropertiesService');
    let ExtensionManifestPropertiesService = class ExtensionManifestPropertiesService extends lifecycle_1.Disposable {
        constructor(productService, configurationService, workspaceTrustEnablementService, logService) {
            super();
            this.productService = productService;
            this.configurationService = configurationService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.logService = logService;
            this._extensionPointExtensionKindsMap = null;
            this._productExtensionKindsMap = null;
            this._configuredExtensionKindsMap = null;
            this._productVirtualWorkspaceSupportMap = null;
            this._configuredVirtualWorkspaceSupportMap = null;
            // Workspace trust request type (settings.json)
            this._configuredExtensionWorkspaceTrustRequestMap = new extensions_1.ExtensionIdentifierMap();
            const configuredExtensionWorkspaceTrustRequests = configurationService.inspect(workspaceTrust_1.WORKSPACE_TRUST_EXTENSION_SUPPORT).userValue || {};
            for (const id of Object.keys(configuredExtensionWorkspaceTrustRequests)) {
                this._configuredExtensionWorkspaceTrustRequestMap.set(id, configuredExtensionWorkspaceTrustRequests[id]);
            }
            // Workspace trust request type (product.json)
            this._productExtensionWorkspaceTrustRequestMap = new Map();
            if (productService.extensionUntrustedWorkspaceSupport) {
                for (const id of Object.keys(productService.extensionUntrustedWorkspaceSupport)) {
                    this._productExtensionWorkspaceTrustRequestMap.set(id, productService.extensionUntrustedWorkspaceSupport[id]);
                }
            }
        }
        prefersExecuteOnUI(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'ui');
        }
        prefersExecuteOnWorkspace(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'workspace');
        }
        prefersExecuteOnWeb(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'web');
        }
        canExecuteOnUI(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'ui');
        }
        canExecuteOnWorkspace(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'workspace');
        }
        canExecuteOnWeb(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'web');
        }
        getExtensionKind(manifest) {
            const deducedExtensionKind = this.deduceExtensionKind(manifest);
            const configuredExtensionKind = this.getConfiguredExtensionKind(manifest);
            if (configuredExtensionKind && configuredExtensionKind.length > 0) {
                const result = [];
                for (const extensionKind of configuredExtensionKind) {
                    if (extensionKind !== '-web') {
                        result.push(extensionKind);
                    }
                }
                // If opted out from web without specifying other extension kinds then default to ui, workspace
                if (configuredExtensionKind.includes('-web') && !result.length) {
                    result.push('ui');
                    result.push('workspace');
                }
                // Add web kind if not opted out from web and can run in web
                if (platform_1.isWeb && !configuredExtensionKind.includes('-web') && !configuredExtensionKind.includes('web') && deducedExtensionKind.includes('web')) {
                    result.push('web');
                }
                return result;
            }
            return deducedExtensionKind;
        }
        getUserConfiguredExtensionKind(extensionIdentifier) {
            if (this._configuredExtensionKindsMap === null) {
                const configuredExtensionKindsMap = new extensions_1.ExtensionIdentifierMap();
                const configuredExtensionKinds = this.configurationService.getValue('remote.extensionKind') || {};
                for (const id of Object.keys(configuredExtensionKinds)) {
                    configuredExtensionKindsMap.set(id, configuredExtensionKinds[id]);
                }
                this._configuredExtensionKindsMap = configuredExtensionKindsMap;
            }
            const userConfiguredExtensionKind = this._configuredExtensionKindsMap.get(extensionIdentifier.id);
            return userConfiguredExtensionKind ? this.toArray(userConfiguredExtensionKind) : undefined;
        }
        getExtensionUntrustedWorkspaceSupportType(manifest) {
            // Workspace trust feature is disabled, or extension has no entry point
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled() || !manifest.main) {
                return true;
            }
            // Get extension workspace trust requirements from settings.json
            const configuredWorkspaceTrustRequest = this.getConfiguredExtensionWorkspaceTrustRequest(manifest);
            // Get extension workspace trust requirements from product.json
            const productWorkspaceTrustRequest = this.getProductExtensionWorkspaceTrustRequest(manifest);
            // Use settings.json override value if it exists
            if (configuredWorkspaceTrustRequest !== undefined) {
                return configuredWorkspaceTrustRequest;
            }
            // Use product.json override value if it exists
            if (productWorkspaceTrustRequest?.override !== undefined) {
                return productWorkspaceTrustRequest.override;
            }
            // Use extension manifest value if it exists
            if (manifest.capabilities?.untrustedWorkspaces?.supported !== undefined) {
                return manifest.capabilities.untrustedWorkspaces.supported;
            }
            // Use product.json default value if it exists
            if (productWorkspaceTrustRequest?.default !== undefined) {
                return productWorkspaceTrustRequest.default;
            }
            return false;
        }
        getExtensionVirtualWorkspaceSupportType(manifest) {
            // check user configured
            const userConfiguredVirtualWorkspaceSupport = this.getConfiguredVirtualWorkspaceSupport(manifest);
            if (userConfiguredVirtualWorkspaceSupport !== undefined) {
                return userConfiguredVirtualWorkspaceSupport;
            }
            const productConfiguredWorkspaceSchemes = this.getProductVirtualWorkspaceSupport(manifest);
            // check override from product
            if (productConfiguredWorkspaceSchemes?.override !== undefined) {
                return productConfiguredWorkspaceSchemes.override;
            }
            // check the manifest
            const virtualWorkspaces = manifest.capabilities?.virtualWorkspaces;
            if ((0, types_1.isBoolean)(virtualWorkspaces)) {
                return virtualWorkspaces;
            }
            else if (virtualWorkspaces) {
                const supported = virtualWorkspaces.supported;
                if ((0, types_1.isBoolean)(supported) || supported === 'limited') {
                    return supported;
                }
            }
            // check default from product
            if (productConfiguredWorkspaceSchemes?.default !== undefined) {
                return productConfiguredWorkspaceSchemes.default;
            }
            // Default - supports virtual workspace
            return true;
        }
        deduceExtensionKind(manifest) {
            // Not an UI extension if it has main
            if (manifest.main) {
                if (manifest.browser) {
                    return platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
                }
                return ['workspace'];
            }
            if (manifest.browser) {
                return ['web'];
            }
            let result = [...extensions_1.ALL_EXTENSION_KINDS];
            if ((0, arrays_1.isNonEmptyArray)(manifest.extensionPack) || (0, arrays_1.isNonEmptyArray)(manifest.extensionDependencies)) {
                // Extension pack defaults to [workspace, web] in web and only [workspace] in desktop
                result = platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
            }
            if (manifest.contributes) {
                for (const contribution of Object.keys(manifest.contributes)) {
                    const supportedExtensionKinds = this.getSupportedExtensionKindsForExtensionPoint(contribution);
                    if (supportedExtensionKinds.length) {
                        result = result.filter(extensionKind => supportedExtensionKinds.includes(extensionKind));
                    }
                }
            }
            if (!result.length) {
                this.logService.warn('Cannot deduce extensionKind for extension', (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name));
            }
            return result;
        }
        getSupportedExtensionKindsForExtensionPoint(extensionPoint) {
            if (this._extensionPointExtensionKindsMap === null) {
                const extensionPointExtensionKindsMap = new Map();
                extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints().forEach(e => extensionPointExtensionKindsMap.set(e.name, e.defaultExtensionKind || [] /* supports all */));
                this._extensionPointExtensionKindsMap = extensionPointExtensionKindsMap;
            }
            let extensionPointExtensionKind = this._extensionPointExtensionKindsMap.get(extensionPoint);
            if (extensionPointExtensionKind) {
                return extensionPointExtensionKind;
            }
            extensionPointExtensionKind = this.productService.extensionPointExtensionKind ? this.productService.extensionPointExtensionKind[extensionPoint] : undefined;
            if (extensionPointExtensionKind) {
                return extensionPointExtensionKind;
            }
            /* Unknown extension point */
            return platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
        }
        getConfiguredExtensionKind(manifest) {
            const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) };
            // check in config
            let result = this.getUserConfiguredExtensionKind(extensionIdentifier);
            if (typeof result !== 'undefined') {
                return this.toArray(result);
            }
            // check product.json
            result = this.getProductExtensionKind(manifest);
            if (typeof result !== 'undefined') {
                return result;
            }
            // check the manifest itself
            result = manifest.extensionKind;
            if (typeof result !== 'undefined') {
                result = this.toArray(result);
                return result.filter(r => ['ui', 'workspace'].includes(r));
            }
            return null;
        }
        getProductExtensionKind(manifest) {
            if (this._productExtensionKindsMap === null) {
                const productExtensionKindsMap = new extensions_1.ExtensionIdentifierMap();
                if (this.productService.extensionKind) {
                    for (const id of Object.keys(this.productService.extensionKind)) {
                        productExtensionKindsMap.set(id, this.productService.extensionKind[id]);
                    }
                }
                this._productExtensionKindsMap = productExtensionKindsMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productExtensionKindsMap.get(extensionId);
        }
        getProductVirtualWorkspaceSupport(manifest) {
            if (this._productVirtualWorkspaceSupportMap === null) {
                const productWorkspaceSchemesMap = new extensions_1.ExtensionIdentifierMap();
                if (this.productService.extensionVirtualWorkspacesSupport) {
                    for (const id of Object.keys(this.productService.extensionVirtualWorkspacesSupport)) {
                        productWorkspaceSchemesMap.set(id, this.productService.extensionVirtualWorkspacesSupport[id]);
                    }
                }
                this._productVirtualWorkspaceSupportMap = productWorkspaceSchemesMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productVirtualWorkspaceSupportMap.get(extensionId);
        }
        getConfiguredVirtualWorkspaceSupport(manifest) {
            if (this._configuredVirtualWorkspaceSupportMap === null) {
                const configuredWorkspaceSchemesMap = new extensions_1.ExtensionIdentifierMap();
                const configuredWorkspaceSchemes = this.configurationService.getValue('extensions.supportVirtualWorkspaces') || {};
                for (const id of Object.keys(configuredWorkspaceSchemes)) {
                    if (configuredWorkspaceSchemes[id] !== undefined) {
                        configuredWorkspaceSchemesMap.set(id, configuredWorkspaceSchemes[id]);
                    }
                }
                this._configuredVirtualWorkspaceSupportMap = configuredWorkspaceSchemesMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._configuredVirtualWorkspaceSupportMap.get(extensionId);
        }
        getConfiguredExtensionWorkspaceTrustRequest(manifest) {
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            const extensionWorkspaceTrustRequest = this._configuredExtensionWorkspaceTrustRequestMap.get(extensionId);
            if (extensionWorkspaceTrustRequest && (extensionWorkspaceTrustRequest.version === undefined || extensionWorkspaceTrustRequest.version === manifest.version)) {
                return extensionWorkspaceTrustRequest.supported;
            }
            return undefined;
        }
        getProductExtensionWorkspaceTrustRequest(manifest) {
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productExtensionWorkspaceTrustRequestMap.get(extensionId);
        }
        toArray(extensionKind) {
            if (Array.isArray(extensionKind)) {
                return extensionKind;
            }
            return extensionKind === 'ui' ? ['ui', 'workspace'] : [extensionKind];
        }
    };
    exports.ExtensionManifestPropertiesService = ExtensionManifestPropertiesService;
    exports.ExtensionManifestPropertiesService = ExtensionManifestPropertiesService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspaceTrust_2.IWorkspaceTrustEnablementService),
        __param(3, log_1.ILogService)
    ], ExtensionManifestPropertiesService);
    (0, extensions_2.registerSingleton)(exports.IExtensionManifestPropertiesService, ExtensionManifestPropertiesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuaWZlc3RQcm9wZXJ0aWVzU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvbk1hbmlmZXN0UHJvcGVydGllc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJuRixRQUFBLG1DQUFtQyxHQUFHLElBQUEsK0JBQWUsRUFBc0Msb0NBQW9DLENBQUMsQ0FBQztJQW1CdkksSUFBTSxrQ0FBa0MsR0FBeEMsTUFBTSxrQ0FBbUMsU0FBUSxzQkFBVTtRQWNqRSxZQUNrQixjQUFnRCxFQUMxQyxvQkFBNEQsRUFDakQsK0JBQWtGLEVBQ3ZHLFVBQXdDO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBTDBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUN6Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2hDLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDdEYsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQWQ5QyxxQ0FBZ0MsR0FBd0MsSUFBSSxDQUFDO1lBQzdFLDhCQUF5QixHQUFtRCxJQUFJLENBQUM7WUFDakYsaUNBQTRCLEdBQW1FLElBQUksQ0FBQztZQUVwRyx1Q0FBa0MsR0FBNkUsSUFBSSxDQUFDO1lBQ3BILDBDQUFxQyxHQUEyQyxJQUFJLENBQUM7WUFhNUYsK0NBQStDO1lBQy9DLElBQUksQ0FBQyw0Q0FBNEMsR0FBRyxJQUFJLG1DQUFzQixFQUEyRSxDQUFDO1lBQzFKLE1BQU0seUNBQXlDLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxDQUE2RixrREFBaUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxFQUFFLENBQUM7WUFDOU4sS0FBSyxNQUFNLEVBQUUsSUFBSSxNQUFNLENB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