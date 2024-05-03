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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/url/common/url", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/workbench/common/contributions", "vs/platform/actions/common/actions", "vs/platform/quickinput/common/quickInput", "vs/platform/contextkey/common/contextkeys", "vs/platform/telemetry/common/telemetry", "vs/platform/product/common/productService", "vs/base/browser/dom", "vs/base/browser/window", "vs/platform/commands/common/commands", "vs/base/common/errors", "vs/platform/notification/common/notification", "vs/workbench/services/environment/common/environmentService"], function (require, exports, nls_1, lifecycle_1, uri_1, configuration_1, dialogs_1, instantiation_1, storage_1, url_1, host_1, extensions_1, extensions_2, extensions_3, contributions_1, actions_1, quickInput_1, contextkeys_1, telemetry_1, productService_1, dom_1, window_1, commands_1, errors_1, notification_1, environmentService_1) {
    "use strict";
    var ExtensionUrlBootstrapHandler_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionUrlHandler = void 0;
    const FIVE_MINUTES = 5 * 60 * 1000;
    const THIRTY_SECONDS = 30 * 1000;
    const URL_TO_HANDLE = 'extensionUrlHandler.urlToHandle';
    const USER_TRUSTED_EXTENSIONS_CONFIGURATION_KEY = 'extensions.confirmedUriHandlerExtensionIds';
    const USER_TRUSTED_EXTENSIONS_STORAGE_KEY = 'extensionUrlHandler.confirmedExtensions';
    function isExtensionId(value) {
        return /^[a-z0-9][a-z0-9\-]*\.[a-z0-9][a-z0-9\-]*$/i.test(value);
    }
    class UserTrustedExtensionIdStorage {
        get extensions() {
            const userTrustedExtensionIdsJson = this.storageService.get(USER_TRUSTED_EXTENSIONS_STORAGE_KEY, 0 /* StorageScope.PROFILE */, '[]');
            try {
                return JSON.parse(userTrustedExtensionIdsJson);
            }
            catch {
                return [];
            }
        }
        constructor(storageService) {
            this.storageService = storageService;
        }
        has(id) {
            return this.extensions.indexOf(id) > -1;
        }
        add(id) {
            this.set([...this.extensions, id]);
        }
        set(ids) {
            this.storageService.store(USER_TRUSTED_EXTENSIONS_STORAGE_KEY, JSON.stringify(ids), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
    }
    exports.IExtensionUrlHandler = (0, instantiation_1.createDecorator)('extensionUrlHandler');
    /**
     * This class handles URLs which are directed towards extensions.
     * If a URL is directed towards an inactive extension, it buffers it,
     * activates the extension and re-opens the URL once the extension registers
     * a URL handler. If the extension never registers a URL handler, the urls
     * will eventually be garbage collected.
     *
     * It also makes sure the user confirms opening URLs directed towards extensions.
     */
    let ExtensionUrlHandler = class ExtensionUrlHandler {
        constructor(urlService, extensionService, dialogService, commandService, hostService, storageService, configurationService, telemetryService, notificationService, productService, workbenchEnvironmentService) {
            this.extensionService = extensionService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.hostService = hostService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.productService = productService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this.extensionHandlers = new Map();
            this.uriBuffer = new Map();
            this.userTrustedExtensionsStorage = new UserTrustedExtensionIdStorage(storageService);
            const interval = (0, dom_1.disposableWindowInterval)(window_1.mainWindow, () => this.garbageCollect(), THIRTY_SECONDS);
            const urlToHandleValue = this.storageService.get(URL_TO_HANDLE, 1 /* StorageScope.WORKSPACE */);
            if (urlToHandleValue) {
                this.storageService.remove(URL_TO_HANDLE, 1 /* StorageScope.WORKSPACE */);
                this.handleURL(uri_1.URI.revive(JSON.parse(urlToHandleValue)), { trusted: true });
            }
            this.disposable = (0, lifecycle_1.combinedDisposable)(urlService.registerHandler(this), interval);
            const cache = ExtensionUrlBootstrapHandler.cache;
            setTimeout(() => cache.forEach(([uri, option]) => this.handleURL(uri, option)));
        }
        async handleURL(uri, options) {
            if (!isExtensionId(uri.authority)) {
                return false;
            }
            const extensionId = uri.authority;
            this.telemetryService.publicLog2('uri_invoked/start', { extensionId });
            const initialHandler = this.extensionHandlers.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
            let extensionDisplayName;
            if (!initialHandler) {
                // The extension is not yet activated, so let's check if it is installed and enabled
                const extension = await this.extensionService.getExtension(extensionId);
                if (!extension) {
                    await this.handleUnhandledURL(uri, extensionId, options);
                    return true;
                }
                else {
                    extensionDisplayName = extension.displayName ?? '';
                }
            }
            else {
                extensionDisplayName = initialHandler.extensionDisplayName;
            }
            const trusted = options?.trusted
                || this.productService.trustedExtensionProtocolHandlers?.includes(extensionId)
                || this.didUserTrustExtension(extensions_2.ExtensionIdentifier.toKey(extensionId));
            if (!trusted) {
                let uriString = uri.toString(false);
                if (uriString.length > 40) {
                    uriString = `${uriString.substring(0, 30)}...${uriString.substring(uriString.length - 5)}`;
                }
                const result = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('confirmUrl', "Allow '{0}' extension to open this URI?", extensionDisplayName),
                    checkbox: {
                        label: (0, nls_1.localize)('rememberConfirmUrl', "Do not ask me again for this extension"),
                    },
                    detail: uriString,
                    primaryButton: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Open")
                });
                if (!result.confirmed) {
                    this.telemetryService.publicLog2('uri_invoked/cancel', { extensionId });
                    return true;
                }
                if (result.checkboxChecked) {
                    this.userTrustedExtensionsStorage.add(extensions_2.ExtensionIdentifier.toKey(extensionId));
                }
            }
            const handler = this.extensionHandlers.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
            if (handler) {
                if (!initialHandler) {
                    // forward it directly
                    return await this.handleURLByExtension(extensionId, handler, uri, options);
                }
                // let the ExtensionUrlHandler instance handle this
                return false;
            }
            // collect URI for eventual extension activation
            const timestamp = new Date().getTime();
            let uris = this.uriBuffer.get(extensions_2.ExtensionIdentifier.toKey(extensionId));
            if (!uris) {
                uris = [];
                this.uriBuffer.set(extensions_2.ExtensionIdentifier.toKey(extensionId), uris);
            }
            uris.push({ timestamp, uri });
            // activate the extension using ActivationKind.Immediate because URI handling might be part
            // of resolving authorities (via authentication extensions)
            await this.extensionService.activateByEvent(`onUri:${extensions_2.ExtensionIdentifier.toKey(extensionId)}`, 1 /* ActivationKind.Immediate */);
            return true;
        }
        registerExtensionHandler(extensionId, handler) {
            this.extensionHandlers.set(extensions_2.ExtensionIdentifier.toKey(extensionId), handler);
            const uris = this.uriBuffer.get(extensions_2.ExtensionIdentifier.toKey(extensionId)) || [];
            for (const { uri } of uris) {
                this.handleURLByExtension(extensionId, handler, uri);
            }
            this.uriBuffer.delete(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        unregisterExtensionHandler(extensionId) {
            this.extensionHandlers.delete(extensions_2.ExtensionIdentifier.toKey(extensionId));
        }
        async handleURLByExtension(extensionId, handler, uri, options) {
            this.telemetryService.publicLog2('uri_invoked/end', { extensionId: extensions_2.ExtensionIdentifier.toKey(extensionId) });
            return await handler.handleURL(uri, options);
        }
        async handleUnhandledURL(uri, extensionId, options) {
            this.telemetryService.publicLog2('uri_invoked/install_extension/start', { extensionId });
            try {
                await this.commandService.executeCommand('workbench.extensions.installExtension', extensionId, {
                    justification: {
                        reason: `${(0, nls_1.localize)('installDetail', "This extension wants to open a URI:")}\n${uri.toString()}`,
                        action: (0, nls_1.localize)('openUri', "Open URI")
                    },
                    enable: true
                });
                this.telemetryService.publicLog2('uri_invoked/install_extension/accept', { extensionId });
            }
            catch (error) {
                if ((0, errors_1.isCancellationError)(error)) {
                    this.telemetryService.publicLog2('uri_invoked/install_extension/cancel', { extensionId });
                }
                else {
                    this.telemetryService.publicLog2('uri_invoked/install_extension/error', { extensionId });
                    this.notificationService.error(error);
                }
                return;
            }
            const extension = await this.extensionService.getExtension(extensionId);
            if (extension) {
                await this.handleURL(uri, { ...options, trusted: true });
            }
            /* Extension cannot be added and require window reload */
            else {
                this.telemetryService.publicLog2('uri_invoked/install_extension/reload', { extensionId, isRemote: !!this.workbenchEnvironmentService.remoteAuthority });
                const result = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('reloadAndHandle', "Extension '{0}' is not loaded. Would you like to reload the window to load the extension and open the URL?", extensionId),
                    primaryButton: (0, nls_1.localize)({ key: 'reloadAndOpen', comment: ['&& denotes a mnemonic'] }, "&&Reload Window and Open")
                });
                if (!result.confirmed) {
                    return;
                }
                this.storageService.store(URL_TO_HANDLE, JSON.stringify(uri.toJSON()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                await this.hostService.reload();
            }
        }
        // forget about all uris buffered more than 5 minutes ago
        garbageCollect() {
            const now = new Date().getTime();
            const uriBuffer = new Map();
            this.uriBuffer.forEach((uris, extensionId) => {
                uris = uris.filter(({ timestamp }) => now - timestamp < FIVE_MINUTES);
                if (uris.length > 0) {
                    uriBuffer.set(extensionId, uris);
                }
            });
            this.uriBuffer = uriBuffer;
        }
        didUserTrustExtension(id) {
            if (this.userTrustedExtensionsStorage.has(id)) {
                return true;
            }
            return this.getConfirmedTrustedExtensionIdsFromConfiguration().indexOf(id) > -1;
        }
        getConfirmedTrustedExtensionIdsFromConfiguration() {
            const trustedExtensionIds = this.configurationService.getValue(USER_TRUSTED_EXTENSIONS_CONFIGURATION_KEY);
            if (!Array.isArray(trustedExtensionIds)) {
                return [];
            }
            return trustedExtensionIds;
        }
        dispose() {
            this.disposable.dispose();
            this.extensionHandlers.clear();
            this.uriBuffer.clear();
        }
    };
    ExtensionUrlHandler = __decorate([
        __param(0, url_1.IURLService),
        __param(1, extensions_1.IExtensionService),
        __param(2, dialogs_1.IDialogService),
        __param(3, commands_1.ICommandService),
        __param(4, host_1.IHostService),
        __param(5, storage_1.IStorageService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, notification_1.INotificationService),
        __param(9, productService_1.IProductService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService)
    ], ExtensionUrlHandler);
    (0, extensions_3.registerSingleton)(exports.IExtensionUrlHandler, ExtensionUrlHandler, 0 /* InstantiationType.Eager */);
    /**
     * This class handles URLs before `ExtensionUrlHandler` is instantiated.
     * More info: https://github.com/microsoft/vscode/issues/73101
     */
    let ExtensionUrlBootstrapHandler = class ExtensionUrlBootstrapHandler {
        static { ExtensionUrlBootstrapHandler_1 = this; }
        static { this.ID = 'workbench.contrib.extensionUrlBootstrapHandler'; }
        static { this._cache = []; }
        static get cache() {
            ExtensionUrlBootstrapHandler_1.disposable.dispose();
            const result = ExtensionUrlBootstrapHandler_1._cache;
            ExtensionUrlBootstrapHandler_1._cache = [];
            return result;
        }
        constructor(urlService) {
            ExtensionUrlBootstrapHandler_1.disposable = urlService.registerHandler(this);
        }
        async handleURL(uri, options) {
            if (!isExtensionId(uri.authority)) {
                return false;
            }
            ExtensionUrlBootstrapHandler_1._cache.push([uri, options]);
            return true;
        }
    };
    ExtensionUrlBootstrapHandler = ExtensionUrlBootstrapHandler_1 = __decorate([
        __param(0, url_1.IURLService)
    ], ExtensionUrlBootstrapHandler);
    (0, contributions_1.registerWorkbenchContribution2)(ExtensionUrlBootstrapHandler.ID, ExtensionUrlBootstrapHandler, 2 /* WorkbenchPhase.BlockRestore */);
    class ManageAuthorizedExtensionURIsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.extensions.action.manageAuthorizedExtensionURIs',
                title: (0, nls_1.localize2)('manage', 'Manage Authorized Extension URIs...'),
                category: (0, nls_1.localize2)('extensions', 'Extensions'),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkeys_1.IsWebContext.toNegated()
                }
            });
        }
        async run(accessor) {
            const storageService = accessor.get(storage_1.IStorageService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const storage = new UserTrustedExtensionIdStorage(storageService);
            const items = storage.extensions.map(label => ({ label, picked: true }));
            if (items.length === 0) {
                await quickInputService.pick([{ label: (0, nls_1.localize)('no', 'There are currently no authorized extension URIs.') }]);
                return;
            }
            const result = await quickInputService.pick(items, { canPickMany: true });
            if (!result) {
                return;
            }
            storage.set(result.map(item => item.label));
        }
    }
    (0, actions_1.registerAction2)(ManageAuthorizedExtensionURIsAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uVXJsSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25VcmxIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEyQmhHLE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ25DLE1BQU0sY0FBYyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7SUFDakMsTUFBTSxhQUFhLEdBQUcsaUNBQWlDLENBQUM7SUFDeEQsTUFBTSx5Q0FBeUMsR0FBRyw0Q0FBNEMsQ0FBQztJQUMvRixNQUFNLG1DQUFtQyxHQUFHLHlDQUF5QyxDQUFDO0lBRXRGLFNBQVMsYUFBYSxDQUFDLEtBQWE7UUFDbkMsT0FBTyw2Q0FBNkMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELE1BQU0sNkJBQTZCO1FBRWxDLElBQUksVUFBVTtZQUNiLE1BQU0sMkJBQTJCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsbUNBQW1DLGdDQUF3QixJQUFJLENBQUMsQ0FBQztZQUU3SCxJQUFJLENBQUM7Z0JBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7UUFDRixDQUFDO1FBRUQsWUFBb0IsY0FBK0I7WUFBL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBQUksQ0FBQztRQUV4RCxHQUFHLENBQUMsRUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdB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