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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/contextkeys", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspace", "vs/workbench/services/layout/browser/layoutService", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/platform", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/product/common/productService", "vs/platform/files/common/files", "vs/platform/window/common/window", "vs/base/browser/window", "vs/workbench/common/editor/diffEditorInput", "vs/base/browser/browser", "vs/base/common/network"], function (require, exports, event_1, lifecycle_1, contextkey_1, contextkeys_1, contextkeys_2, editor_1, dom_1, editorGroupsService_1, configuration_1, environmentService_1, editorService_1, workspace_1, layoutService_1, remoteHosts_1, virtualWorkspace_1, workingCopyService_1, platform_1, editorResolverService_1, panecomposite_1, webFileSystemAccess_1, productService_1, files_1, window_1, window_2, diffEditorInput_1, browser_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchContextKeysHandler = void 0;
    let WorkbenchContextKeysHandler = class WorkbenchContextKeysHandler extends lifecycle_1.Disposable {
        constructor(contextKeyService, contextService, configurationService, environmentService, productService, editorService, editorResolverService, editorGroupService, layoutService, paneCompositeService, workingCopyService, fileService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.productService = productService;
            this.editorService = editorService;
            this.editorResolverService = editorResolverService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
            this.paneCompositeService = paneCompositeService;
            this.workingCopyService = workingCopyService;
            this.fileService = fileService;
            // Platform
            contextkeys_1.IsMacContext.bindTo(this.contextKeyService);
            contextkeys_1.IsLinuxContext.bindTo(this.contextKeyService);
            contextkeys_1.IsWindowsContext.bindTo(this.contextKeyService);
            contextkeys_1.IsWebContext.bindTo(this.contextKeyService);
            contextkeys_1.IsMacNativeContext.bindTo(this.contextKeyService);
            contextkeys_1.IsIOSContext.bindTo(this.contextKeyService);
            contextkeys_1.IsMobileContext.bindTo(this.contextKeyService);
            contextkeys_2.RemoteNameContext.bindTo(this.contextKeyService).set((0, remoteHosts_1.getRemoteName)(this.environmentService.remoteAuthority) || '');
            this.virtualWorkspaceContext = contextkeys_2.VirtualWorkspaceContext.bindTo(this.contextKeyService);
            this.temporaryWorkspaceContext = contextkeys_2.TemporaryWorkspaceContext.bindTo(this.contextKeyService);
            this.updateWorkspaceContextKeys();
            // Capabilities
            contextkeys_2.HasWebFileSystemAccess.bindTo(this.contextKeyService).set(webFileSystemAccess_1.WebFileSystemAccess.supported(window_2.mainWindow));
            // Development
            const isDevelopment = !this.environmentService.isBuilt || this.environmentService.isExtensionDevelopment;
            contextkeys_1.IsDevelopmentContext.bindTo(this.contextKeyService).set(isDevelopment);
            (0, contextkey_1.setConstant)(contextkeys_1.IsDevelopmentContext.key, isDevelopment);
            // Product Service
            contextkeys_1.ProductQualityContext.bindTo(this.contextKeyService).set(this.productService.quality || '');
            contextkeys_2.EmbedderIdentifierContext.bindTo(this.contextKeyService).set(productService.embedderIdentifier);
            // Editors
            this.activeEditorContext = contextkeys_2.ActiveEditorContext.bindTo(this.contextKeyService);
            this.activeEditorIsReadonly = contextkeys_2.ActiveEditorReadonlyContext.bindTo(this.contextKeyService);
            this.activeCompareEditorCanSwap = contextkeys_2.ActiveCompareEditorCanSwapContext.bindTo(this.contextKeyService);
            this.activeEditorCanToggleReadonly = contextkeys_2.ActiveEditorCanToggleReadonlyContext.bindTo(this.contextKeyService);
            this.activeEditorCanRevert = contextkeys_2.ActiveEditorCanRevertContext.bindTo(this.contextKeyService);
            this.activeEditorCanSplitInGroup = contextkeys_2.ActiveEditorCanSplitInGroupContext.bindTo(this.contextKeyService);
            this.activeEditorAvailableEditorIds = contextkeys_2.ActiveEditorAvailableEditorIdsContext.bindTo(this.contextKeyService);
            this.editorsVisibleContext = contextkeys_2.EditorsVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorVisibleContext = contextkeys_2.TextCompareEditorVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorActiveContext = contextkeys_2.TextCompareEditorActiveContext.bindTo(this.contextKeyService);
            this.sideBySideEditorActiveContext = contextkeys_2.SideBySideEditorActiveContext.bindTo(this.contextKeyService);
            this.activeEditorGroupEmpty = contextkeys_2.ActiveEditorGroupEmptyContext.bindTo(this.contextKeyService);
            this.activeEditorGroupIndex = contextkeys_2.ActiveEditorGroupIndexContext.bindTo(this.contextKeyService);
            this.activeEditorGroupLast = contextkeys_2.ActiveEditorGroupLastContext.bindTo(this.contextKeyService);
            this.activeEditorGroupLocked = contextkeys_2.ActiveEditorGroupLockedContext.bindTo(this.contextKeyService);
            this.multipleEditorGroupsContext = contextkeys_2.MultipleEditorGroupsContext.bindTo(this.contextKeyService);
            // Working Copies
            this.dirtyWorkingCopiesContext = contextkeys_2.DirtyWorkingCopiesContext.bindTo(this.contextKeyService);
            this.dirtyWorkingCopiesContext.set(this.workingCopyService.hasDirty);
            // Inputs
            this.inputFocusedContext = contextkeys_1.InputFocusedContext.bindTo(this.contextKeyService);
            // Workbench State
            this.workbenchStateContext = contextkeys_2.WorkbenchStateContext.bindTo(this.contextKeyService);
            this.updateWorkbenchStateContextKey();
            // Workspace Folder Count
            this.workspaceFolderCountContext = contextkeys_2.WorkspaceFolderCountContext.bindTo(this.contextKeyService);
            this.updateWorkspaceFolderCountContextKey();
            // Opening folder support: support for opening a folder workspace
            // (e.g. "Open Folder...") is limited in web when not connected
            // to a remote.
            this.openFolderWorkspaceSupportContext = contextkeys_2.OpenFolderWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.openFolderWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Empty workspace support: empty workspaces require built-in file system
            // providers to be available that allow to enter a workspace or open loose
            // files. This condition is met:
            // - desktop: always
            // -     web: only when connected to a remote
            this.emptyWorkspaceSupportContext = contextkeys_2.EmptyWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.emptyWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Entering a multi root workspace support: support for entering a multi-root
            // workspace (e.g. "Open Workspace from File...", "Duplicate Workspace", "Save Workspace")
            // is driven by the ability to resolve a workspace configuration file (*.code-workspace)
            // with a built-in file system provider.
            // This condition is met:
            // - desktop: always
            // -     web: only when connected to a remote
            this.enterMultiRootWorkspaceSupportContext = contextkeys_2.EnterMultiRootWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.enterMultiRootWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Editor Layout
            this.splitEditorsVerticallyContext = contextkeys_2.SplitEditorsVertically.bindTo(this.contextKeyService);
            this.updateSplitEditorsVerticallyContext();
            // Window
            this.isMainWindowFullscreenContext = contextkeys_2.IsMainWindowFullscreenContext.bindTo(this.contextKeyService);
            this.isAuxiliaryWindowFocusedContext = contextkeys_2.IsAuxiliaryWindowFocusedContext.bindTo(this.contextKeyService);
            // Zen Mode
            this.inZenModeContext = contextkeys_2.InEditorZenModeContext.bindTo(this.contextKeyService);
            // Centered Layout (Main Editor)
            this.isMainEditorCenteredLayoutContext = contextkeys_2.IsMainEditorCenteredLayoutContext.bindTo(this.contextKeyService);
            // Editor Area
            this.mainEditorAreaVisibleContext = contextkeys_2.MainEditorAreaVisibleContext.bindTo(this.contextKeyService);
            this.editorTabsVisibleContext = contextkeys_2.EditorTabsVisibleContext.bindTo(this.contextKeyService);
            // Sidebar
            this.sideBarVisibleContext = contextkeys_2.SideBarVisibleContext.bindTo(this.contextKeyService);
            // Title Bar
            this.titleAreaVisibleContext = contextkeys_2.TitleBarVisibleContext.bindTo(this.contextKeyService);
            this.titleBarStyleContext = contextkeys_2.TitleBarStyleContext.bindTo(this.contextKeyService);
            this.updateTitleBarContextKeys();
            // Panel
            this.panelPositionContext = contextkeys_2.PanelPositionContext.bindTo(this.contextKeyService);
            this.panelPositionContext.set((0, layoutService_1.positionToString)(this.layoutService.getPanelPosition()));
            this.panelVisibleContext = contextkeys_2.PanelVisibleContext.bindTo(this.contextKeyService);
            this.panelVisibleContext.set(this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */));
            this.panelMaximizedContext = contextkeys_2.PanelMaximizedContext.bindTo(this.contextKeyService);
            this.panelMaximizedContext.set(this.layoutService.isPanelMaximized());
            this.panelAlignmentContext = contextkeys_2.PanelAlignmentContext.bindTo(this.contextKeyService);
            this.panelAlignmentContext.set(this.layoutService.getPanelAlignment());
            // Auxiliary Bar
            this.auxiliaryBarVisibleContext = contextkeys_2.AuxiliaryBarVisibleContext.bindTo(this.contextKeyService);
            this.auxiliaryBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */));
            this.registerListeners();
        }
        registerListeners() {
            this.editorGroupService.whenReady.then(() => {
                this.updateEditorAreaContextKeys();
                this.updateEditorContextKeys();
            });
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateEditorContextKeys()));
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidAddGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidChangeGroupIndex(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidChangeActiveGroup(() => this.updateEditorGroupContextKeys()));
            this._register(this.editorGroupService.onDidChangeGroupLocked(() => this.updateEditorGroupContextKeys()));
            this._register(this.editorGroupService.onDidChangeEditorPartOptions(() => this.updateEditorAreaContextKeys()));
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => disposables.add((0, dom_1.addDisposableListener)(window, dom_1.EventType.FOCUS_IN, () => this.updateInputContextKeys(window.document), true)), { window: window_2.mainWindow, disposables: this._store }));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateWorkbenchStateContextKey()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => {
                this.updateWorkspaceFolderCountContextKey();
                this.updateWorkspaceContextKeys();
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.editor.openSideBySideDirection')) {
                    this.updateSplitEditorsVerticallyContext();
                }
            }));
            this._register(this.layoutService.onDidChangeZenMode(enabled => this.inZenModeContext.set(enabled)));
            this._register(this.layoutService.onDidChangeActiveContainer(() => this.isAuxiliaryWindowFocusedContext.set(this.layoutService.activeContainer !== this.layoutService.mainContainer)));
            this._register((0, browser_1.onDidChangeFullscreen)(windowId => {
                if (windowId === window_2.mainWindow.vscodeWindowId) {
                    this.isMainWindowFullscreenContext.set((0, browser_1.isFullscreen)(window_2.mainWindow));
                }
            }));
            this._register(this.layoutService.onDidChangeMainEditorCenteredLayout(centered => this.isMainEditorCenteredLayoutContext.set(centered)));
            this._register(this.layoutService.onDidChangePanelPosition(position => this.panelPositionContext.set(position)));
            this._register(this.layoutService.onDidChangePanelAlignment(alignment => this.panelAlignmentContext.set(alignment)));
            this._register(this.paneCompositeService.onDidPaneCompositeClose(() => this.updateSideBarContextKeys()));
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(() => this.updateSideBarContextKeys()));
            this._register(this.layoutService.onDidChangePartVisibility(() => {
                this.mainEditorAreaVisibleContext.set(this.layoutService.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, window_2.mainWindow));
                this.panelVisibleContext.set(this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */));
                this.panelMaximizedContext.set(this.layoutService.isPanelMaximized());
                this.auxiliaryBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */));
                this.updateTitleBarContextKeys();
            }));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.dirtyWorkingCopiesContext.set(workingCopy.isDirty() || this.workingCopyService.hasDirty)));
        }
        updateEditorAreaContextKeys() {
            this.editorTabsVisibleContext.set(this.editorGroupService.partOptions.showTabs === 'multiple');
        }
        updateEditorContextKeys() {
            const activeEditorPane = this.editorService.activeEditorPane;
            const visibleEditorPanes = this.editorService.visibleEditorPanes;
            this.textCompareEditorActiveContext.set(activeEditorPane?.getId() === editor_1.TEXT_DIFF_EDITOR_ID);
            this.textCompareEditorVisibleContext.set(visibleEditorPanes.some(editorPane => editorPane.getId() === editor_1.TEXT_DIFF_EDITOR_ID));
            this.sideBySideEditorActiveContext.set(activeEditorPane?.getId() === editor_1.SIDE_BY_SIDE_EDITOR_ID);
            if (visibleEditorPanes.length > 0) {
                this.editorsVisibleContext.set(true);
            }
            else {
                this.editorsVisibleContext.reset();
            }
            if (!this.editorService.activeEditor) {
                this.activeEditorGroupEmpty.set(true);
            }
            else {
                this.activeEditorGroupEmpty.reset();
            }
            this.updateEditorGroupContextKeys();
            if (activeEditorPane) {
                this.activeEditorContext.set(activeEditorPane.getId());
                this.activeEditorCanRevert.set(!activeEditorPane.input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
                this.activeEditorCanSplitInGroup.set(activeEditorPane.input.hasCapability(32 /* EditorInputCapabilities.CanSplitInGroup */));
                (0, contextkeys_2.applyAvailableEditorIds)(this.activeEditorAvailableEditorIds, activeEditorPane.input, this.editorResolverService);
                this.activeEditorIsReadonly.set(!!activeEditorPane.input.isReadonly());
                const primaryEditorResource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                const secondaryEditorResource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditorPane.input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                this.activeCompareEditorCanSwap.set(activeEditorPane.input instanceof diffEditorInput_1.DiffEditorInput && !activeEditorPane.input.original.isReadonly() && !!primaryEditorResource && (this.fileService.hasProvider(primaryEditorResource) || primaryEditorResource.scheme === network_1.Schemas.untitled) && !!secondaryEditorResource && (this.fileService.hasProvider(secondaryEditorResource) || secondaryEditorResource.scheme === network_1.Schemas.untitled));
                this.activeEditorCanToggleReadonly.set(!!primaryEditorResource && this.fileService.hasProvider(primaryEditorResource) && !this.fileService.hasCapability(primaryEditorResource, 2048 /* FileSystemProviderCapabilities.Readonly */));
            }
            else {
                this.activeEditorContext.reset();
                this.activeEditorIsReadonly.reset();
                this.activeCompareEditorCanSwap.reset();
                this.activeEditorCanToggleReadonly.reset();
                this.activeEditorCanRevert.reset();
                this.activeEditorCanSplitInGroup.reset();
                this.activeEditorAvailableEditorIds.reset();
            }
        }
        updateEditorGroupContextKeys() {
            const groupCount = this.editorGroupService.count;
            if (groupCount > 1) {
                this.multipleEditorGroupsContext.set(true);
            }
            else {
                this.multipleEditorGroupsContext.reset();
            }
            const activeGroup = this.editorGroupService.activeGroup;
            this.activeEditorGroupIndex.set(activeGroup.index + 1); // not zero-indexed
            this.activeEditorGroupLast.set(activeGroup.index === groupCount - 1);
            this.activeEditorGroupLocked.set(activeGroup.isLocked);
        }
        updateInputContextKeys(ownerDocument) {
            function activeElementIsInput() {
                return !!ownerDocument.activeElement && (ownerDocument.activeElement.tagName === 'INPUT' || ownerDocument.activeElement.tagName === 'TEXTAREA');
            }
            const isInputFocused = activeElementIsInput();
            this.inputFocusedContext.set(isInputFocused);
            if (isInputFocused) {
                const tracker = (0, dom_1.trackFocus)(ownerDocument.activeElement);
                event_1.Event.once(tracker.onDidBlur)(() => {
                    // Ensure we are only updating the context key if we are
                    // still in the same document that we are tracking. This
                    // fixes a race condition in multi-window setups where
                    // the blur event arrives in the inactive window overwriting
                    // the context key of the active window. This is because
                    // blur events from the focus tracker are emitted with a
                    // timeout of 0.
                    if ((0, dom_1.getActiveWindow)().document === ownerDocument) {
                        this.inputFocusedContext.set(activeElementIsInput());
                    }
                    tracker.dispose();
                });
            }
        }
        updateWorkbenchStateContextKey() {
            this.workbenchStateContext.set(this.getWorkbenchStateString());
        }
        updateWorkspaceFolderCountContextKey() {
            this.workspaceFolderCountContext.set(this.contextService.getWorkspace().folders.length);
        }
        updateSplitEditorsVerticallyContext() {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this.configurationService);
            this.splitEditorsVerticallyContext.set(direction === 1 /* GroupDirection.DOWN */);
        }
        getWorkbenchStateString() {
            switch (this.contextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: return 'empty';
                case 2 /* WorkbenchState.FOLDER */: return 'folder';
                case 3 /* WorkbenchState.WORKSPACE */: return 'workspace';
            }
        }
        updateSideBarContextKeys() {
            this.sideBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */));
        }
        updateTitleBarContextKeys() {
            this.titleAreaVisibleContext.set(this.layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_2.mainWindow));
            this.titleBarStyleContext.set((0, window_1.getTitleBarStyle)(this.configurationService));
        }
        updateWorkspaceContextKeys() {
            this.virtualWorkspaceContext.set((0, virtualWorkspace_1.getVirtualWorkspaceScheme)(this.contextService.getWorkspace()) || '');
            this.temporaryWorkspaceContext.set((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()));
        }
    };
    exports.WorkbenchContextKeysHandler = WorkbenchContextKeysHandler;
    exports.WorkbenchContextKeysHandler = WorkbenchContextKeysHandler = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, productService_1.IProductService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorResolverService_1.IEditorResolverService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, panecomposite_1.IPaneCompositePartService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, files_1.IFileService)
    ], WorkbenchContextKeysHandler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dGtleXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2NvbnRleHRrZXlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThCekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtRQXFEMUQsWUFDc0MsaUJBQXFDLEVBQy9CLGNBQXdDLEVBQzNDLG9CQUEyQyxFQUNwQyxrQkFBZ0QsRUFDN0QsY0FBK0IsRUFDaEMsYUFBNkIsRUFDckIscUJBQTZDLEVBQy9DLGtCQUF3QyxFQUNyQyxhQUFzQyxFQUNwQyxvQkFBK0MsRUFDckQsa0JBQXVDLEVBQzlDLFdBQXlCO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBYjZCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUM3RCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDaEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3JCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUNyQyxrQkFBYSxHQUFiLGFBQWEsQ0FBeUI7WUFDcEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUEyQjtZQUNyRCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBSXhELFdBQVc7WUFDWCwwQkFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUM1Qyw0QkFBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMs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