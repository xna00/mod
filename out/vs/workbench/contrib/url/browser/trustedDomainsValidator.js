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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/network", "vs/base/common/severity", "vs/base/common/uri", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/url/browser/trustedDomains", "vs/workbench/contrib/url/common/urlGlob", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom_1, window_1, network_1, severity_1, uri_1, nls_1, clipboardService_1, configuration_1, dialogs_1, instantiation_1, opener_1, productService_1, quickInput_1, storage_1, telemetry_1, workspace_1, workspaceTrust_1, trustedDomains_1, urlGlob_1, authentication_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenerValidatorContributions = void 0;
    exports.isURLDomainTrusted = isURLDomainTrusted;
    let OpenerValidatorContributions = class OpenerValidatorContributions {
        constructor(_openerService, _storageService, _dialogService, _productService, _quickInputService, _editorService, _clipboardService, _telemetryService, _instantiationService, _authenticationService, _workspaceContextService, _configurationService, _workspaceTrustService) {
            this._openerService = _openerService;
            this._storageService = _storageService;
            this._dialogService = _dialogService;
            this._productService = _productService;
            this._quickInputService = _quickInputService;
            this._editorService = _editorService;
            this._clipboardService = _clipboardService;
            this._telemetryService = _telemetryService;
            this._instantiationService = _instantiationService;
            this._authenticationService = _authenticationService;
            this._workspaceContextService = _workspaceContextService;
            this._configurationService = _configurationService;
            this._workspaceTrustService = _workspaceTrustService;
            this._openerService.registerValidator({ shouldOpen: (uri, options) => this.validateLink(uri, options) });
            this._readAuthenticationTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readAuthenticationTrustedDomains));
            this._authenticationService.onDidRegisterAuthenticationProvider(() => {
                this._readAuthenticationTrustedDomainsResult?.dispose();
                this._readAuthenticationTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readAuthenticationTrustedDomains));
            });
            this._readWorkspaceTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readWorkspaceTrustedDomains));
            this._workspaceContextService.onDidChangeWorkspaceFolders(() => {
                this._readWorkspaceTrustedDomainsResult?.dispose();
                this._readWorkspaceTrustedDomainsResult = new dom_1.WindowIdleValue(window_1.mainWindow, () => this._instantiationService.invokeFunction(trustedDomains_1.readWorkspaceTrustedDomains));
            });
        }
        async validateLink(resource, openOptions) {
            if (!(0, network_1.matchesScheme)(resource, network_1.Schemas.http) && !(0, network_1.matchesScheme)(resource, network_1.Schemas.https)) {
                return true;
            }
            if (openOptions?.fromWorkspace && this._workspaceTrustService.isWorkspaceTrusted() && !this._configurationService.getValue('workbench.trustedDomains.promptInTrustedWorkspace')) {
                return true;
            }
            const originalResource = resource;
            let resourceUri;
            if (typeof resource === 'string') {
                resourceUri = uri_1.URI.parse(resource);
            }
            else {
                resourceUri = resource;
            }
            const { scheme, authority, path, query, fragment } = resourceUri;
            const domainToOpen = `${scheme}://${authority}`;
            const [workspaceDomains, userDomains] = await Promise.all([this._readWorkspaceTrustedDomainsResult.value, this._readAuthenticationTrustedDomainsResult.value]);
            const { defaultTrustedDomains, trustedDomains, } = this._instantiationService.invokeFunction(trustedDomains_1.readStaticTrustedDomains);
            const allTrustedDomains = [...defaultTrustedDomains, ...trustedDomains, ...userDomains, ...workspaceDomains];
            if (isURLDomainTrusted(resourceUri, allTrustedDomains)) {
                return true;
            }
            else {
                let formattedLink = `${scheme}://${authority}${path}`;
                const linkTail = `${query ? '?' + query : ''}${fragment ? '#' + fragment : ''}`;
                const remainingLength = Math.max(0, 60 - formattedLink.length);
                const linkTailLengthToKeep = Math.min(Math.max(5, remainingLength), linkTail.length);
                if (linkTailLengthToKeep === linkTail.length) {
                    formattedLink += linkTail;
                }
                else {
                    // keep the first char ? or #
                    // add ... and keep the tail end as much as possible
                    formattedLink += linkTail.charAt(0) + '...' + linkTail.substring(linkTail.length - linkTailLengthToKeep + 1);
                }
                const { result } = await this._dialogService.prompt({
                    type: severity_1.default.Info,
                    message: (0, nls_1.localize)('openExternalLinkAt', 'Do you want {0} to open the external website?', this._productService.nameShort),
                    detail: typeof originalResource === 'string' ? originalResource : formattedLink,
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, '&&Open'),
                            run: () => true
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, '&&Copy'),
                            run: () => {
                                this._clipboardService.writeText(typeof originalResource === 'string' ? originalResource : resourceUri.toString(true));
                                return false;
                            }
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'configureTrustedDomains', comment: ['&& denotes a mnemonic'] }, 'Configure &&Trusted Domains'),
                            run: async () => {
                                const pickedDomains = await (0, trustedDomains_1.configureOpenerTrustedDomainsHandler)(trustedDomains, domainToOpen, resourceUri, this._quickInputService, this._storageService, this._editorService, this._telemetryService);
                                // Trust all domains
                                if (pickedDomains.indexOf('*') !== -1) {
                                    return true;
                                }
                                // Trust current domain
                                if (isURLDomainTrusted(resourceUri, pickedDomains)) {
                                    return true;
                                }
                                return false;
                            }
                        }
                    ],
                    cancelButton: {
                        run: () => false
                    }
                });
                return result;
            }
        }
    };
    exports.OpenerValidatorContributions = OpenerValidatorContributions;
    exports.OpenerValidatorContributions = OpenerValidatorContributions = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, storage_1.IStorageService),
        __param(2, dialogs_1.IDialogService),
        __param(3, productService_1.IProductService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, editorService_1.IEditorService),
        __param(6, clipboardService_1.IClipboardService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, authentication_1.IAuthenticationService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], OpenerValidatorContributions);
    const rLocalhost = /^localhost(:\d+)?$/i;
    const r127 = /^127.0.0.1(:\d+)?$/;
    function isLocalhostAuthority(authority) {
        return rLocalhost.test(authority) || r127.test(authority);
    }
    /**
     * Case-normalize some case-insensitive URLs, such as github.
     */
    function normalizeURL(url) {
        const caseInsensitiveAuthorities = ['github.com'];
        try {
            const parsed = typeof url === 'string' ? uri_1.URI.parse(url, true) : url;
            if (caseInsensitiveAuthorities.includes(parsed.authority)) {
                return parsed.with({ path: parsed.path.toLowerCase() }).toString(true);
            }
            else {
                return parsed.toString(true);
            }
        }
        catch {
            return url.toString();
        }
    }
    /**
     * Check whether a domain like https://www.microsoft.com matches
     * the list of trusted domains.
     *
     * - Schemes must match
     * - There's no subdomain matching. For example https://microsoft.com doesn't match https://www.microsoft.com
     * - Star matches all subdomains. For example https://*.microsoft.com matches https://www.microsoft.com and https://foo.bar.microsoft.com
     */
    function isURLDomainTrusted(url, trustedDomains) {
        url = uri_1.URI.parse(normalizeURL(url));
        trustedDomains = trustedDomains.map(normalizeURL);
        if (isLocalhostAuthority(url.authority)) {
            return true;
        }
        for (let i = 0; i < trustedDomains.length; i++) {
            if (trustedDomains[i] === '*') {
                return true;
            }
            if ((0, urlGlob_1.testUrlMatchesGlob)(url, trustedDomains[i])) {
                return true;
            }
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1c3RlZERvbWFpbnNWYWxpZGF0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VybC9icm93c2VyL3RydXN0ZWREb21haW5zVmFsaWRhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThMaEcsZ0RBbUJDO0lBeExNLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTRCO1FBS3hDLFlBQ2tDLGNBQThCLEVBQzdCLGVBQWdDLEVBQ2pDLGNBQThCLEVBQzdCLGVBQWdDLEVBQzdCLGtCQUFzQyxFQUMxQyxjQUE4QixFQUMzQixpQkFBb0MsRUFDcEMsaUJBQW9DLEVBQ2hDLHFCQUE0QyxFQUMzQyxzQkFBOEMsRUFDNUMsd0JBQWtELEVBQ3JELHFCQUE0QyxFQUNqQyxzQkFBd0Q7WUFaMUUsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQzdCLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNqQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDN0Isb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQzdCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDMUMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQzNCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDcEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUNoQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzNDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7WUFDNUMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUNyRCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2pDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBa0M7WUFFM0csSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxF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