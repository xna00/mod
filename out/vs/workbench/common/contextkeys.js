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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/editor/common/languages/language", "vs/platform/files/common/files", "vs/editor/common/services/model", "vs/base/common/network", "vs/workbench/common/editor", "vs/base/common/platform"], function (require, exports, lifecycle_1, nls_1, contextkey_1, resources_1, language_1, files_1, model_1, network_1, editor_1, platform_1) {
    "use strict";
    var ResourceContextKey_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceContextKey = exports.FocusedViewContext = exports.PanelMaximizedContext = exports.PanelVisibleContext = exports.PanelAlignmentContext = exports.PanelPositionContext = exports.PanelFocusContext = exports.ActivePanelContext = exports.AuxiliaryBarVisibleContext = exports.AuxiliaryBarFocusContext = exports.ActiveAuxiliaryContext = exports.NotificationsToastsVisibleContext = exports.NotificationsCenterVisibleContext = exports.NotificationFocusedContext = exports.BannerFocused = exports.TitleBarVisibleContext = exports.TitleBarStyleContext = exports.StatusBarFocused = exports.ActiveViewletContext = exports.SidebarFocusContext = exports.SideBarVisibleContext = exports.EditorTabsVisibleContext = exports.MainEditorAreaVisibleContext = exports.SplitEditorsVertically = exports.IsMainEditorCenteredLayoutContext = exports.InEditorZenModeContext = exports.EditorsVisibleContext = exports.IsAuxiliaryEditorPartContext = exports.EditorPartMaximizedEditorGroupContext = exports.EditorPartSingleEditorGroupsContext = exports.EditorPartMultipleEditorGroupsContext = exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext = exports.ActiveEditorGroupLockedContext = exports.ActiveEditorGroupLastContext = exports.ActiveEditorGroupIndexContext = exports.ActiveEditorGroupEmptyContext = exports.EditorGroupEditorsCountContext = exports.SideBySideEditorActiveContext = exports.TextCompareEditorActiveContext = exports.TextCompareEditorVisibleContext = exports.ActiveEditorAvailableEditorIdsContext = exports.ActiveEditorContext = exports.ActiveEditorCanSplitInGroupContext = exports.ActiveEditorCanRevertContext = exports.ActiveEditorCanToggleReadonlyContext = exports.ActiveCompareEditorCanSwapContext = exports.ActiveEditorReadonlyContext = exports.ActiveEditorStickyContext = exports.ActiveEditorLastInGroupContext = exports.ActiveEditorFirstInGroupContext = exports.ActiveEditorPinnedContext = exports.ActiveEditorDirtyContext = exports.EmbedderIdentifierContext = exports.HasWebFileSystemAccess = exports.IsAuxiliaryWindowFocusedContext = exports.IsMainWindowFullscreenContext = exports.TemporaryWorkspaceContext = exports.VirtualWorkspaceContext = exports.RemoteNameContext = exports.DirtyWorkingCopiesContext = exports.EmptyWorkspaceSupportContext = exports.EnterMultiRootWorkspaceSupportContext = exports.OpenFolderWorkspaceSupportContext = exports.WorkspaceFolderCountContext = exports.WorkbenchStateContext = void 0;
    exports.getVisbileViewContextKey = getVisbileViewContextKey;
    exports.applyAvailableEditorIds = applyAvailableEditorIds;
    //#region < --- Workbench --- >
    exports.WorkbenchStateContext = new contextkey_1.RawContextKey('workbenchState', undefined, { type: 'string', description: (0, nls_1.localize)('workbenchState', "The kind of workspace opened in the window, either 'empty' (no workspace), 'folder' (single folder) or 'workspace' (multi-root workspace)") });
    exports.WorkspaceFolderCountContext = new contextkey_1.RawContextKey('workspaceFolderCount', 0, (0, nls_1.localize)('workspaceFolderCount', "The number of root folders in the workspace"));
    exports.OpenFolderWorkspaceSupportContext = new contextkey_1.RawContextKey('openFolderWorkspaceSupport', true, true);
    exports.EnterMultiRootWorkspaceSupportContext = new contextkey_1.RawContextKey('enterMultiRootWorkspaceSupport', true, true);
    exports.EmptyWorkspaceSupportContext = new contextkey_1.RawContextKey('emptyWorkspaceSupport', true, true);
    exports.DirtyWorkingCopiesContext = new contextkey_1.RawContextKey('dirtyWorkingCopies', false, (0, nls_1.localize)('dirtyWorkingCopies', "Whether there are any working copies with unsaved changes"));
    exports.RemoteNameContext = new contextkey_1.RawContextKey('remoteName', '', (0, nls_1.localize)('remoteName', "The name of the remote the window is connected to or an empty string if not connected to any remote"));
    exports.VirtualWorkspaceContext = new contextkey_1.RawContextKey('virtualWorkspace', '', (0, nls_1.localize)('virtualWorkspace', "The scheme of the current workspace is from a virtual file system or an empty string."));
    exports.TemporaryWorkspaceContext = new contextkey_1.RawContextKey('temporaryWorkspace', false, (0, nls_1.localize)('temporaryWorkspace', "The scheme of the current workspace is from a temporary file system."));
    exports.IsMainWindowFullscreenContext = new contextkey_1.RawContextKey('isFullscreen', false, (0, nls_1.localize)('isFullscreen', "Whether the main window is in fullscreen mode"));
    exports.IsAuxiliaryWindowFocusedContext = new contextkey_1.RawContextKey('isAuxiliaryWindowFocusedContext', false, (0, nls_1.localize)('isAuxiliaryWindowFocusedContext', "Whether an auxiliary window is focused"));
    exports.HasWebFileSystemAccess = new contextkey_1.RawContextKey('hasWebFileSystemAccess', false, true); // Support for FileSystemAccess web APIs (https://wicg.github.io/file-system-access)
    exports.EmbedderIdentifierContext = new contextkey_1.RawContextKey('embedderIdentifier', undefined, (0, nls_1.localize)('embedderIdentifier', 'The identifier of the embedder according to the product service, if one is defined'));
    //#endregion
    //#region < --- Editor --- >
    // Editor State Context Keys
    exports.ActiveEditorDirtyContext = new contextkey_1.RawContextKey('activeEditorIsDirty', false, (0, nls_1.localize)('activeEditorIsDirty', "Whether the active editor has unsaved changes"));
    exports.ActiveEditorPinnedContext = new contextkey_1.RawContextKey('activeEditorIsNotPreview', false, (0, nls_1.localize)('activeEditorIsNotPreview', "Whether the active editor is not in preview mode"));
    exports.ActiveEditorFirstInGroupContext = new contextkey_1.RawContextKey('activeEditorIsFirstInGroup', false, (0, nls_1.localize)('activeEditorIsFirstInGroup', "Whether the active editor is the first one in its group"));
    exports.ActiveEditorLastInGroupContext = new contextkey_1.RawContextKey('activeEditorIsLastInGroup', false, (0, nls_1.localize)('activeEditorIsLastInGroup', "Whether the active editor is the last one in its group"));
    exports.ActiveEditorStickyContext = new contextkey_1.RawContextKey('activeEditorIsPinned', false, (0, nls_1.localize)('activeEditorIsPinned', "Whether the active editor is pinned"));
    exports.ActiveEditorReadonlyContext = new contextkey_1.RawContextKey('activeEditorIsReadonly', false, (0, nls_1.localize)('activeEditorIsReadonly', "Whether the active editor is read-only"));
    exports.ActiveCompareEditorCanSwapContext = new contextkey_1.RawContextKey('activeCompareEditorCanSwap', false, (0, nls_1.localize)('activeCompareEditorCanSwap', "Whether the active compare editor can swap sides"));
    exports.ActiveEditorCanToggleReadonlyContext = new contextkey_1.RawContextKey('activeEditorCanToggleReadonly', true, (0, nls_1.localize)('activeEditorCanToggleReadonly', "Whether the active editor can toggle between being read-only or writeable"));
    exports.ActiveEditorCanRevertContext = new contextkey_1.RawContextKey('activeEditorCanRevert', false, (0, nls_1.localize)('activeEditorCanRevert', "Whether the active editor can revert"));
    exports.ActiveEditorCanSplitInGroupContext = new contextkey_1.RawContextKey('activeEditorCanSplitInGroup', true);
    // Editor Kind Context Keys
    exports.ActiveEditorContext = new contextkey_1.RawContextKey('activeEditor', null, { type: 'string', description: (0, nls_1.localize)('activeEditor', "The identifier of the active editor") });
    exports.ActiveEditorAvailableEditorIdsContext = new contextkey_1.RawContextKey('activeEditorAvailableEditorIds', '', (0, nls_1.localize)('activeEditorAvailableEditorIds', "The available editor identifiers that are usable for the active editor"));
    exports.TextCompareEditorVisibleContext = new contextkey_1.RawContextKey('textCompareEditorVisible', false, (0, nls_1.localize)('textCompareEditorVisible', "Whether a text compare editor is visible"));
    exports.TextCompareEditorActiveContext = new contextkey_1.RawContextKey('textCompareEditorActive', false, (0, nls_1.localize)('textCompareEditorActive', "Whether a text compare editor is active"));
    exports.SideBySideEditorActiveContext = new contextkey_1.RawContextKey('sideBySideEditorActive', false, (0, nls_1.localize)('sideBySideEditorActive', "Whether a side by side editor is active"));
    // Editor Group Context Keys
    exports.EditorGroupEditorsCountContext = new contextkey_1.RawContextKey('groupEditorsCount', 0, (0, nls_1.localize)('groupEditorsCount', "The number of opened editor groups"));
    exports.ActiveEditorGroupEmptyContext = new contextkey_1.RawContextKey('activeEditorGroupEmpty', false, (0, nls_1.localize)('activeEditorGroupEmpty', "Whether the active editor group is empty"));
    exports.ActiveEditorGroupIndexContext = new contextkey_1.RawContextKey('activeEditorGroupIndex', 0, (0, nls_1.localize)('activeEditorGroupIndex', "The index of the active editor group"));
    exports.ActiveEditorGroupLastContext = new contextkey_1.RawContextKey('activeEditorGroupLast', false, (0, nls_1.localize)('activeEditorGroupLast', "Whether the active editor group is the last group"));
    exports.ActiveEditorGroupLockedContext = new contextkey_1.RawContextKey('activeEditorGroupLocked', false, (0, nls_1.localize)('activeEditorGroupLocked', "Whether the active editor group is locked"));
    exports.MultipleEditorGroupsContext = new contextkey_1.RawContextKey('multipleEditorGroups', false, (0, nls_1.localize)('multipleEditorGroups', "Whether there are multiple editor groups opened"));
    exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext.toNegated();
    // Editor Part Context Keys
    exports.EditorPartMultipleEditorGroupsContext = new contextkey_1.RawContextKey('editorPartMultipleEditorGroups', false, (0, nls_1.localize)('editorPartMultipleEditorGroups', "Whether there are multiple editor groups opened in an editor part"));
    exports.EditorPartSingleEditorGroupsContext = exports.EditorPartMultipleEditorGroupsContext.toNegated();
    exports.EditorPartMaximizedEditorGroupContext = new contextkey_1.RawContextKey('editorPartMaximizedEditorGroup', false, (0, nls_1.localize)('editorPartEditorGroupMaximized', "Editor Part has a maximized group"));
    exports.IsAuxiliaryEditorPartContext = new contextkey_1.RawContextKey('isAuxiliaryEditorPart', false, (0, nls_1.localize)('isAuxiliaryEditorPart', "Editor Part is in an auxiliary window"));
    // Editor Layout Context Keys
    exports.EditorsVisibleContext = new contextkey_1.RawContextKey('editorIsOpen', false, (0, nls_1.localize)('editorIsOpen', "Whether an editor is open"));
    exports.InEditorZenModeContext = new contextkey_1.RawContextKey('inZenMode', false, (0, nls_1.localize)('inZenMode', "Whether Zen mode is enabled"));
    exports.IsMainEditorCenteredLayoutContext = new contextkey_1.RawContextKey('isCenteredLayout', false, (0, nls_1.localize)('isMainEditorCenteredLayout', "Whether centered layout is enabled for the main editor"));
    exports.SplitEditorsVertically = new contextkey_1.RawContextKey('splitEditorsVertically', false, (0, nls_1.localize)('splitEditorsVertically', "Whether editors split vertically"));
    exports.MainEditorAreaVisibleContext = new contextkey_1.RawContextKey('mainEditorAreaVisible', true, (0, nls_1.localize)('mainEditorAreaVisible', "Whether the editor area in the main window is visible"));
    exports.EditorTabsVisibleContext = new contextkey_1.RawContextKey('editorTabsVisible', true, (0, nls_1.localize)('editorTabsVisible', "Whether editor tabs are visible"));
    //#endregion
    //#region < --- Side Bar --- >
    exports.SideBarVisibleContext = new contextkey_1.RawContextKey('sideBarVisible', false, (0, nls_1.localize)('sideBarVisible', "Whether the sidebar is visible"));
    exports.SidebarFocusContext = new contextkey_1.RawContextKey('sideBarFocus', false, (0, nls_1.localize)('sideBarFocus', "Whether the sidebar has keyboard focus"));
    exports.ActiveViewletContext = new contextkey_1.RawContextKey('activeViewlet', '', (0, nls_1.localize)('activeViewlet', "The identifier of the active viewlet"));
    //#endregion
    //#region < --- Status Bar --- >
    exports.StatusBarFocused = new contextkey_1.RawContextKey('statusBarFocused', false, (0, nls_1.localize)('statusBarFocused', "Whether the status bar has keyboard focus"));
    //#endregion
    //#region < --- Title Bar --- >
    exports.TitleBarStyleContext = new contextkey_1.RawContextKey('titleBarStyle', platform_1.isLinux ? 'native' : 'custom', (0, nls_1.localize)('titleBarStyle', "Style of the window title bar"));
    exports.TitleBarVisibleContext = new contextkey_1.RawContextKey('titleBarVisible', false, (0, nls_1.localize)('titleBarVisible', "Whether the title bar is visible"));
    //#endregion
    //#region < --- Banner --- >
    exports.BannerFocused = new contextkey_1.RawContextKey('bannerFocused', false, (0, nls_1.localize)('bannerFocused', "Whether the banner has keyboard focus"));
    //#endregion
    //#region < --- Notifications --- >
    exports.NotificationFocusedContext = new contextkey_1.RawContextKey('notificationFocus', true, (0, nls_1.localize)('notificationFocus', "Whether a notification has keyboard focus"));
    exports.NotificationsCenterVisibleContext = new contextkey_1.RawContextKey('notificationCenterVisible', false, (0, nls_1.localize)('notificationCenterVisible', "Whether the notifications center is visible"));
    exports.NotificationsToastsVisibleContext = new contextkey_1.RawContextKey('notificationToastsVisible', false, (0, nls_1.localize)('notificationToastsVisible', "Whether a notification toast is visible"));
    //#endregion
    //#region < --- Auxiliary Bar --- >
    exports.ActiveAuxiliaryContext = new contextkey_1.RawContextKey('activeAuxiliary', '', (0, nls_1.localize)('activeAuxiliary', "The identifier of the active auxiliary panel"));
    exports.AuxiliaryBarFocusContext = new contextkey_1.RawContextKey('auxiliaryBarFocus', false, (0, nls_1.localize)('auxiliaryBarFocus', "Whether the auxiliary bar has keyboard focus"));
    exports.AuxiliaryBarVisibleContext = new contextkey_1.RawContextKey('auxiliaryBarVisible', false, (0, nls_1.localize)('auxiliaryBarVisible', "Whether the auxiliary bar is visible"));
    //#endregion
    //#region < --- Panel --- >
    exports.ActivePanelContext = new contextkey_1.RawContextKey('activePanel', '', (0, nls_1.localize)('activePanel', "The identifier of the active panel"));
    exports.PanelFocusContext = new contextkey_1.RawContextKey('panelFocus', false, (0, nls_1.localize)('panelFocus', "Whether the panel has keyboard focus"));
    exports.PanelPositionContext = new contextkey_1.RawContextKey('panelPosition', 'bottom', (0, nls_1.localize)('panelPosition', "The position of the panel, always 'bottom'"));
    exports.PanelAlignmentContext = new contextkey_1.RawContextKey('panelAlignment', 'center', (0, nls_1.localize)('panelAlignment', "The alignment of the panel, either 'center', 'left', 'right' or 'justify'"));
    exports.PanelVisibleContext = new contextkey_1.RawContextKey('panelVisible', false, (0, nls_1.localize)('panelVisible', "Whether the panel is visible"));
    exports.PanelMaximizedContext = new contextkey_1.RawContextKey('panelMaximized', false, (0, nls_1.localize)('panelMaximized', "Whether the panel is maximized"));
    //#endregion
    //#region < --- Views --- >
    exports.FocusedViewContext = new contextkey_1.RawContextKey('focusedView', '', (0, nls_1.localize)('focusedView', "The identifier of the view that has keyboard focus"));
    function getVisbileViewContextKey(viewId) { return `view.${viewId}.visible`; }
    //#endregion
    //#region < --- Resources --- >
    let ResourceContextKey = class ResourceContextKey {
        static { ResourceContextKey_1 = this; }
        // NOTE: DO NOT CHANGE THE DEFAULT VALUE TO ANYTHING BUT
        // UNDEFINED! IT IS IMPORTANT THAT DEFAULTS ARE INHERITED
        // FROM THE PARENT CONTEXT AND ONLY UNDEFINED DOES THIS
        static { this.Scheme = new contextkey_1.RawContextKey('resourceScheme', undefined, { type: 'string', description: (0, nls_1.localize)('resourceScheme', "The scheme of the resource") }); }
        static { this.Filename = new contextkey_1.RawContextKey('resourceFilename', undefined, { type: 'string', description: (0, nls_1.localize)('resourceFilename', "The file name of the resource") }); }
        static { this.Dirname = new contextkey_1.RawContextKey('resourceDirname', undefined, { type: 'string', description: (0, nls_1.localize)('resourceDirname', "The folder name the resource is contained in") }); }
        static { this.Path = new contextkey_1.RawContextKey('resourcePath', undefined, { type: 'string', description: (0, nls_1.localize)('resourcePath', "The full path of the resource") }); }
        static { this.LangId = new contextkey_1.RawContextKey('resourceLangId', undefined, { type: 'string', description: (0, nls_1.localize)('resourceLangId', "The language identifier of the resource") }); }
        static { this.Resource = new contextkey_1.RawContextKey('resource', undefined, { type: 'URI', description: (0, nls_1.localize)('resource', "The full value of the resource including scheme and path") }); }
        static { this.Extension = new contextkey_1.RawContextKey('resourceExtname', undefined, { type: 'string', description: (0, nls_1.localize)('resourceExtname', "The extension name of the resource") }); }
        static { this.HasResource = new contextkey_1.RawContextKey('resourceSet', undefined, { type: 'boolean', description: (0, nls_1.localize)('resourceSet', "Whether a resource is present or not") }); }
        static { this.IsFileSystemResource = new contextkey_1.RawContextKey('isFileSystemResource', undefined, { type: 'boolean', description: (0, nls_1.localize)('isFileSystemResource', "Whether the resource is backed by a file system provider") }); }
        constructor(_contextKeyService, _fileService, _languageService, _modelService) {
            this._contextKeyService = _contextKeyService;
            this._fileService = _fileService;
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._schemeKey = ResourceContextKey_1.Scheme.bindTo(this._contextKeyService);
            this._filenameKey = ResourceContextKey_1.Filename.bindTo(this._contextKeyService);
            this._dirnameKey = ResourceContextKey_1.Dirname.bindTo(this._contextKeyService);
            this._pathKey = ResourceContextKey_1.Path.bindTo(this._contextKeyService);
            this._langIdKey = ResourceContextKey_1.LangId.bindTo(this._contextKeyService);
            this._resourceKey = ResourceContextKey_1.Resource.bindTo(this._contextKeyService);
            this._extensionKey = ResourceContextKey_1.Extension.bindTo(this._contextKeyService);
            this._hasResource = ResourceContextKey_1.HasResource.bindTo(this._contextKeyService);
            this._isFileSystemResource = ResourceContextKey_1.IsFileSystemResource.bindTo(this._contextKeyService);
            this._disposables.add(_fileService.onDidChangeFileSystemProviderRegistrations(() => {
                const resource = this.get();
                this._isFileSystemResource.set(Boolean(resource && _fileService.hasProvider(resource)));
            }));
            this._disposables.add(_modelService.onModelAdded(model => {
                if ((0, resources_1.isEqual)(model.uri, this.get())) {
                    this._setLangId();
                }
            }));
            this._disposables.add(_modelService.onModelLanguageChanged(e => {
                if ((0, resources_1.isEqual)(e.model.uri, this.get())) {
                    this._setLangId();
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        _setLangId() {
            const value = this.get();
            if (!value) {
                this._langIdKey.set(null);
                return;
            }
            const langId = this._modelService.getModel(value)?.getLanguageId() ?? this._languageService.guessLanguageIdByFilepathOrFirstLine(value);
            this._langIdKey.set(langId);
        }
        set(value) {
            value = value ?? undefined;
            if ((0, resources_1.isEqual)(this._value, value)) {
                return;
            }
            this._value = value;
            this._contextKeyService.bufferChangeEvents(() => {
                this._resourceKey.set(value ? value.toString() : null);
                this._schemeKey.set(value ? value.scheme : null);
                this._filenameKey.set(value ? (0, resources_1.basename)(value) : null);
                this._dirnameKey.set(value ? this.uriToPath((0, resources_1.dirname)(value)) : null);
                this._pathKey.set(value ? this.uriToPath(value) : null);
                this._setLangId();
                this._extensionKey.set(value ? (0, resources_1.extname)(value) : null);
                this._hasResource.set(Boolean(value));
                this._isFileSystemResource.set(value ? this._fileService.hasProvider(value) : false);
            });
        }
        uriToPath(uri) {
            if (uri.scheme === network_1.Schemas.file) {
                return uri.fsPath;
            }
            return uri.path;
        }
        reset() {
            this._value = undefined;
            this._contextKeyService.bufferChangeEvents(() => {
                this._resourceKey.reset();
                this._schemeKey.reset();
                this._filenameKey.reset();
                this._dirnameKey.reset();
                this._pathKey.reset();
                this._langIdKey.reset();
                this._extensionKey.reset();
                this._hasResource.reset();
                this._isFileSystemResource.reset();
            });
        }
        get() {
            return this._value;
        }
    };
    exports.ResourceContextKey = ResourceContextKey;
    exports.ResourceContextKey = ResourceContextKey = ResourceContextKey_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, files_1.IFileService),
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService)
    ], ResourceContextKey);
    //#endregion
    function applyAvailableEditorIds(contextKey, editor, editorResolverService) {
        if (!editor) {
            contextKey.set('');
            return;
        }
        const editorResource = editor.resource;
        const editors = editorResource ? editorResolverService.getEditors(editorResource).map(editor => editor.id) : [];
        if (editorResource?.scheme === network_1.Schemas.untitled && editor.editorId !== editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
            // Non text editor untitled files cannot be easily serialized between extensions
            // so instead we disable this context key to prevent common commands that act on the active editor
            contextKey.set('');
        }
        else {
            contextKey.set(editors.join(','));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dGtleXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vY29udGV4dGtleXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXdKaEcsNERBQXFHO0lBb0lyRywwREFnQkM7SUE1UkQsK0JBQStCO0lBRWxCLFFBQUEscUJBQXFCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLDJJQUEySSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3pSLFFBQUEsMkJBQTJCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLHNCQUFzQixFQUFFLENBQUMsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSw2Q0FBNkMsQ0FBQyxDQUFDLENBQUM7SUFFcEssUUFBQSxpQ0FBaUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsNEJBQTRCLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pHLFFBQUEscUNBQXFDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGdDQUFnQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNqSCxRQUFBLDRCQUE0QixHQUFHLElBQUksMEJBQWEsQ0FBVSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFL0YsUUFBQSx5QkFBeUIsR0FBRyxJQUFJLDBCQUFhLENBQVUsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDJEQUEyRCxDQUFDLENBQUMsQ0FBQztJQUVqTCxRQUFBLGlCQUFpQixHQUFHLElBQUksMEJBQWEsQ0FBUyxZQUFZLEVBQUUsRUFB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