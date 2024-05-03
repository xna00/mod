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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/workbench/contrib/files/common/files", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/files/browser/views/explorerView", "vs/workbench/contrib/files/browser/views/emptyView", "vs/workbench/contrib/files/browser/views/openEditorsView", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/platform/telemetry/common/telemetry", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/workbench/common/views", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/keyCodes", "vs/platform/registry/common/platform", "vs/platform/progress/common/progress", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/browser/actions/windowActions", "vs/base/common/platform", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/browser/dom", "vs/css!./media/explorerviewlet"], function (require, exports, nls_1, performance_1, files_1, configuration_1, explorerView_1, emptyView_1, openEditorsView_1, storage_1, instantiation_1, extensions_1, workspace_1, telemetry_1, contextkey_1, themeService_1, views_1, contextView_1, lifecycle_1, layoutService_1, viewPaneContainer_1, keyCodes_1, platform_1, progress_1, descriptors_1, contextkeys_1, contextkeys_2, workspaceActions_1, windowActions_1, platform_2, codicons_1, iconRegistry_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VIEW_CONTAINER = exports.ExplorerViewPaneContainer = exports.ExplorerViewletViewsContribution = void 0;
    const explorerViewIcon = (0, iconRegistry_1.registerIcon)('explorer-view-icon', codicons_1.Codicon.files, (0, nls_1.localize)('explorerViewIcon', 'View icon of the explorer view.'));
    const openEditorsViewIcon = (0, iconRegistry_1.registerIcon)('open-editors-view-icon', codicons_1.Codicon.book, (0, nls_1.localize)('openEditorsIcon', 'View icon of the open editors view.'));
    let ExplorerViewletViewsContribution = class ExplorerViewletViewsContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.explorerViewletViews'; }
        constructor(workspaceContextService, progressService) {
            super();
            this.workspaceContextService = workspaceContextService;
            progressService.withProgress({ location: 1 /* ProgressLocation.Explorer */ }, () => workspaceContextService.getCompleteWorkspace()).finally(() => {
                this.registerViews();
                this._register(workspaceContextService.onDidChangeWorkbenchState(() => this.registerViews()));
                this._register(workspaceContextService.onDidChangeWorkspaceFolders(() => this.registerViews()));
            });
        }
        registerViews() {
            (0, performance_1.mark)('code/willRegisterExplorerViews');
            const viewDescriptors = viewsRegistry.getViews(exports.VIEW_CONTAINER);
            const viewDescriptorsToRegister = [];
            const viewDescriptorsToDeregister = [];
            const openEditorsViewDescriptor = this.createOpenEditorsViewDescriptor();
            if (!viewDescriptors.some(v => v.id === openEditorsViewDescriptor.id)) {
                viewDescriptorsToRegister.push(openEditorsViewDescriptor);
            }
            const explorerViewDescriptor = this.createExplorerViewDescriptor();
            const registeredExplorerViewDescriptor = viewDescriptors.find(v => v.id === explorerViewDescriptor.id);
            const emptyViewDescriptor = this.createEmptyViewDescriptor();
            const registeredEmptyViewDescriptor = viewDescriptors.find(v => v.id === emptyViewDescriptor.id);
            if (this.workspaceContextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ || this.workspaceContextService.getWorkspace().folders.length === 0) {
                if (registeredExplorerViewDescriptor) {
                    viewDescriptorsToDeregister.push(registeredExplorerViewDescriptor);
                }
                if (!registeredEmptyViewDescriptor) {
                    viewDescriptorsToRegister.push(emptyViewDescriptor);
                }
            }
            else {
                if (registeredEmptyViewDescriptor) {
                    viewDescriptorsToDeregister.push(registeredEmptyViewDescriptor);
                }
                if (!registeredExplorerViewDescriptor) {
                    viewDescriptorsToRegister.push(explorerViewDescriptor);
                }
            }
            if (viewDescriptorsToDeregister.length) {
                viewsRegistry.deregisterViews(viewDescriptorsToDeregister, exports.VIEW_CONTAINER);
            }
            if (viewDescriptorsToRegister.length) {
                viewsRegistry.registerViews(viewDescriptorsToRegister, exports.VIEW_CONTAINER);
            }
            (0, performance_1.mark)('code/didRegisterExplorerViews');
        }
        createOpenEditorsViewDescriptor() {
            return {
                id: openEditorsView_1.OpenEditorsView.ID,
                name: openEditorsView_1.OpenEditorsView.NAME,
                ctorDescriptor: new descriptors_1.SyncDescriptor(openEditorsView_1.OpenEditorsView),
                containerIcon: openEditorsViewIcon,
                order: 0,
                canToggleVisibility: true,
                canMoveView: true,
                collapsed: false,
                hideByDefault: true,
                focusCommand: {
                    id: 'workbench.files.action.focusOpenEditorsView',
                    keybindings: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 35 /* KeyCode.KeyE */) }
                }
            };
        }
        createEmptyViewDescriptor() {
            return {
                id: emptyView_1.EmptyView.ID,
                name: emptyView_1.EmptyView.NAME,
                containerIcon: explorerViewIcon,
                ctorDescriptor: new descriptors_1.SyncDescriptor(emptyView_1.EmptyView),
                order: 1,
                canToggleVisibility: true,
                focusCommand: {
                    id: 'workbench.explorer.fileView.focus'
                }
            };
        }
        createExplorerViewDescriptor() {
            return {
                id: files_1.VIEW_ID,
                name: (0, nls_1.localize2)('folders', "Folders"),
                containerIcon: explorerViewIcon,
                ctorDescriptor: new descriptors_1.SyncDescriptor(explorerView_1.ExplorerView),
                order: 1,
                canMoveView: true,
                canToggleVisibility: false,
                focusCommand: {
                    id: 'workbench.explorer.fileView.focus'
                }
            };
        }
    };
    exports.ExplorerViewletViewsContribution = ExplorerViewletViewsContribution;
    exports.ExplorerViewletViewsContribution = ExplorerViewletViewsContribution = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, progress_1.IProgressService)
    ], ExplorerViewletViewsContribution);
    let ExplorerViewPaneContainer = class ExplorerViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, contextKeyService, themeService, contextMenuService, extensionService, viewDescriptorService) {
            super(files_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.viewletVisibleContextKey = files_1.ExplorerViewletVisibleContext.bindTo(contextKeyService);
            this._register(this.contextService.onDidChangeWorkspaceName(e => this.updateTitleArea()));
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('explorer-viewlet');
        }
        createView(viewDescriptor, options) {
            if (viewDescriptor.id === files_1.VIEW_ID) {
                return this.instantiationService.createInstance(explorerView_1.ExplorerView, {
                    ...options, delegate: {
                        willOpenElement: e => {
                            if (!(0, dom_1.isMouseEvent)(e)) {
                                return; // only delay when user clicks
                            }
                            const openEditorsView = this.getOpenEditorsView();
                            if (openEditorsView) {
                                let delay = 0;
                                const config = this.configurationService.getValue();
                                if (!!config.workbench?.editor?.enablePreview) {
                                    // delay open editors view when preview is enabled
                                    // to accomodate for the user doing a double click
                                    // to pin the editor.
                                    // without this delay a double click would be not
                                    // possible because the next element would move
                                    // under the mouse after the first click.
                                    delay = 250;
                                }
                                openEditorsView.setStructuralRefreshDelay(delay);
                            }
                        },
                        didOpenElement: e => {
                            if (!(0, dom_1.isMouseEvent)(e)) {
                                return; // only delay when user clicks
                            }
                            const openEditorsView = this.getOpenEditorsView();
                            openEditorsView?.setStructuralRefreshDelay(0);
                        }
                    }
                });
            }
            return super.createView(viewDescriptor, options);
        }
        getExplorerView() {
            return this.getView(files_1.VIEW_ID);
        }
        getOpenEditorsView() {
            return this.getView(openEditorsView_1.OpenEditorsView.ID);
        }
        setVisible(visible) {
            this.viewletVisibleContextKey.set(visible);
            super.setVisible(visible);
        }
        focus() {
            const explorerView = this.getView(files_1.VIEW_ID);
            if (explorerView && this.panes.every(p => !p.isExpanded())) {
                explorerView.setExpanded(true);
            }
            if (explorerView?.isExpanded()) {
                explorerView.focus();
            }
            else {
                super.focus();
            }
        }
    };
    exports.ExplorerViewPaneContainer = ExplorerViewPaneContainer;
    exports.ExplorerViewPaneContainer = ExplorerViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, views_1.IViewDescriptorService)
    ], ExplorerViewPaneContainer);
    const viewContainerRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
    /**
     * Explorer viewlet container.
     */
    exports.VIEW_CONTAINER = viewContainerRegistry.registerViewContainer({
        id: files_1.VIEWLET_ID,
        title: (0, nls_1.localize2)('explore', "Explorer"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(ExplorerViewPaneContainer),
        storageId: 'workbench.explorer.views.state',
        icon: explorerViewIcon,
        alwaysUseContainerInfo: true,
        hideIfEmpty: true,
        order: 0,
        openCommandActionDescriptor: {
            id: files_1.VIEWLET_ID,
            title: (0, nls_1.localize2)('explore', "Explorer"),
            mnemonicTitle: (0, nls_1.localize)({ key: 'miViewExplorer', comment: ['&& denotes a mnemonic'] }, "&&Explorer"),
            keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 35 /* KeyCode.KeyE */ },
            order: 0
        },
    }, 0 /* ViewContainerLocation.Sidebar */, { isDefault: true });
    const openFolder = (0, nls_1.localize)('openFolder', "Open Folder");
    const addAFolder = (0, nls_1.localize)('addAFolder', "add a folder");
    const openRecent = (0, nls_1.localize)('openRecent', "Open Recent");
    const addRootFolderButton = `[${openFolder}](command:${workspaceActions_1.AddRootFolderAction.ID})`;
    const addAFolderButton = `[${addAFolder}](command:${workspaceActions_1.AddRootFolderAction.ID})`;
    const openFolderButton = `[${openFolder}](command:${(platform_2.isMacintosh && !platform_2.isWeb) ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFolderAction.ID})`;
    const openFolderViaWorkspaceButton = `[${openFolder}](command:${workspaceActions_1.OpenFolderViaWorkspaceAction.ID})`;
    const openRecentButton = `[${openRecent}](command:${windowActions_1.OpenRecentAction.ID})`;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noWorkspaceHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet added a folder to the workspace.\n{0}", addRootFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // inside a .code-workspace
        contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), 
        // unless we cannot enter or open workspaces (e.g. web serverless)
        contextkeys_1.OpenFolderWorkspaceSupportContext),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noFolderHelpWeb', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet opened a folder.\n{0}\n{1}", openFolderViaWorkspaceButton, openRecentButton),
        when: contextkey_1.ContextKeyExpr.and(
        // inside a .code-workspace
        contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), 
        // we cannot enter workspaces (e.g. web serverless)
        contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated()),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'remoteNoFolderHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "Connected to remote.\n{0}", openFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // not inside a .code-workspace
        contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), 
        // connected to a remote
        contextkeys_1.RemoteNameContext.notEqualsTo(''), 
        // but not in web
        contextkeys_2.IsWebContext.toNegated()),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noFolderButEditorsHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet opened a folder.\n{0}\nOpening a folder will close all currently open editors. To keep them open, {1} instead.", openFolderButton, addAFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // editors are opened
        contextkey_1.ContextKeyExpr.has('editorIsOpen'), contextkey_1.ContextKeyExpr.or(
        // not inside a .code-workspace and local
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_1.RemoteNameContext.isEqualTo('')), 
        // not inside a .code-workspace and web
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_2.IsWebContext))),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
    viewsRegistry.registerViewWelcomeContent(emptyView_1.EmptyView.ID, {
        content: (0, nls_1.localize)({ key: 'noFolderHelp', comment: ['Please do not translate the word "command", it is part of our internal syntax which must not change'] }, "You have not yet opened a folder.\n{0}", openFolderButton),
        when: contextkey_1.ContextKeyExpr.and(
        // no editor is open
        contextkey_1.ContextKeyExpr.has('editorIsOpen')?.negate(), contextkey_1.ContextKeyExpr.or(
        // not inside a .code-workspace and local
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_1.RemoteNameContext.isEqualTo('')), 
        // not inside a .code-workspace and web
        contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace'), contextkeys_2.IsWebContext))),
        group: views_1.ViewContentGroups.Open,
        order: 1
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3bGV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2V4cGxvcmVyVmlld2xldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQ2hHLE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSwyQkFBWSxFQUFDLG9CQUFvQixFQUFFLGtCQUFPLENBQUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLGlDQUFpQyxDQUFDLENBQUMsQ0FBQztJQUM1SSxNQUFNLG1CQUFtQixHQUFHLElBQUEsMkJBQVksRUFBQyx3QkFBd0IsRUFBRSxrQkFBTyxDQUFDLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDLENBQUM7SUFFOUksSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtpQkFFL0MsT0FBRSxHQUFHLHdDQUF3QyxBQUEzQyxDQUE0QztRQUU5RCxZQUM0Qyx1QkFBaUQsRUFDMUUsZUFBaUM7WUFFbkQsS0FBSyxFQUFFLENBQUM7WUFIbUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUs1RixlQUFlLENBQUMsWUFBWSxDQUFDLEVBQUUsUUFBUSxtQ0FBMkIsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUN4SSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBRXJCLElBQUksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMseUJBQXlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFD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