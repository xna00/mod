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
define(["require", "exports", "vs/base/common/arrays", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensionsApiProposals"], function (require, exports, arrays_1, extensions_1, log_1, productService_1, environmentService_1, extensionsApiProposals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsProposedApi = void 0;
    let ExtensionsProposedApi = class ExtensionsProposedApi {
        constructor(_logService, _environmentService, productService) {
            this._logService = _logService;
            this._environmentService = _environmentService;
            this._envEnabledExtensions = new Set((_environmentService.extensionEnabledProposedApi ?? []).map(id => extensions_1.ExtensionIdentifier.toKey(id)));
            this._envEnablesProposedApiForAll =
                !_environmentService.isBuilt || // always allow proposed API when running out of sources
                    (_environmentService.isExtensionDevelopment && productService.quality !== 'stable') || // do not allow proposed API against stable builds when developing an extension
                    (this._envEnabledExtensions.size === 0 && Array.isArray(_environmentService.extensionEnabledProposedApi)); // always allow proposed API if --enable-proposed-api is provided without extension ID
            this._productEnabledExtensions = new Map();
            // NEW world - product.json spells out what proposals each extension can use
            if (productService.extensionEnabledApiProposals) {
                for (const [k, value] of Object.entries(productService.extensionEnabledApiProposals)) {
                    const key = extensions_1.ExtensionIdentifier.toKey(k);
                    const proposalNames = value.filter(name => {
                        if (!extensionsApiProposals_1.allApiProposals[name]) {
                            _logService.warn(`Via 'product.json#extensionEnabledApiProposals' extension '${key}' wants API proposal '${name}' but that proposal DOES NOT EXIST. Likely, the proposal has been finalized (check 'vscode.d.ts') or was abandoned.`);
                            return false;
                        }
                        return true;
                    });
                    this._productEnabledExtensions.set(key, proposalNames);
                }
            }
        }
        updateEnabledApiProposals(extensions) {
            for (const extension of extensions) {
                this.doUpdateEnabledApiProposals(extension);
            }
        }
        doUpdateEnabledApiProposals(_extension) {
            const extension = _extension;
            const key = extensions_1.ExtensionIdentifier.toKey(_extension.identifier);
            // warn about invalid proposal and remove them from the list
            if ((0, arrays_1.isNonEmptyArray)(extension.enabledApiProposals)) {
                extension.enabledApiProposals = extension.enabledApiProposals.filter(name => {
                    const result = Boolean(extensionsApiProposals_1.allApiProposals[name]);
                    if (!result) {
                        this._logService.error(`Extension '${key}' wants API proposal '${name}' but that proposal DOES NOT EXIST. Likely, the proposal has been finalized (check 'vscode.d.ts') or was abandoned.`);
                    }
                    return result;
                });
            }
            if (this._productEnabledExtensions.has(key)) {
                // NOTE that proposals that are listed in product.json override whatever is declared in the extension
                // itself. This is needed for us to know what proposals are used "in the wild". Merging product.json-proposals
                // and extension-proposals would break that.
                const productEnabledProposals = this._productEnabledExtensions.get(key);
                // check for difference between product.json-declaration and package.json-declaration
                const productSet = new Set(productEnabledProposals);
                const extensionSet = new Set(extension.enabledApiProposals);
                const diff = new Set([...extensionSet].filter(a => !productSet.has(a)));
                if (diff.size > 0) {
                    this._logService.error(`Extension '${key}' appears in product.json but enables LESS API proposals than the extension wants.\npackage.json (LOSES): ${[...extensionSet].join(', ')}\nproduct.json (WINS): ${[...productSet].join(', ')}`);
                    if (this._environmentService.isExtensionDevelopment) {
                        this._logService.error(`Proceeding with EXTRA proposals (${[...diff].join(', ')}) because extension is in development mode. Still, this EXTENSION WILL BE BROKEN unless product.json is updated.`);
                        productEnabledProposals.push(...diff);
                    }
                }
                extension.enabledApiProposals = productEnabledProposals;
                return;
            }
            if (this._envEnablesProposedApiForAll || this._envEnabledExtensions.has(key)) {
                // proposed API usage is not restricted and allowed just like the extension
                // has declared it
                return;
            }
            if (!extension.isBuiltin && (0, arrays_1.isNonEmptyArray)(extension.enabledApiProposals)) {
                // restrictive: extension cannot use proposed API in this context and its declaration is nulled
                this._logService.error(`Extension '${extension.identifier.value} CANNOT USE these API proposals '${extension.enabledApiProposals?.join(', ') || '*'}'. You MUST start in extension development mode or use the --enable-proposed-api command line flag`);
                extension.enabledApiProposals = [];
            }
        }
    };
    exports.ExtensionsProposedApi = ExtensionsProposedApi;
    exports.ExtensionsProposedApi = ExtensionsProposedApi = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, productService_1.IProductService)
    ], ExtensionsProposedApi);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Byb3Bvc2VkQXBpLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uc1Byb3Bvc2VkQXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQU1qQyxZQUMrQixXQUF3QixFQUNQLG1CQUFpRCxFQUMvRSxjQUErQjtZQUZsQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNQLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFJaEcsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsbUJBQW1CLENBQUMsMkJBQTJCLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsZ0NBQW1CLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV2SSxJQUFJLENBQUMsNEJBQTRCO2dCQUNoQyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sSUFBSSx3REFBd0Q7b0JBQ3hGLENBQUMsbUJBQW1CLENBQUMsc0JBQXNCLElBQUksY0FBYyxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsSUFBSSwrRUFBK0U7b0JBQ3RLLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxzRkFBc0Y7WUFFbE0sSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksR0FBRyxFQUE2QixDQUFDO1lBR3RFLDRFQUE0RTtZQUM1RSxJQUFJLGNBQWMsQ0FBQyw0QkFBNEIs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