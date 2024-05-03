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
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/cancellation", "vs/base/common/process", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/issue/common/issue", "vs/platform/product/common/productService", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/theme", "vs/workbench/services/assignment/common/assignmentService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/integrity/common/integrity", "vs/platform/log/common/log", "vs/workbench/services/issue/common/issue", "vs/base/browser/window", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, browser_1, cancellation_1, process_1, globals_1, extensionManagement_1, extensions_1, extensions_2, issue_1, productService_1, colorRegistry_1, themeService_1, workspaceTrust_1, theme_1, assignmentService_1, authentication_1, environmentService_1, extensionManagement_2, abstractExtensionService_1, extensions_3, integrity_1, log_1, issue_2, window_1, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeIssueService = void 0;
    exports.getIssueReporterStyles = getIssueReporterStyles;
    let NativeIssueService = class NativeIssueService {
        constructor(issueMainService, themeService, extensionManagementService, extensionEnablementService, environmentService, workspaceTrustManagementService, productService, experimentService, authenticationService, integrityService, extensionService, logService, menuService, contextKeyService) {
            this.issueMainService = issueMainService;
            this.themeService = themeService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.environmentService = environmentService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.productService = productService;
            this.experimentService = experimentService;
            this.authenticationService = authenticationService;
            this.integrityService = integrityService;
            this.extensionService = extensionService;
            this.logService = logService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._handlers = new Map();
            this._providers = new Map();
            this._activationEventReader = new abstractExtensionService_1.ImplicitActivationAwareReader();
            this.extensionIdentifierSet = new extensions_1.ExtensionIdentifierSet();
            globals_1.ipcRenderer.on('vscode:triggerIssueUriRequestHandler', async (event, request) => {
                const result = await this.getIssueReporterUri(request.extensionId, cancellation_1.CancellationToken.None);
                globals_1.ipcRenderer.send(request.replyChannel, result.toString());
            });
            globals_1.ipcRenderer.on('vscode:triggerIssueDataProvider', async (event, request) => {
                const result = await this.getIssueData(request.extensionId, cancellation_1.CancellationToken.None);
                globals_1.ipcRenderer.send(request.replyChannel, result);
            });
            globals_1.ipcRenderer.on('vscode:triggerIssueDataTemplate', async (event, request) => {
                const result = await this.getIssueTemplate(request.extensionId, cancellation_1.CancellationToken.None);
                globals_1.ipcRenderer.send(request.replyChannel, result);
            });
            globals_1.ipcRenderer.on('vscode:triggerReporterStatus', async (event, arg) => {
                const extensionId = arg.extensionId;
                const extension = await this.extensionService.getExtension(extensionId);
                if (extension) {
                    const activationEvents = this._activationEventReader.readActivationEvents(extension);
                    for (const activationEvent of activationEvents) {
                        if (activationEvent === 'onIssueReporterOpened') {
                            const eventName = `onIssueReporterOpened:${extensions_1.ExtensionIdentifier.toKey(extension.identifier)}`;
                            try {
                                await this.extensionService.activateById(extension.identifier, { startup: false, extensionId: extension.identifier, activationEvent: eventName });
                            }
                            catch (e) {
                                this.logService.error(`Error activating extension ${extensionId}: ${e}`);
                            }
                            break;
                        }
                    }
                }
                const result = [this._providers.has(extensionId.toLowerCase()), this._handlers.has(extensionId.toLowerCase())];
                globals_1.ipcRenderer.send(`vscode:triggerReporterStatusResponse`, result);
            });
            globals_1.ipcRenderer.on('vscode:triggerReporterMenu', async (event, arg) => {
                const extensionId = arg.extensionId;
                // creates menu from contributed
                const menu = this.menuService.createMenu(actions_1.MenuId.IssueReporter, this.contextKeyService);
                // render menu and dispose
                const actions = menu.getActions({ renderShortTitle: true }).flatMap(entry => entry[1]);
                actions.forEach(async (action) => {
                    try {
                        if (action.item && 'source' in action.item && action.item.source?.id === extensionId) {
                            this.extensionIdentifierSet.add(extensionId);
                            await action.run();
                        }
                    }
                    catch (error) {
                        console.error(error);
                    }
                });
                if (!this.extensionIdentifierSet.has(extensionId)) {
                    // send undefined to indicate no action was taken
                    globals_1.ipcRenderer.send(`vscode:triggerReporterMenuResponse:${extensionId}`, undefined);
                }
                menu.dispose();
            });
        }
        async openReporter(dataOverrides = {}) {
            const extensionData = [];
            try {
                const extensions = await this.extensionManagementService.getInstalled();
                const enabledExtensions = extensions.filter(extension => this.extensionEnablementService.isEnabled(extension) || (dataOverrides.extensionId && extension.identifier.id === dataOverrides.extensionId));
                extensionData.push(...enabledExtensions.map((extension) => {
                    const { manifest } = extension;
                    const manifestKeys = manifest.contributes ? Object.keys(manifest.contributes) : [];
                    const isTheme = !manifest.main && !manifest.browser && manifestKeys.length === 1 && manifestKeys[0] === 'themes';
                    const isBuiltin = extension.type === 0 /* ExtensionType.System */;
                    return {
                        name: manifest.name,
                        publisher: manifest.publisher,
                        version: manifest.version,
                        repositoryUrl: manifest.repository && manifest.repository.url,
                        bugsUrl: manifest.bugs && manifest.bugs.url,
                        hasIssueUriRequestHandler: this._handlers.has(extension.identifier.id.toLowerCase()),
                        hasIssueDataProviders: this._providers.has(extension.identifier.id.toLowerCase()),
                        displayName: manifest.displayName,
                        id: extension.identifier.id,
                        data: dataOverrides.data,
                        uri: dataOverrides.uri,
                        isTheme,
                        isBuiltin,
                        extensionData: 'Extensions data loading',
                    };
                }));
            }
            catch (e) {
                extensionData.push({
                    name: 'Workbench Issue Service',
                    publisher: 'Unknown',
                    version: '0.0.0',
                    repositoryUrl: undefined,
                    bugsUrl: undefined,
                    extensionData: 'Extensions data loading',
                    displayName: `Extensions not loaded: ${e}`,
                    id: 'workbench.issue',
                    isTheme: false,
                    isBuiltin: true
                });
            }
            const experiments = await this.experimentService.getCurrentExperiments();
            let githubAccessToken = '';
            try {
                const githubSessions = await this.authenticationService.getSessions('github');
                const potentialSessions = githubSessions.filter(session => session.scopes.includes('repo'));
                githubAccessToken = potentialSessions[0]?.accessToken;
            }
            catch (e) {
                // Ignore
            }
            // air on the side of caution and have false be the default
            let isUnsupported = false;
            try {
                isUnsupported = !(await this.integrityService.isPure()).isPure;
            }
            catch (e) {
                // Ignore
            }
            const theme = this.themeService.getColorTheme();
            const issueReporterData = Object.assign({
                styles: getIssueReporterStyles(theme),
                zoomLevel: (0, browser_1.getZoomLevel)(window_1.mainWindow),
                enabledExtensions: extensionData,
                experiments: experiments?.join('\n'),
                restrictedMode: !this.workspaceTrustManagementService.isWorkspaceTrusted(),
                isUnsupported,
                githubAccessToken
            }, dataOverrides);
            if (issueReporterData.extensionId) {
                const extensionExists = extensionData.some(extension => extensions_1.ExtensionIdentifier.equals(extension.id, issueReporterData.extensionId));
                if (!extensionExists) {
                    console.error(`Extension with ID ${issueReporterData.extensionId} does not exist.`);
                }
            }
            if (issueReporterData.extensionId && this.extensionIdentifierSet.has(issueReporterData.extensionId)) {
                globals_1.ipcRenderer.send(`vscode:triggerReporterMenuResponse:${issueReporterData.extensionId}`, issueReporterData);
                this.extensionIdentifierSet.delete(new extensions_1.ExtensionIdentifier(issueReporterData.extensionId));
            }
            return this.issueMainService.openReporter(issueReporterData);
        }
        openProcessExplorer() {
            const theme = this.themeService.getColorTheme();
            const data = {
                pid: this.environmentService.mainPid,
                zoomLevel: (0, browser_1.getZoomLevel)(window_1.mainWindow),
                styles: {
                    backgroundColor: getColor(theme, colorRegistry_1.editorBackground),
                    color: getColor(theme, colorRegistry_1.editorForeground),
                    listHoverBackground: getColor(theme, colorRegistry_1.listHoverBackground),
                    listHoverForeground: getColor(theme, colorRegistry_1.listHoverForeground),
                    listFocusBackground: getColor(theme, colorRegistry_1.listFocusBackground),
                    listFocusForeground: getColor(theme, colorRegistry_1.listFocusForeground),
                    listFocusOutline: getColor(theme, colorRegistry_1.listFocusOutline),
                    listActiveSelectionBackground: getColor(theme, colorRegistry_1.listActiveSelectionBackground),
                    listActiveSelectionForeground: getColor(theme, colorRegistry_1.listActiveSelectionForeground),
                    listHoverOutline: getColor(theme, colorRegistry_1.activeContrastBorder),
                    scrollbarShadowColor: getColor(theme, colorRegistry_1.scrollbarShadow),
                    scrollbarSliderActiveBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderActiveBackground),
                    scrollbarSliderBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderBackground),
                    scrollbarSliderHoverBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderHoverBackground),
                },
                platform: process_1.platform,
                applicationName: this.productService.applicationName
            };
            return this.issueMainService.openProcessExplorer(data);
        }
        registerIssueUriRequestHandler(extensionId, handler) {
            this._handlers.set(extensionId.toLowerCase(), handler);
            return {
                dispose: () => this._handlers.delete(extensionId)
            };
        }
        async getIssueReporterUri(extensionId, token) {
            const handler = this._handlers.get(extensionId);
            if (!handler) {
                throw new Error(`No issue uri request handler registered for extension '${extensionId}'`);
            }
            return handler.provideIssueUrl(token);
        }
        registerIssueDataProvider(extensionId, handler) {
            this._providers.set(extensionId.toLowerCase(), handler);
            return {
                dispose: () => this._providers.delete(extensionId)
            };
        }
        async getIssueData(extensionId, token) {
            const provider = this._providers.get(extensionId);
            if (!provider) {
                throw new Error(`No issue uri request provider registered for extension '${extensionId}'`);
            }
            return provider.provideIssueExtensionData(token);
        }
        async getIssueTemplate(extensionId, token) {
            const provider = this._providers.get(extensionId);
            if (!provider) {
                throw new Error(`No issue uri request provider registered for extension '${extensionId}'`);
            }
            return provider.provideIssueExtensionTemplate(token);
        }
    };
    exports.NativeIssueService = NativeIssueService;
    exports.NativeIssueService = NativeIssueService = __decorate([
        __param(0, issue_1.IIssueMainService),
        __param(1, themeService_1.IThemeService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(4, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(6, productService_1.IProductService),
        __param(7, assignmentService_1.IWorkbenchAssignmentService),
        __param(8, authentication_1.IAuthenticationService),
        __param(9, integrity_1.IIntegrityService),
        __param(10, extensions_3.IExtensionService),
        __param(11, log_1.ILogService),
        __param(12, actions_1.IMenuService),
        __param(13, contextkey_1.IContextKeyService)
    ], NativeIssueService);
    function getIssueReporterStyles(theme) {
        return {
            backgroundColor: getColor(theme, theme_1.SIDE_BAR_BACKGROUND),
            color: getColor(theme, colorRegistry_1.foreground),
            textLinkColor: getColor(theme, colorRegistry_1.textLinkForeground),
            textLinkActiveForeground: getColor(theme, colorRegistry_1.textLinkActiveForeground),
            inputBackground: getColor(theme, colorRegistry_1.inputBackground),
            inputForeground: getColor(theme, colorRegistry_1.inputForeground),
            inputBorder: getColor(theme, colorRegistry_1.inputBorder),
            inputActiveBorder: getColor(theme, colorRegistry_1.inputActiveOptionBorder),
            inputErrorBorder: getColor(theme, colorRegistry_1.inputValidationErrorBorder),
            inputErrorBackground: getColor(theme, colorRegistry_1.inputValidationErrorBackground),
            inputErrorForeground: getColor(theme, colorRegistry_1.inputValidationErrorForeground),
            buttonBackground: getColor(theme, colorRegistry_1.buttonBackground),
            buttonForeground: getColor(theme, colorRegistry_1.buttonForeground),
            buttonHoverBackground: getColor(theme, colorRegistry_1.buttonHoverBackground),
            sliderActiveColor: getColor(theme, colorRegistry_1.scrollbarSliderActiveBackground),
            sliderBackgroundColor: getColor(theme, colorRegistry_1.scrollbarSliderBackground),
            sliderHoverColor: getColor(theme, colorRegistry_1.scrollbarSliderHoverBackground),
        };
    }
    function getColor(theme, key) {
        const color = theme.getColor(key);
        return color ? color.toString() : undefined;
    }
    (0, extensions_2.registerSingleton)(issue_2.IWorkbenchIssueService, NativeIssueService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvaXNzdWUvZWxlY3Ryb24tc2FuZGJveC9pc3N1ZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeVFoRyx3REFvQkM7SUEvUE0sSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFROUIsWUFDb0IsZ0JBQW9ELEVBQ3hELFlBQTRDLEVBQzlCLDBCQUF3RSxFQUMvRCwwQkFBaUYsRUFDbkYsa0JBQXVFLEVBQ3pFLCtCQUFrRixFQUNuRyxjQUFnRCxFQUNwQyxpQkFBK0QsRUFDcEUscUJBQThELEVBQ25FLGdCQUFvRCxFQUNwRCxnQkFBb0QsRUFDMUQsVUFBd0MsRUFDdkMsV0FBMEMsRUFDcEMsaUJBQXNEO1lBYnRDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdkMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDYiwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzlDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBc0M7WUFDbEUsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQztZQUN4RCxvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBQ2xGLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQTZCO1lBQ25ELDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDbEQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNuQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3pDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdEIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQW5C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