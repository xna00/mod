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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/uri", "vs/workbench/services/layout/browser/layoutService", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/contrib/remote/browser/remoteExplorer", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/commands/common/commands", "vs/platform/progress/common/progress", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/workbench/browser/actions/windowActions", "vs/base/common/lifecycle", "vs/workbench/contrib/remote/browser/explorerViewItems", "vs/base/common/types", "vs/workbench/services/remote/common/remoteExplorerService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/list/browser/listService", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/remote/browser/remoteIcons", "vs/platform/log/common/log", "vs/workbench/services/timer/browser/timerService", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/base/common/network", "vs/base/browser/window", "vs/css!./media/remoteViewlet"], function (require, exports, nls, dom, uri_1, layoutService_1, telemetry_1, workspace_1, storage_1, configuration_1, instantiation_1, themeService_1, themables_1, contextView_1, extensions_1, viewsViewlet_1, remoteExplorer_1, contextkey_1, views_1, platform_1, opener_1, quickInput_1, commands_1, progress_1, remoteAgentService_1, dialogs_1, severity_1, windowActions_1, lifecycle_1, explorerViewItems_1, types_1, remoteExplorerService_1, environmentService_1, viewPane_1, listService_1, keybinding_1, event_1, descriptors_1, icons, log_1, timerService_1, remoteHosts_1, virtualWorkspace_1, gettingStartedService_1, network_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentConnectionStatusListener = exports.RemoteMarkers = void 0;
    class HelpTreeVirtualDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return 'HelpItemTemplate';
        }
    }
    class HelpTreeRenderer {
        constructor() {
            this.templateId = 'HelpItemTemplate';
        }
        renderTemplate(container) {
            container.classList.add('remote-help-tree-node-item');
            const icon = dom.append(container, dom.$('.remote-help-tree-node-item-icon'));
            const parent = container;
            return { parent, icon };
        }
        renderElement(element, index, templateData, height) {
            const container = templateData.parent;
            dom.append(container, templateData.icon);
            templateData.icon.classList.add(...element.element.iconClasses);
            const labelContainer = dom.append(container, dom.$('.help-item-label'));
            labelContainer.innerText = element.element.label;
        }
        disposeTemplate(templateData) {
        }
    }
    class HelpDataSource {
        hasChildren(element) {
            return element instanceof HelpModel;
        }
        getChildren(element) {
            if (element instanceof HelpModel && element.items) {
                return element.items;
            }
            return [];
        }
    }
    class HelpModel {
        constructor(viewModel, openerService, quickInputService, commandService, remoteExplorerService, environmentService, workspaceContextService, walkthroughsService) {
            this.viewModel = viewModel;
            this.openerService = openerService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.workspaceContextService = workspaceContextService;
            this.walkthroughsService = walkthroughsService;
            this.updateItems();
            viewModel.onDidChangeHelpInformation(() => this.updateItems());
        }
        createHelpItemValue(info, infoKey) {
            return new HelpItemValue(this.commandService, this.walkthroughsService, info.extensionDescription, (typeof info.remoteName === 'string') ? [info.remoteName] : info.remoteName, info.virtualWorkspace, info[infoKey]);
        }
        updateItems() {
            const helpItems = [];
            const getStarted = this.viewModel.helpInformation.filter(info => info.getStarted);
            if (getStarted.length) {
                const helpItemValues = getStarted.map((info) => this.createHelpItemValue(info, 'getStarted'));
                const getStartedHelpItem = this.items?.find(item => item.icon === icons.getStartedIcon) ?? new GetStartedHelpItem(icons.getStartedIcon, nls.localize('remote.help.getStarted', "Get Started"), helpItemValues, this.quickInputService, this.environmentService, this.openerService, this.remoteExplorerService, this.workspaceContextService, this.commandService);
                getStartedHelpItem.values = helpItemValues;
                helpItems.push(getStartedHelpItem);
            }
            const documentation = this.viewModel.helpInformation.filter(info => info.documentation);
            if (documentation.length) {
                const helpItemValues = documentation.map((info) => this.createHelpItemValue(info, 'documentation'));
                const documentationHelpItem = this.items?.find(item => item.icon === icons.documentationIcon) ?? new HelpItem(icons.documentationIcon, nls.localize('remote.help.documentation', "Read Documentation"), helpItemValues, this.quickInputService, this.environmentService, this.openerService, this.remoteExplorerService, this.workspaceContextService);
                documentationHelpItem.values = helpItemValues;
                helpItems.push(documentationHelpItem);
            }
            const issues = this.viewModel.helpInformation.filter(info => info.issues);
            if (issues.length) {
                const helpItemValues = issues.map((info) => this.createHelpItemValue(info, 'issues'));
                const reviewIssuesHelpItem = this.items?.find(item => item.icon === icons.reviewIssuesIcon) ?? new HelpItem(icons.reviewIssuesIcon, nls.localize('remote.help.issues', "Review Issues"), helpItemValues, this.quickInputService, this.environmentService, this.openerService, this.remoteExplorerService, this.workspaceContextService);
                reviewIssuesHelpItem.values = helpItemValues;
                helpItems.push(reviewIssuesHelpItem);
            }
            if (helpItems.length) {
                const helpItemValues = this.viewModel.helpInformation.map(info => this.createHelpItemValue(info, 'reportIssue'));
                const issueReporterItem = this.items?.find(item => item.icon === icons.reportIssuesIcon) ?? new IssueReporterItem(icons.reportIssuesIcon, nls.localize('remote.help.report', "Report Issue"), helpItemValues, this.quickInputService, this.environmentService, this.commandService, this.openerService, this.remoteExplorerService, this.workspaceContextService);
                issueReporterItem.values = helpItemValues;
                helpItems.push(issueReporterItem);
            }
            if (helpItems.length) {
                this.items = helpItems;
            }
        }
    }
    class HelpItemValue {
        constructor(commandService, walkthroughService, extensionDescription, remoteAuthority, virtualWorkspace, urlOrCommandOrId) {
            this.commandService = commandService;
            this.walkthroughService = walkthroughService;
            this.extensionDescription = extensionDescription;
            this.remoteAuthority = remoteAuthority;
            this.virtualWorkspace = virtualWorkspace;
            this.urlOrCommandOrId = urlOrCommandOrId;
        }
        get description() {
            return this.getUrl().then(() => this._description);
        }
        get url() {
            return this.getUrl();
        }
        async getUrl() {
            if (this._url === undefined) {
                if (typeof this.urlOrCommandOrId === 'string') {
                    const url = uri_1.URI.parse(this.urlOrCommandOrId);
                    if (url.authority) {
                        this._url = this.urlOrCommandOrId;
                    }
                    else {
                        const urlCommand = this.commandService.executeCommand(this.urlOrCommandOrId).then((result) => {
                            // if executing this command times out, cache its value whenever it eventually resolves
                            this._url = result;
                            return this._url;
                        });
                        // We must be defensive. The command may never return, meaning that no help at all is ever shown!
                        const emptyString = new Promise(resolve => setTimeout(() => resolve(''), 500));
                        this._url = await Promise.race([urlCommand, emptyString]);
                    }
                }
                else if (this.urlOrCommandOrId?.id) {
                    try {
                        const walkthroughId = `${this.extensionDescription.id}#${this.urlOrCommandOrId.id}`;
                        const walkthrough = await this.walkthroughService.getWalkthrough(walkthroughId);
                        this._description = walkthrough.title;
                        this._url = walkthroughId;
                    }
                    catch { }
                }
            }
            if (this._url === undefined) {
                this._url = '';
            }
            return this._url;
        }
    }
    class HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService) {
            this.icon = icon;
            this.label = label;
            this.values = values;
            this.quickInputService = quickInputService;
            this.environmentService = environmentService;
            this.remoteExplorerService = remoteExplorerService;
            this.workspaceContextService = workspaceContextService;
            this.iconClasses = [];
            this.iconClasses.push(...themables_1.ThemeIcon.asClassNameArray(icon));
            this.iconClasses.push('remote-help-tree-node-item-icon');
        }
        async getActions() {
            return (await Promise.all(this.values.map(async (value) => {
                return {
                    label: value.extensionDescription.displayName || value.extensionDescription.identifier.value,
                    description: await value.description ?? await value.url,
                    url: await value.url,
                    extensionDescription: value.extensionDescription
                };
            }))).filter(item => item.description);
        }
        async handleClick() {
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (remoteAuthority) {
                for (let i = 0; i < this.remoteExplorerService.targetType.length; i++) {
                    if (remoteAuthority.startsWith(this.remoteExplorerService.targetType[i])) {
                        for (const value of this.values) {
                            if (value.remoteAuthority) {
                                for (const authority of value.remoteAuthority) {
                                    if (remoteAuthority.startsWith(authority)) {
                                        await this.takeAction(value.extensionDescription, await value.url);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                const virtualWorkspace = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.workspaceContextService.getWorkspace())?.scheme;
                if (virtualWorkspace) {
                    for (let i = 0; i < this.remoteExplorerService.targetType.length; i++) {
                        for (const value of this.values) {
                            if (value.virtualWorkspace && value.remoteAuthority) {
                                for (const authority of value.remoteAuthority) {
                                    if (this.remoteExplorerService.targetType[i].startsWith(authority) && virtualWorkspace.startsWith(value.virtualWorkspace)) {
                                        await this.takeAction(value.extensionDescription, await value.url);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (this.values.length > 1) {
                const actions = await this.getActions();
                if (actions.length) {
                    const action = await this.quickInputService.pick(actions, { placeHolder: nls.localize('pickRemoteExtension', "Select url to open") });
                    if (action) {
                        await this.takeAction(action.extensionDescription, action.url);
                    }
                }
            }
            else {
                await this.takeAction(this.values[0].extensionDescription, await this.values[0].url);
            }
        }
    }
    class GetStartedHelpItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, openerService, remoteExplorerService, workspaceContextService, commandService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService);
            this.openerService = openerService;
            this.commandService = commandService;
        }
        async takeAction(extensionDescription, urlOrWalkthroughId) {
            if ([network_1.Schemas.http, network_1.Schemas.https].includes(uri_1.URI.parse(urlOrWalkthroughId).scheme)) {
                this.openerService.open(urlOrWalkthroughId, { allowCommands: true });
                return;
            }
            this.commandService.executeCommand('workbench.action.openWalkthrough', urlOrWalkthroughId);
        }
    }
    class HelpItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, openerService, remoteExplorerService, workspaceContextService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService);
            this.openerService = openerService;
        }
        async takeAction(extensionDescription, url) {
            await this.openerService.open(uri_1.URI.parse(url), { allowCommands: true });
        }
    }
    class IssueReporterItem extends HelpItemBase {
        constructor(icon, label, values, quickInputService, environmentService, commandService, openerService, remoteExplorerService, workspaceContextService) {
            super(icon, label, values, quickInputService, environmentService, remoteExplorerService, workspaceContextService);
            this.commandService = commandService;
            this.openerService = openerService;
        }
        async getActions() {
            return Promise.all(this.values.map(async (value) => {
                return {
                    label: value.extensionDescription.displayName || value.extensionDescription.identifier.value,
                    description: '',
                    url: await value.url,
                    extensionDescription: value.extensionDescription
                };
            }));
        }
        async takeAction(extensionDescription, url) {
            if (!url) {
                await this.commandService.executeCommand('workbench.action.openIssueReporter', [extensionDescription.identifier.value]);
            }
            else {
                await this.openerService.open(uri_1.URI.parse(url));
            }
        }
    }
    let HelpPanel = class HelpPanel extends viewPane_1.ViewPane {
        static { this.ID = '~remote.helpPanel'; }
        static { this.TITLE = nls.localize2('remote.help', "Help and feedback"); }
        constructor(viewModel, options, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, viewDescriptorService, openerService, quickInputService, commandService, remoteExplorerService, environmentService, themeService, telemetryService, workspaceContextService, walkthroughsService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.viewModel = viewModel;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.workspaceContextService = workspaceContextService;
            this.walkthroughsService = walkthroughsService;
        }
        renderBody(container) {
            super.renderBody(container);
            container.classList.add('remote-help');
            const treeContainer = document.createElement('div');
            treeContainer.classList.add('remote-help-content');
            container.appendChild(treeContainer);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'RemoteHelp', treeContainer, new HelpTreeVirtualDelegate(), [new HelpTreeRenderer()], new HelpDataSource(), {
                accessibilityProvider: {
                    getAriaLabel: (item) => {
                        return item.label;
                    },
                    getWidgetAriaLabel: () => nls.localize('remotehelp', "Remote Help")
                }
            });
            const model = new HelpModel(this.viewModel, this.openerService, this.quickInputService, this.commandService, this.remoteExplorerService, this.environmentService, this.workspaceContextService, this.walkthroughsService);
            this.tree.setInput(model);
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, 75, true)(e => {
                e.element?.handleClick();
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
    };
    HelpPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, opener_1.IOpenerService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, commands_1.ICommandService),
        __param(11, remoteExplorerService_1.IRemoteExplorerService),
        __param(12, environmentService_1.IWorkbenchEnvironmentService),
        __param(13, themeService_1.IThemeService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, workspace_1.IWorkspaceContextService),
        __param(16, gettingStartedService_1.IWalkthroughsService)
    ], HelpPanel);
    class HelpPanelDescriptor {
        constructor(viewModel) {
            this.id = HelpPanel.ID;
            this.name = HelpPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.group = 'help@50';
            this.order = -10;
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(HelpPanel, [viewModel]);
        }
    }
    let RemoteViewPaneContainer = class RemoteViewPaneContainer extends viewsViewlet_1.FilterViewPaneContainer {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, themeService, contextMenuService, extensionService, remoteExplorerService, viewDescriptorService) {
            super(remoteExplorer_1.VIEWLET_ID, remoteExplorerService.onDidChangeTargetType, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, viewDescriptorService);
            this.remoteExplorerService = remoteExplorerService;
            this.helpPanelDescriptor = new HelpPanelDescriptor(this);
            this.helpInformation = [];
            this._onDidChangeHelpInformation = new event_1.Emitter();
            this.onDidChangeHelpInformation = this._onDidChangeHelpInformation.event;
            this.hasRegisteredHelpView = false;
            this.addConstantViewDescriptors([this.helpPanelDescriptor]);
            this._register(this.remoteSwitcher = this.instantiationService.createInstance(explorerViewItems_1.SwitchRemoteViewItem));
            this.remoteExplorerService.onDidChangeHelpInformation(extensions => {
                this._setHelpInformation(extensions);
            });
            this._setHelpInformation(this.remoteExplorerService.helpInformation);
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.remoteSwitcher.createOptionItems(viewsRegistry.getViews(this.viewContainer));
            this._register(viewsRegistry.onViewsRegistered(e => {
                const remoteViews = [];
                for (const view of e) {
                    if (view.viewContainer.id === remoteExplorer_1.VIEWLET_ID) {
                        remoteViews.push(...view.views);
                    }
                }
                if (remoteViews.length > 0) {
                    this.remoteSwitcher.createOptionItems(remoteViews);
                }
            }));
            this._register(viewsRegistry.onViewsDeregistered(e => {
                if (e.viewContainer.id === remoteExplorer_1.VIEWLET_ID) {
                    this.remoteSwitcher.removeOptionItems(e.views);
                }
            }));
        }
        _setHelpInformation(extensions) {
            const helpInformation = [];
            for (const extension of extensions) {
                this._handleRemoteInfoExtensionPoint(extension, helpInformation);
            }
            this.helpInformation = helpInformation;
            this._onDidChangeHelpInformation.fire();
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            if (this.helpInformation.length && !this.hasRegisteredHelpView) {
                const view = viewsRegistry.getView(this.helpPanelDescriptor.id);
                if (!view) {
                    viewsRegistry.registerViews([this.helpPanelDescriptor], this.viewContainer);
                }
                this.hasRegisteredHelpView = true;
            }
            else if (this.hasRegisteredHelpView) {
                viewsRegistry.deregisterViews([this.helpPanelDescriptor], this.viewContainer);
                this.hasRegisteredHelpView = false;
            }
        }
        _handleRemoteInfoExtensionPoint(extension, helpInformation) {
            if (!(0, extensions_1.isProposedApiEnabled)(extension.description, 'contribRemoteHelp')) {
                return;
            }
            if (!extension.value.documentation && !extension.value.getStarted && !extension.value.issues) {
                return;
            }
            helpInformation.push({
                extensionDescription: extension.description,
                getStarted: extension.value.getStarted,
                documentation: extension.value.documentation,
                reportIssue: extension.value.reportIssue,
                issues: extension.value.issues,
                remoteName: extension.value.remoteName,
                virtualWorkspace: extension.value.virtualWorkspace
            });
        }
        getFilterOn(viewDescriptor) {
            return (0, types_1.isStringArray)(viewDescriptor.remoteAuthority) ? viewDescriptor.remoteAuthority[0] : viewDescriptor.remoteAuthority;
        }
        setFilter(viewDescriptor) {
            this.remoteExplorerService.targetType = (0, types_1.isStringArray)(viewDescriptor.remoteAuthority) ? viewDescriptor.remoteAuthority : [viewDescriptor.remoteAuthority];
        }
        getTitle() {
            const title = nls.localize('remote.explorer', "Remote Explorer");
            return title;
        }
    };
    RemoteViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, extensions_1.IExtensionService),
        __param(9, remoteExplorerService_1.IRemoteExplorerService),
        __param(10, views_1.IViewDescriptorService)
    ], RemoteViewPaneContainer);
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: remoteExplorer_1.VIEWLET_ID,
        title: nls.localize2('remote.explorer', "Remote Explorer"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(RemoteViewPaneContainer),
        hideIfEmpty: true,
        viewOrderDelegate: {
            getOrder: (group) => {
                if (!group) {
                    return;
                }
                let matches = /^targets@(\d+)$/.exec(group);
                if (matches) {
                    return -1000;
                }
                matches = /^details(@(\d+))?$/.exec(group);
                if (matches) {
                    return -500 + Number(matches[2]);
                }
                matches = /^help(@(\d+))?$/.exec(group);
                if (matches) {
                    return -10;
                }
                return;
            }
        },
        icon: icons.remoteExplorerViewIcon,
        order: 4
    }, 0 /* ViewContainerLocation.Sidebar */);
    let RemoteMarkers = class RemoteMarkers {
        constructor(remoteAgentService, timerService) {
            remoteAgentService.getEnvironment().then(remoteEnv => {
                if (remoteEnv) {
                    timerService.setPerformanceMarks('server', remoteEnv.marks);
                }
            });
        }
    };
    exports.RemoteMarkers = RemoteMarkers;
    exports.RemoteMarkers = RemoteMarkers = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, timerService_1.ITimerService)
    ], RemoteMarkers);
    class VisibleProgress {
        get lastReport() {
            return this._lastReport;
        }
        constructor(progressService, location, initialReport, buttons, onDidCancel) {
            this.location = location;
            this._isDisposed = false;
            this._lastReport = initialReport;
            this._currentProgressPromiseResolve = null;
            this._currentProgress = null;
            this._currentTimer = null;
            const promise = new Promise((resolve) => this._currentProgressPromiseResolve = resolve);
            progressService.withProgress({ location: location, buttons: buttons }, (progress) => { if (!this._isDisposed) {
                this._currentProgress = progress;
            } return promise; }, (choice) => onDidCancel(choice, this._lastReport));
            if (this._lastReport) {
                this.report();
            }
        }
        dispose() {
            this._isDisposed = true;
            if (this._currentProgressPromiseResolve) {
                this._currentProgressPromiseResolve();
                this._currentProgressPromiseResolve = null;
            }
            this._currentProgress = null;
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
        report(message) {
            if (message) {
                this._lastReport = message;
            }
            if (this._lastReport && this._currentProgress) {
                this._currentProgress.report({ message: this._lastReport });
            }
        }
        startTimer(completionTime) {
            this.stopTimer();
            this._currentTimer = new ReconnectionTimer(this, completionTime);
        }
        stopTimer() {
            if (this._currentTimer) {
                this._currentTimer.dispose();
                this._currentTimer = null;
            }
        }
    }
    class ReconnectionTimer {
        constructor(parent, completionTime) {
            this._parent = parent;
            this._completionTime = completionTime;
            this._renderInterval = dom.disposableWindowInterval(window_1.mainWindow, () => this._render(), 1000);
            this._render();
        }
        dispose() {
            this._renderInterval.dispose();
        }
        _render() {
            const remainingTimeMs = this._completionTime - Date.now();
            if (remainingTimeMs < 0) {
                return;
            }
            const remainingTime = Math.ceil(remainingTimeMs / 1000);
            if (remainingTime === 1) {
                this._parent.report(nls.localize('reconnectionWaitOne', "Attempting to reconnect in {0} second...", remainingTime));
            }
            else {
                this._parent.report(nls.localize('reconnectionWaitMany', "Attempting to reconnect in {0} seconds...", remainingTime));
            }
        }
    }
    /**
     * The time when a prompt is shown to the user
     */
    const DISCONNECT_PROMPT_TIME = 40 * 1000; // 40 seconds
    let RemoteAgentConnectionStatusListener = class RemoteAgentConnectionStatusListener extends lifecycle_1.Disposable {
        constructor(remoteAgentService, progressService, dialogService, commandService, quickInputService, logService, environmentService, telemetryService) {
            super();
            this._reloadWindowShown = false;
            const connection = remoteAgentService.getConnection();
            if (connection) {
                let quickInputVisible = false;
                quickInputService.onShow(() => quickInputVisible = true);
                quickInputService.onHide(() => quickInputVisible = false);
                let visibleProgress = null;
                let reconnectWaitEvent = null;
                let disposableListener = null;
                function showProgress(location, buttons, initialReport = null) {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                    if (!location) {
                        location = quickInputVisible ? 15 /* ProgressLocation.Notification */ : 20 /* ProgressLocation.Dialog */;
                    }
                    return new VisibleProgress(progressService, location, initialReport, buttons.map(button => button.label), (choice, lastReport) => {
                        // Handle choice from dialog
                        if (typeof choice !== 'undefined' && buttons[choice]) {
                            buttons[choice].callback();
                        }
                        else {
                            if (location === 20 /* ProgressLocation.Dialog */) {
                                visibleProgress = showProgress(15 /* ProgressLocation.Notification */, buttons, lastReport);
                            }
                            else {
                                hideProgress();
                            }
                        }
                    });
                }
                function hideProgress() {
                    if (visibleProgress) {
                        visibleProgress.dispose();
                        visibleProgress = null;
                    }
                }
                let reconnectionToken = '';
                let lastIncomingDataTime = 0;
                let reconnectionAttempts = 0;
                const reconnectButton = {
                    label: nls.localize('reconnectNow', "Reconnect Now"),
                    callback: () => {
                        reconnectWaitEvent?.skipWait();
                    }
                };
                const reloadButton = {
                    label: nls.localize('reloadWindow', "Reload Window"),
                    callback: () => {
                        telemetryService.publicLog2('remoteReconnectionReload', {
                            remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                            reconnectionToken: reconnectionToken,
                            millisSinceLastIncomingData: Date.now() - lastIncomingDataTime,
                            attempt: reconnectionAttempts
                        });
                        commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                    }
                };
                // Possible state transitions:
                // ConnectionGain      -> ConnectionLost
                // ConnectionLost      -> ReconnectionWait, ReconnectionRunning
                // ReconnectionWait    -> ReconnectionRunning
                // ReconnectionRunning -> ConnectionGain, ReconnectionPermanentFailure
                connection.onDidStateChange((e) => {
                    visibleProgress?.stopTimer();
                    if (disposableListener) {
                        disposableListener.dispose();
                        disposableListener = null;
                    }
                    switch (e.type) {
                        case 0 /* PersistentConnectionEventType.ConnectionLost */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = 0;
                            telemetryService.publicLog2('remoteConnectionLost', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                            });
                            if (visibleProgress || e.millisSinceLastIncomingData > DISCONNECT_PROMPT_TIME) {
                                if (!visibleProgress) {
                                    visibleProgress = showProgress(null, [reconnectButton, reloadButton]);
                                }
                                visibleProgress.report(nls.localize('connectionLost', "Connection Lost"));
                            }
                            break;
                        case 1 /* PersistentConnectionEventType.ReconnectionWait */:
                            if (visibleProgress) {
                                reconnectWaitEvent = e;
                                visibleProgress = showProgress(null, [reconnectButton, reloadButton]);
                                visibleProgress.startTimer(Date.now() + 1000 * e.durationSeconds);
                            }
                            break;
                        case 2 /* PersistentConnectionEventType.ReconnectionRunning */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteReconnectionRunning', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt
                            });
                            if (visibleProgress || e.millisSinceLastIncomingData > DISCONNECT_PROMPT_TIME) {
                                visibleProgress = showProgress(null, [reloadButton]);
                                visibleProgress.report(nls.localize('reconnectionRunning', "Disconnected. Attempting to reconnect..."));
                                // Register to listen for quick input is opened
                                disposableListener = quickInputService.onShow(() => {
                                    // Need to move from dialog if being shown and user needs to type in a prompt
                                    if (visibleProgress && visibleProgress.location === 20 /* ProgressLocation.Dialog */) {
                                        visibleProgress = showProgress(15 /* ProgressLocation.Notification */, [reloadButton], visibleProgress.lastReport);
                                    }
                                });
                            }
                            break;
                        case 3 /* PersistentConnectionEventType.ReconnectionPermanentFailure */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteReconnectionPermanentFailure', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt,
                                handled: e.handled
                            });
                            hideProgress();
                            if (e.handled) {
                                logService.info(`Error handled: Not showing a notification for the error.`);
                                console.log(`Error handled: Not showing a notification for the error.`);
                            }
                            else if (!this._reloadWindowShown) {
                                this._reloadWindowShown = true;
                                dialogService.confirm({
                                    type: severity_1.default.Error,
                                    message: nls.localize('reconnectionPermanentFailure', "Cannot reconnect. Please reload the window."),
                                    primaryButton: nls.localize({ key: 'reloadWindow.dialog', comment: ['&& denotes a mnemonic'] }, "&&Reload Window")
                                }).then(result => {
                                    if (result.confirmed) {
                                        commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                                    }
                                });
                            }
                            break;
                        case 4 /* PersistentConnectionEventType.ConnectionGain */:
                            reconnectionToken = e.reconnectionToken;
                            lastIncomingDataTime = Date.now() - e.millisSinceLastIncomingData;
                            reconnectionAttempts = e.attempt;
                            telemetryService.publicLog2('remoteConnectionGain', {
                                remoteName: (0, remoteHosts_1.getRemoteName)(environmentService.remoteAuthority),
                                reconnectionToken: e.reconnectionToken,
                                millisSinceLastIncomingData: e.millisSinceLastIncomingData,
                                attempt: e.attempt
                            });
                            hideProgress();
                            break;
                    }
                });
            }
        }
    };
    exports.RemoteAgentConnectionStatusListener = RemoteAgentConnectionStatusListener;
    exports.RemoteAgentConnectionStatusListener = RemoteAgentConnectionStatusListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, progress_1.IProgressService),
        __param(2, dialogs_1.IDialogService),
        __param(3, commands_1.ICommandService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, log_1.ILogService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, telemetry_1.ITelemetryService)
    ], RemoteAgentConnectionStatusListener);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9yZW1vdGUvYnJvd3Nlci9yZW1vdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkRoRyxNQUFNLHVCQUF1QjtRQUM1QixTQUFTLENBQUMsT0FBa0I7WUFDM0IsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQWtCO1lBQy9CLE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQztLQUNEO0lBT0QsTUFBTSxnQkFBZ0I7UUFBdEI7WUFDQyxlQUFVLEdBQVcsa0JBQWtCLENBQUM7UUFvQnpDLENBQUM7UUFsQkEsY0FBYyxDQUFDLFNBQXNCO1lBQ3BDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDdEQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7WUFDOUUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDO1lBQ3pCLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUF3QyxFQUFFLEtBQWEsRUFBRSxZQUFtQyxFQUFFLE1BQTBCO1lBQ3JJLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7WUFDdEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pDLFlBQVksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEUsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDeEUsY0FBYyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUNsRCxDQUFDO1FBRUQsZUFBZSxDQUFDLFlBQW1DO1FBRW5ELENBQUM7S0FDRDtJQUVELE1BQU0sY0FBYztRQUNuQixXQUFXLENBQUMsT0FBa0I7WUFDN0IsT0FBTyxPQUFPLFlBQVksU0FBUyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxXQUFXLENBQUMsT0FBa0I7WUFDN0IsSUFBSSxPQUFPLFlBQVksU0FBUyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ3RCLENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7S0FDRDtJQVNELE1BQU0sU0FBUztRQUdkLFlBQ1MsU0FBcUIsRUFDckIsYUFBNkIsRUFDN0IsaUJBQXFDLEVBQ3JDLGNBQStCLEVBQy9CLHFCQUE2QyxFQUM3QyxrQkFBZ0QsRUFDaEQsdUJBQWlELEVBQ2pELG1CQUF5QztZQVB6QyxjQUFTLEdBQVQsU0FBUyxDQUFZO1lBQ3JCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM3QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3JDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQzdDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDaEQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUNqRCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBRWpELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixTQUFTLENBQUMsMEJBQTBCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVPLG1CQUFtQixDQUFDLElBQXFCLEVBQUUsT0FBbUc7WUFDckosT0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUMzQyxJQUFJLENBQUMsbUJBQW1CLEVBQ3hCLElBQUksQ0FBQyxvQkFBb0IsRUFDekIsQ0FBQyxPQUFPLElBQUksQ0FBQyxVQUFVLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUMzRSxJQUFJLENBQUMsZ0JBQWdCLEVBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ2pCLENBQUM7UUFFTyxXQUFXO1lBQ2xCLE1BQU0sU0FBUyxHQUFnQixFQUFFLENBQUM7WUFFbEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xGLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2QixNQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBcUIsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUMvRyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksSUFBSSxrQkFBa0IsQ0FDaEgsS0FBSyxDQUFDLGNBQWMsRUFDcEIsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxhQUFhLENBQUMsRUFDckQsY0FBYyxFQUNkLElBQUksQ0FBQyxpQkFBaUIsRUFDdEIsSUFBSSxDQUFDLGtCQUFrQixFQUN2QixJQUFJLENBQUMsYUFBYSxFQUNsQixJQUFJLENBQUMscUJBQXFCLEVBQzFCLElBQUksQ0FBQyx1QkFBdUIsRUFDNUIsSUFBSSxDQUFDLGNBQWMsQ0FDbkIsQ0FBQztnQkFDRixrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDO2dCQUMzQyxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUN4RixJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQXFCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDckgsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksSUFBSSxRQUFRLENBQzVHLEtBQUssQ0FBQyxpQkFBaUIsRUFDdkIsR0FBRyxDQUFDLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxvQkFBb0IsQ0FBQyxFQUMvRCxjQUFjLEVBQ2QsSUFBSSxDQUFDLGlCQUFpQixFQUN0QixJQUFJLENBQUMsa0JBQWtCLEVBQ3ZCLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxxQkFBcUIsRUFDMUIsSUFBSSxDQUFDLHVCQUF1QixDQUM1QixDQUFDO2dCQUNGLHFCQUFxQixDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7Z0JBQzlDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFFLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuQixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBcUIsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN2RyxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FDMUcsS0FBSyxDQUFDLGdCQUFnQixFQUN0QixHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLGVBQWUsQ0FBQyxFQUNuRCxjQUFjLEVBQ2QsSUFBSSxDQUFDLGlCQUFpQixFQUN0QixJQUFJLENBQUMsa0JBQWtCLEVBQ3ZCLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxxQkFBcUIsRUFDMUIsSUFBSSxDQUFDLHVCQUF1QixDQUM1QixDQUFDO2dCQUNGLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7Z0JBQzdDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDakgsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksSUFBSSxpQkFBaUIsQ0FDaEgsS0FBSyxDQUFDLGdCQUFnQixFQUN0QixHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLGNBQWMsQ0FBQyxFQUNsRCxjQUFjLEVBQ2QsSUFBSSxDQUFDLGlCQUFpQixFQUN0QixJQUFJLENBQUMsa0JBQWtCLEVBQ3ZCLElBQUksQ0FBQyxjQUFjLEVBQ25CLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxxQkFBcUIsRUFDMUIsSUFBSSxDQUFDLHVCQUF1QixDQUM1QixDQUFDO2dCQUNGLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7Z0JBQzFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO1lBQ3hCLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFFRCxNQUFNLGFBQWE7UUFJbEIsWUFBb0IsY0FBK0IsRUFBVSxrQkFBd0MsRUFBUyxvQkFBMkMsRUFBa0IsZUFBcUMsRUFBa0IsZ0JBQW9DLEVBQVUsZ0JBQTBDO1lBQXRTLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUFVLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFBUyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQWtCLG9CQUFlLEdBQWYsZUFBZSxDQUFzQjtZQUFrQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW9CO1lBQVUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUEwQjtRQUMxVCxDQUFDO1FBRUQsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsSUFBSSxHQUFHO1lBQ04sT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEIsQ0FBQztRQUVPLEtBQUssQ0FBQyxNQUFNO1lBQ25CLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDL0MsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDN0MsSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO29CQUNuQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxVQUFVLEdBQWdDLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFOzRCQUN6SCx1RkFBdUY7NEJBQ3ZGLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDOzRCQUNuQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7d0JBQ2xCLENBQUMsQ0FBQyxDQUFDO3dCQUNILGlHQUFpRzt3QkFDakcsTUFBTSxXQUFXLEdBQW9CLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUNoRyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUMzRCxDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxFQUFFLENBQUM7b0JBQ3RDLElBQUksQ0FBQzt3QkFDSixNQUFNLGFBQWEsR0FBRyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUNwRixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7d0JBQ2hGLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUM7b0JBQzNCLENBQUM7b0JBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDWixDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDaEIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFFRCxNQUFlLFlBQVk7UUFFMUIsWUFDUSxJQUFlLEVBQ2YsS0FBYSxFQUNiLE1BQXVCLEVBQ3RCLGlCQUFxQyxFQUNyQyxrQkFBZ0QsRUFDaEQscUJBQTZDLEVBQzdDLHVCQUFpRDtZQU5sRCxTQUFJLEdBQUosSUFBSSxDQUFXO1lBQ2YsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFdBQU0sR0FBTixNQUFNLENBQWlCO1lBQ3RCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDckMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUNoRCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQzdDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFSbkQsZ0JBQVcsR0FBYSxFQUFFLENBQUM7WUFVakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxxQkFBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRVMsS0FBSyxDQUFDLFVBQVU7WUFNekIsT0FBTyxDQUFDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3pELE9BQU87b0JBQ04sS0FBSyxFQUFFLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxLQUFLO29CQUM1RixXQUFXLEVBQUUsTUFBTSxLQUFLLENBQUMsV0FBVyxJQUFJLE1BQU0sS0FBSyxDQUFDLEdBQUc7b0JBQ3ZELEdBQUcsRUFBRSxNQUFNLEtBQUssQ0FBQyxHQUFHO29CQUNwQixvQkFBb0IsRUFBRSxLQUFLLENBQUMsb0JBQW9CO2lCQUNoRCxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVc7WUFDaEIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQztZQUNoRSxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDdkUsSUFBSSxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUMxRSxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDakMsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7Z0NBQzNCLEtBQUssTUFBTSxTQUFTLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO29DQUMvQyxJQUFJLGVBQWUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt3Q0FDM0MsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzt3Q0FDbkUsT0FBTztvQ0FDUixDQUFDO2dDQUNGLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLGdCQUFnQixHQUFHLElBQUEsOENBQTJCLEVBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDO2dCQUMxRyxJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUN2RSxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQzs0QkFDakMsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dDQUNyRCxLQUFLLE1BQU0sU0FBUyxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQ0FDL0MsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQzt3Q0FDM0gsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzt3Q0FDbkUsT0FBTztvQ0FDUixDQUFDO2dDQUNGLENBQUM7NEJBQ0YsQ0FBQzt3QkFFRixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFFeEMsSUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3BCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdEksSUFBSSxNQUFNLEVBQUUsQ0FBQzt3QkFDWixNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEUsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixFQUFFLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0RixDQUFDO1FBRUYsQ0FBQztLQUdEO0lBRUQsTUFBTSxrQkFBbUIsU0FBUSxZQUFZO1FBQzVDLFlBQ0MsSUFBZSxFQUNmLEtBQWEsRUFDYixNQUF1QixFQUN2QixpQkFBcUMsRUFDckMsa0JBQWdELEVBQ3hDLGFBQTZCLEVBQ3JDLHFCQUE2QyxFQUM3Qyx1QkFBaUQsRUFDekMsY0FBK0I7WUFFdkMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLHFCQUFxQixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFMMUcsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBRzdCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUd4QyxDQUFDO1FBRVMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxvQkFBMkMsRUFBRSxrQkFBMEI7WUFDakcsSUFBSSxDQUFDLGlCQUFPLENBQUMsSUFBSSxFQUFFLGlCQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNsRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRSxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLGtDQUFrQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDNUYsQ0FBQztLQUNEO0lBRUQsTUFBTSxRQUFTLFNBQVEsWUFBWTtRQUNsQyxZQUNDLElBQWUsRUFDZixLQUFhLEVBQ2IsTUFBdUIsRUFDdkIsaUJBQXFDLEVBQ3JDLGtCQUFnRCxFQUN4QyxhQUE2QixFQUNyQyxxQkFBNkMsRUFDN0MsdUJBQWlEO1lBRWpELEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBSjFHLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtRQUt0QyxDQUFDO1FBRVMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxvQkFBMkMsRUFBRSxHQUFXO1lBQ2xGLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7S0FDRDtJQUVELE1BQU0saUJBQWtCLFNBQVEsWUFBWTtRQUMzQyxZQUNDLElBQWUsRUFDZixLQUFhLEVBQ2IsTUFBdUIsRUFDdkIsaUJBQXFDLEVBQ3JDLGtCQUFnRCxFQUN4QyxjQUErQixFQUMvQixhQUE2QixFQUNyQyxxQkFBNkMsRUFDN0MsdUJBQWlEO1lBRWpELEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBTDFHLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMvQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7UUFLdEMsQ0FBQztRQUVrQixLQUFLLENBQUMsVUFBVTtZQU1sQyxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNsRCxPQUFPO29CQUNOLEtBQUssRUFBRSxLQUFLLENBQUMsb0JBQW9CLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsS0FBSztvQkFDNUYsV0FBVyxFQUFFLEVBQUU7b0JBQ2YsR0FBRyxFQUFFLE1BQU0sS0FBSyxDQUFDLEdBQUc7b0JBQ3BCLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxvQkFBb0I7aUJBQ2hELENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVTLEtBQUssQ0FBQyxVQUFVLENBQUMsb0JBQTJDLEVBQUUsR0FBVztZQUNsRixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3pILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFVLFNBQVEsbUJBQVE7aUJBQ2YsT0FBRSxHQUFHLG1CQUFtQixBQUF0QixDQUF1QjtpQkFDekIsVUFBSyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLG1CQUFtQixDQUFDLEFBQXBELENBQXFEO1FBRzFFLFlBQ1csU0FBcUIsRUFDL0IsT0FBeUIsRUFDTCxpQkFBcUMsRUFDcEMsa0JBQXVDLEVBQ3hDLGlCQUFxQyxFQUNsQyxvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQzFDLHFCQUE2QyxFQUNyRCxhQUE2QixFQUNmLGlCQUFxQyxFQUN4QyxjQUErQixFQUNmLHFCQUE2QyxFQUN2QyxrQkFBZ0QsRUFDbEYsWUFBMkIsRUFDdkIsZ0JBQW1DLEVBQ1gsdUJBQWlELEVBQ3JELG1CQUF5QztZQUVoRixLQUFLLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQWxCakwsY0FBUyxHQUFULFNBQVMsQ0FBWTtZQVNELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDeEMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2YsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUN2Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQThCO1lBR3RELDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDckQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtRQUdqRixDQUFDO1FBRWtCLFVBQVUsQ0FBQyxTQUFzQjtZQUNuRCxLQUFLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTVCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEQsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNuRCxTQUFTLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXJDLElBQUksQ0FBQyxJQUFJLEdBQTRELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsb0NBQXNCLEVBQ25JLFlBQVksRUFDWixhQUFhLEVBQ2IsSUFBSSx1QkFBdUIsRUFBRSxFQUM3QixDQUFDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxFQUN4QixJQUFJLGNBQWMsRUFBRSxFQUNwQjtnQkFDQyxxQkFBcUIsRUFBRTtvQkFDdEIsWUFBWSxFQUFFLENBQUMsSUFBa0IsRUFBRSxFQUFFO3dCQUNwQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7b0JBQ25CLENBQUM7b0JBQ0Qsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDO2lCQUNuRTthQUNELENBQ0QsQ0FBQztZQUVGLE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUUxTixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUUxQixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4RixDQUFDLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDO1lBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRWtCLFVBQVUsQ0FBQyxNQUFjLEVBQUUsS0FBYTtZQUMxRCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakMsQ0FBQzs7SUEvREksU0FBUztRQVFaLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDhCQUFzQixDQUFBO1FBQ3RCLFdBQUEsdUJBQWMsQ0FBQTtRQUNkLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsWUFBQSwwQkFBZSxDQUFBO1FBQ2YsWUFBQSw4Q0FBc0IsQ0FBQTtRQUN0QixZQUFBLGlEQUE0QixDQUFBO1FBQzVCLFlBQUEsNEJBQWEsQ0FBQTtRQUNiLFlBQUEsNkJBQWlCLENBQUE7UUFDakIsWUFBQSxvQ0FBd0IsQ0FBQTtRQUN4QixZQUFBLDRDQUFvQixDQUFBO09BdEJqQixTQUFTLENBZ0VkO0lBRUQsTUFBTSxtQkFBbUI7UUFTeEIsWUFBWSxTQUFxQjtZQVJ4QixPQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUNsQixTQUFJLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUV2Qix3QkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDM0Isa0JBQWEsR0FBRyxLQUFLLENBQUM7WUFDdEIsVUFBSyxHQUFHLFNBQVMsQ0FBQztZQUNsQixVQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFHcEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLDRCQUFjLENBQUMsU0FBUyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDO0tBQ0Q7SUFFRCxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNDQUF1QjtRQVE1RCxZQUMwQixhQUFzQyxFQUM1QyxnQkFBbUMsRUFDNUIsY0FBd0MsRUFDakQsY0FBK0IsRUFDekIsb0JBQTJDLEVBQzNDLG9CQUEyQyxFQUNuRCxZQUEyQixFQUNyQixrQkFBdUMsRUFDekMsZ0JBQW1DLEVBQzlCLHFCQUE4RCxFQUM5RCxxQkFBNkM7WUFFckUsS0FBSyxDQUFDLDJCQUFVLEVBQUUscUJBQXFCLENBQUMscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFIOU0sMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQWpCL0Usd0JBQW1CLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1RCxvQkFBZSxHQUFzQixFQUFFLENBQUM7WUFDaEMsZ0NBQTJCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNuRCwrQkFBMEIsR0FBZ0IsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQztZQUNoRiwwQkFBcUIsR0FBWSxLQUFLLENBQUM7WUFpQjlDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsd0NBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3JHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDbEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNyRSxNQUFNLGFBQWEsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBaUIsa0JBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUU1RSxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDbEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xELE1BQU0sV0FBVyxHQUFzQixFQUFFLENBQUM7Z0JBQzFDLEtBQUssTUFBTSxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3RCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssMkJBQVUsRUFBRSxDQUFDO3dCQUMxQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqQyxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUMsY0FBZSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNyRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNwRCxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxLQUFLLDJCQUFVLEVBQUUsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLGNBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pELENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLG1CQUFtQixDQUFDLFVBQTJEO1lBQ3RGLE1BQU0sZUFBZSxHQUFzQixFQUFFLENBQUM7WUFDOUMsS0FBSyxNQUFNLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLCtCQUErQixDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7WUFDdkMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksRUFBRSxDQUFDO1lBRXhDLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVFLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDaEUsTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM3RSxDQUFDO2dCQUNELElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7WUFDbkMsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUN2QyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM5RSxJQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO1FBRU8sK0JBQStCLENBQUMsU0FBK0MsRUFBRSxlQUFrQztZQUMxSCxJQUFJLENBQUMsSUFBQSxpQ0FBb0IsRUFBQyxTQUFTLENBQUMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLEVBQUUsQ0FBQztnQkFDdkUsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzlGLE9BQU87WUFDUixDQUFDO1lBRUQsZUFBZSxDQUFDLElBQUksQ0FBQztnQkFDcEIsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLFdBQVc7Z0JBQzNDLFVBQVUsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVU7Z0JBQ3RDLGFBQWEsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWE7Z0JBQzVDLFdBQVcsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLFdBQVc7Z0JBQ3hDLE1BQU0sRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU07Z0JBQzlCLFVBQVUsRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVU7Z0JBQ3RDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCO2FBQ2xELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxXQUFXLENBQUMsY0FBK0I7WUFDcEQsT0FBTyxJQUFBLHFCQUFhLEVBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO1FBQzNILENBQUM7UUFFUyxTQUFTLENBQUMsY0FBK0I7WUFDbEQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsR0FBRyxJQUFBLHFCQUFhLEVBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxlQUFnQixDQUFDLENBQUM7UUFDNUosQ0FBQztRQUVELFFBQVE7WUFDUCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDakUsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0tBQ0QsQ0FBQTtJQXhHSyx1QkFBdUI7UUFTMUIsV0FBQSx1Q0FBdUIsQ0FBQTtRQUN2QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLDhDQUFzQixDQUFBO1FBQ3RCLFlBQUEsOEJBQXNCLENBQUE7T0FuQm5CLHVCQUF1QixDQXdHNUI7SUFFRCxtQkFBUSxDQUFDLEVBQUUsQ0FBMEIsa0JBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLHFCQUFxQixDQUM1RjtRQUNDLEVBQUUsRUFBRSwyQkFBVTtRQUNkLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDO1FBQzFELGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQUMsdUJBQXVCLENBQUM7UUFDM0QsV0FBVyxFQUFFLElBQUk7UUFDakIsaUJBQWlCLEVBQUU7WUFDbEIsUUFBUSxFQUFFLENBQUMsS0FBYyxFQUFFLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDWixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxPQUFPLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUUzQyxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLE9BQU8sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2dCQUVELE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixDQUFDO2dCQUVELE9BQU87WUFDUixDQUFDO1NBQ0Q7UUFDRCxJQUFJLEVBQUUsS0FBSyxDQUFDLHNCQUFzQjtRQUNsQyxLQUFLLEVBQUUsQ0FBQztLQUNSLHdDQUFnQyxDQUFDO0lBRTVCLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7UUFFekIsWUFDc0Isa0JBQXVDLEVBQzdDLFlBQTJCO1lBRTFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDcEQsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZixZQUFZLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDN0QsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUFaWSxzQ0FBYTs0QkFBYixhQUFhO1FBR3ZCLFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSw0QkFBYSxDQUFBO09BSkgsYUFBYSxDQVl6QjtJQUVELE1BQU0sZUFBZTtRQVNwQixJQUFXLFVBQVU7WUFDcEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxZQUFZLGVBQWlDLEVBQUUsUUFBMEIsRUFBRSxhQUE0QixFQUFFLE9BQWlCLEVBQUUsV0FBNEU7WUFDdk0sSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLFdBQVcsR0FBRyxhQUFhLENBQUM7WUFDakMsSUFBSSxDQUFDLDhCQUE4QixHQUFHLElBQUksQ0FBQztZQUMzQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzdCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1lBRTFCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsOEJBQThCLEdBQUcsT0FBTyxDQUFDLENBQUM7WUFFOUYsZUFBZSxDQUFDLFlBQVksQ0FDM0IsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFDeEMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQztZQUFDLENBQUMsQ0FBQyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFDOUYsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUNqRCxDQUFDO1lBRUYsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNmLENBQUM7UUFDRixDQUFDO1FBRU0sT0FBTztZQUNiLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLElBQUksSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsOEJBQThCLEdBQUcsSUFBSSxDQUFDO1lBQzVDLENBQUM7WUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1lBQzdCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUVNLE1BQU0sQ0FBQyxPQUFnQjtZQUM3QixJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDO1lBQzVCLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDN0QsQ0FBQztRQUNGLENBQUM7UUFFTSxVQUFVLENBQUMsY0FBc0I7WUFDdkMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVNLFNBQVM7WUFDZixJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELE1BQU0saUJBQWlCO1FBS3RCLFlBQVksTUFBdUIsRUFBRSxjQUFzQjtZQUMxRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUN0QyxJQUFJLENBQUMsZUFBZSxHQUFHLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyxtQkFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVNLE9BQU87WUFDYixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFFTyxPQUFPO1lBQ2QsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDMUQsSUFBSSxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDeEQsSUFBSSxhQUFhLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsMENBQTBDLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNySCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSwyQ0FBMkMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3ZILENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFFRDs7T0FFRztJQUNILE1BQU0sc0JBQXNCLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLGFBQWE7SUFFaEQsSUFBTSxtQ0FBbUMsR0FBekMsTUFBTSxtQ0FBb0MsU0FBUSxzQkFBVTtRQUlsRSxZQUNzQixrQkFBdUMsRUFDMUMsZUFBaUMsRUFDbkMsYUFBNkIsRUFDNUIsY0FBK0IsRUFDNUIsaUJBQXFDLEVBQzVDLFVBQXVCLEVBQ04sa0JBQWdELEVBQzNELGdCQUFtQztZQUV0RCxLQUFLLEVBQUUsQ0FBQztZQVpELHVCQUFrQixHQUFZLEtBQUssQ0FBQztZQWEzQyxNQUFNLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN0RCxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztnQkFDOUIsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUN6RCxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLENBQUM7Z0JBRTFELElBQUksZUFBZSxHQUEyQixJQUFJLENBQUM7Z0JBQ25ELElBQUksa0JBQWtCLEdBQWlDLElBQUksQ0FBQztnQkFDNUQsSUFBSSxrQkFBa0IsR0FBdUIsSUFBSSxDQUFDO2dCQUVsRCxTQUFTLFlBQVksQ0FBQyxRQUF3RSxFQUFFLE9BQWtELEVBQUUsZ0JBQStCLElBQUk7b0JBQ3RMLElBQUksZUFBZSxFQUFFLENBQUM7d0JBQ3JCLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDMUIsZUFBZSxHQUFHLElBQUksQ0FBQztvQkFDeEIsQ0FBQztvQkFFRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ2YsUUFBUSxHQUFHLGlCQUFpQixDQUFDLENBQUMsd0NBQStCLENBQUMsaUNBQXdCLENBQUM7b0JBQ3hGLENBQUM7b0JBRUQsT0FBTyxJQUFJLGVBQWUsQ0FDekIsZUFBZSxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFDN0UsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUU7d0JBQ3RCLDRCQUE0Qjt3QkFDNUIsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7NEJBQ3RELE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDNUIsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLElBQUksUUFBUSxxQ0FBNEIsRUFBRSxDQUFDO2dDQUMxQyxlQUFlLEdBQUcsWUFBWSx5Q0FBZ0MsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDOzRCQUNwRixDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsWUFBWSxFQUFFLENBQUM7NEJBQ2hCLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDLENBQ0QsQ0FBQztnQkFDSCxDQUFDO2dCQUVELFNBQVMsWUFBWTtvQkFDcEIsSUFBSSxlQUFlLEVBQUUsQ0FBQzt3QkFDckIsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUMxQixlQUFlLEdBQUcsSUFBSSxDQUFDO29CQUN4QixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxpQkFBaUIsR0FBVyxFQUFFLENBQUM7Z0JBQ25DLElBQUksb0JBQW9CLEdBQVcsQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLG9CQUFvQixHQUFXLENBQUMsQ0FBQztnQkFFckMsTUFBTSxlQUFlLEdBQUc7b0JBQ3ZCLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUM7b0JBQ3BELFFBQVEsRUFBRSxHQUFHLEVBQUU7d0JBQ2Qsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLENBQUM7b0JBQ2hDLENBQUM7aUJBQ0QsQ0FBQztnQkFFRixNQUFNLFlBQVksR0FBRztvQkFDcEIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQztvQkFDcEQsUUFBUSxFQUFFLEdBQUcsRUFBRTt3QkFnQmQsZ0JBQWdCLENBQUMsVUFBVSxDQUFzRCwwQkFBMEIsRUFBRTs0QkFDNUcsVUFBVSxFQUFFLElBQUEsMkJBQWEsRUFBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUM7NEJBQzdELGlCQUFpQixFQUFFLGlCQUFpQjs0QkFDcEMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLG9CQUFvQjs0QkFDOUQsT0FBTyxFQUFFLG9CQUFvQjt5QkFDN0IsQ0FBQyxDQUFDO3dCQUVILGNBQWMsQ0FBQyxjQUFjLENBQUMsa0NBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3RELENBQUM7aUJBQ0QsQ0FBQztnQkFFRiw4QkFBOEI7Z0JBQzlCLHdDQUF3QztnQkFDeEMsK0RBQStEO2dCQUMvRCw2Q0FBNkM7Z0JBQzdDLHNFQUFzRTtnQkFFdEUsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7b0JBQ2pDLGVBQWUsRUFBRSxTQUFTLEVBQUUsQ0FBQztvQkFFN0IsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO3dCQUN4QixrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDN0Isa0JBQWtCLEdBQUcsSUFBSSxDQUFDO29CQUMzQixDQUFDO29CQUNELFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNoQjs0QkFDQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsaUJBQWlCLENBQUM7NEJBQ3hDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsMkJBQTJCLENBQUM7NEJBQ2xFLG9CQUFvQixHQUFHLENBQUMsQ0FBQzs0QkFZekIsZ0JBQWdCLENBQUMsVUFBVSxDQUFnRSxzQkFBc0IsRUFBRTtnQ0FDbEgsVUFBVSxFQUFFLElBQUEsMkJBQWEsRUFBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUM7Z0NBQzdELGlCQUFpQixFQUFFLENBQUMsQ0FBQyxpQkFBaUI7NkJBQ3RDLENBQUMsQ0FBQzs0QkFFSCxJQUFJLGVBQWUsSUFBSSxDQUFDLENBQUMsMkJBQTJCLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQztnQ0FDL0UsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29DQUN0QixlQUFlLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO2dDQUN2RSxDQUFDO2dDQUNELGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7NEJBQzNFLENBQUM7NEJBQ0QsTUFBTTt3QkFFUDs0QkFDQyxJQUFJLGVBQWUsRUFBRSxDQUFDO2dDQUNyQixrQkFBa0IsR0FBRyxDQUFDLENBQUM7Z0NBQ3ZCLGVBQWUsR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0NBQ3RFLGVBQWUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7NEJBQ25FLENBQUM7NEJBQ0QsTUFBTTt3QkFFUDs0QkFDQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsaUJBQWlCLENBQUM7NEJBQ3hDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsMkJBQTJCLENBQUM7NEJBQ2xFLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7NEJBZ0JqQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQTBFLDJCQUEyQixFQUFFO2dDQUNqSSxVQUFVLEVBQUUsSUFBQSwyQkFBYSxFQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQztnQ0FDN0QsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQjtnQ0FDdEMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLDJCQUEyQjtnQ0FDMUQsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPOzZCQUNsQixDQUFDLENBQUM7NEJBRUgsSUFBSSxlQUFlLElBQUksQ0FBQyxDQUFDLDJCQUEyQixHQUFHLHNCQUFzQixFQUFFLENBQUM7Z0NBQy9FLGVBQWUsR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQ0FDckQsZUFBZSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLDBDQUEwQyxDQUFDLENBQUMsQ0FBQztnQ0FFeEcsK0NBQStDO2dDQUMvQyxrQkFBa0IsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO29DQUNsRCw2RUFBNkU7b0NBQzdFLElBQUksZUFBZSxJQUFJLGVBQWUsQ0FBQyxRQUFRLHFDQUE0QixFQUFFLENBQUM7d0NBQzdFLGVBQWUsR0FBRyxZQUFZLHlDQUFnQyxDQUFDLFlBQVksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQ0FDM0csQ0FBQztnQ0FDRixDQUFDLENBQUMsQ0FBQzs0QkFDSixDQUFDOzRCQUVELE1BQU07d0JBRVA7NEJBQ0MsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixDQUFDOzRCQUN4QyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLDJCQUEyQixDQUFDOzRCQUNsRSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDOzRCQWtCakMsZ0JBQWdCLENBQUMsVUFBVSxDQUE0RixvQ0FBb0MsRUFBRTtnQ0FDNUosVUFBVSxFQUFFLElBQUEsMkJBQWEsRUFBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUM7Z0NBQzdELGlCQUFpQixFQUFFLENBQUMsQ0FBQyxpQkFBaUI7Z0NBQ3RDLDJCQUEyQixFQUFFLENBQUMsQ0FBQywyQkFBMkI7Z0NBQzFELE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTztnQ0FDbEIsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPOzZCQUNsQixDQUFDLENBQUM7NEJBRUgsWUFBWSxFQUFFLENBQUM7NEJBRWYsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0NBQ2YsVUFBVSxDQUFDLElBQUksQ0FBQywwREFBMEQsQ0FBQyxDQUFDO2dDQUM1RSxPQUFPLENBQUMsR0FBRyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7NEJBQ3pFLENBQUM7aUNBQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dDQUNyQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2dDQUMvQixhQUFhLENBQUMsT0FBTyxDQUFDO29DQUNyQixJQUFJLEVBQUUsa0JBQVEsQ0FBQyxLQUFLO29DQUNwQixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSw2Q0FBNkMsQ0FBQztvQ0FDcEcsYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLGlCQUFpQixDQUFDO2lDQUNsSCxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29DQUNoQixJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3Q0FDdEIsY0FBYyxDQUFDLGNBQWMsQ0FBQyxrQ0FBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQ0FDdEQsQ0FBQztnQ0FDRixDQUFDLENBQUMsQ0FBQzs0QkFDSixDQUFDOzRCQUNELE1BQU07d0JBRVA7NEJBQ0MsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixDQUFDOzRCQUN4QyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLDJCQUEyQixDQUFDOzRCQUNsRSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDOzRCQWdCakMsZ0JBQWdCLENBQUMsVUFBVSxDQUFnRSxzQkFBc0IsRUFBRTtnQ0FDbEgsVUFBVSxFQUFFLElBQUEsMkJBQWEsRUFBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUM7Z0NBQzdELGlCQUFpQixFQUFFLENBQUMsQ0FBQyxpQkFBaUI7Z0NBQ3RDLDJCQUEyQixFQUFFLENBQUMsQ0FBQywyQkFBMkI7Z0NBQzFELE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTzs2QkFDbEIsQ0FBQyxDQUFDOzRCQUVILFlBQVksRUFBRSxDQUFDOzRCQUNmLE1BQU07b0JBQ1IsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQTlRWSxrRkFBbUM7a0RBQW5DLG1DQUFtQztRQUs3QyxXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsNkJBQWlCLENBQUE7T0FaUCxtQ0FBbUMsQ0E4US9DIn0=