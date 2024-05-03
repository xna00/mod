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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/workbench/services/environment/browser/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/labels", "vs/platform/label/common/label", "vs/base/common/event", "vs/base/common/async", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/views/common/viewsService", "vs/editor/browser/editorBrowser", "vs/platform/contextkey/common/contextkey", "vs/base/browser/dom"], function (require, exports, nls_1, resources_1, configuration_1, editorService_1, lifecycle_1, editor_1, environmentService_1, workspace_1, platform_1, strings_1, labels_1, label_1, event_1, async_1, productService_1, network_1, virtualWorkspace_1, userDataProfile_1, viewsService_1, editorBrowser_1, contextkey_1, dom_1) {
    "use strict";
    var WindowTitle_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowTitle = exports.defaultWindowTitleSeparator = exports.defaultWindowTitle = void 0;
    var WindowSettingNames;
    (function (WindowSettingNames) {
        WindowSettingNames["titleSeparator"] = "window.titleSeparator";
        WindowSettingNames["title"] = "window.title";
    })(WindowSettingNames || (WindowSettingNames = {}));
    exports.defaultWindowTitle = (() => {
        if (platform_1.isMacintosh && platform_1.isNative) {
            return '${activeEditorShort}${separator}${rootName}${separator}${profileName}'; // macOS has native dirty indicator
        }
        const base = '${dirty}${activeEditorShort}${separator}${rootName}${separator}${profileName}${separator}${appName}';
        if (platform_1.isWeb) {
            return base + '${separator}${remoteName}'; // Web: always show remote name
        }
        return base;
    })();
    exports.defaultWindowTitleSeparator = platform_1.isMacintosh ? ' \u2014 ' : ' - ';
    let WindowTitle = class WindowTitle extends lifecycle_1.Disposable {
        static { WindowTitle_1 = this; }
        static { this.NLS_USER_IS_ADMIN = platform_1.isWindows ? (0, nls_1.localize)('userIsAdmin', "[Administrator]") : (0, nls_1.localize)('userIsSudo', "[Superuser]"); }
        static { this.NLS_EXTENSION_HOST = (0, nls_1.localize)('devExtensionWindowTitlePrefix', "[Extension Development Host]"); }
        static { this.TITLE_DIRTY = '\u25cf '; }
        get value() { return this.title ?? ''; }
        get workspaceName() { return this.labelService.getWorkspaceLabel(this.contextService.getWorkspace()); }
        get fileName() {
            const activeEditor = this.editorService.activeEditor;
            if (!activeEditor) {
                return undefined;
            }
            const fileName = activeEditor.getTitle(0 /* Verbosity.SHORT */);
            const dirty = activeEditor?.isDirty() && !activeEditor.isSaving() ? WindowTitle_1.TITLE_DIRTY : '';
            return `${dirty}${fileName}`;
        }
        constructor(targetWindow, editorGroupsContainer, configurationService, contextKeyService, editorService, environmentService, contextService, labelService, userDataProfileService, productService, viewsService) {
            super();
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.labelService = labelService;
            this.userDataProfileService = userDataProfileService;
            this.productService = productService;
            this.viewsService = viewsService;
            this.properties = { isPure: true, isAdmin: false, prefix: undefined };
            this.variables = new Map();
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.titleUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateTitle(), 0));
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.titleIncludesFocusedView = false;
            this.editorService = editorService.createScoped(editorGroupsContainer, this._store);
            this.windowId = targetWindow.vscodeWindowId;
            this.updateTitleIncludesFocusedView();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChanged(e)));
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChange()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.titleUpdater.schedule()));
            this._register(this.contextService.onDidChangeWorkspaceName(() => this.titleUpdater.schedule()));
            this._register(this.labelService.onDidChangeFormatters(() => this.titleUpdater.schedule()));
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(() => this.titleUpdater.schedule()));
            this._register(this.viewsService.onDidChangeFocusedView(() => {
                if (this.titleIncludesFocusedView) {
                    this.titleUpdater.schedule();
                }
            }));
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(this.variables)) {
                    this.titleUpdater.schedule();
                }
            }));
        }
        onConfigurationChanged(event) {
            if (event.affectsConfiguration("window.title" /* WindowSettingNames.title */)) {
                this.updateTitleIncludesFocusedView();
            }
            if (event.affectsConfiguration("window.title" /* WindowSettingNames.title */) || event.affectsConfiguration("window.titleSeparator" /* WindowSettingNames.titleSeparator */)) {
                this.titleUpdater.schedule();
            }
        }
        updateTitleIncludesFocusedView() {
            const titleTemplate = this.configurationService.getValue("window.title" /* WindowSettingNames.title */);
            this.titleIncludesFocusedView = typeof titleTemplate === 'string' && titleTemplate.includes('${focusedView}');
        }
        onActiveEditorChange() {
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Calculate New Window Title
            this.titleUpdater.schedule();
            // Apply listener for dirty and label changes
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                this.activeEditorListeners.add(activeEditor.onDidChangeDirty(() => this.titleUpdater.schedule()));
                this.activeEditorListeners.add(activeEditor.onDidChangeLabel(() => this.titleUpdater.schedule()));
            }
            // Apply listeners for tracking focused code editor
            if (this.titleIncludesFocusedView) {
                const activeTextEditorControl = this.editorService.activeTextEditorControl;
                const textEditorControls = [];
                if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                    textEditorControls.push(activeTextEditorControl);
                }
                else if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                    textEditorControls.push(activeTextEditorControl.getOriginalEditor(), activeTextEditorControl.getModifiedEditor());
                }
                for (const textEditorControl of textEditorControls) {
                    this.activeEditorListeners.add(textEditorControl.onDidBlurEditorText(() => this.titleUpdater.schedule()));
                    this.activeEditorListeners.add(textEditorControl.onDidFocusEditorText(() => this.titleUpdater.schedule()));
                }
            }
        }
        doUpdateTitle() {
            const title = this.getFullWindowTitle();
            if (title !== this.title) {
                // Always set the native window title to identify us properly to the OS
                let nativeTitle = title;
                if (!(0, strings_1.trim)(nativeTitle)) {
                    nativeTitle = this.productService.nameLong;
                }
                const window = (0, dom_1.getWindowById)(this.windowId, true).window;
                if (!window.document.title && platform_1.isMacintosh && nativeTitle === this.productService.nameLong) {
                    // TODO@electron macOS: if we set a window title for
                    // the first time and it matches the one we set in
                    // `windowImpl.ts` somehow the window does not appear
                    // in the "Windows" menu. As such, we set the title
                    // briefly to something different to ensure macOS
                    // recognizes we have a window.
                    // See: https://github.com/microsoft/vscode/issues/191288
                    window.document.title = `${this.productService.nameLong} ${WindowTitle_1.TITLE_DIRTY}`;
                }
                window.document.title = nativeTitle;
                this.title = title;
                this.onDidChangeEmitter.fire();
            }
        }
        getFullWindowTitle() {
            const { prefix, suffix } = this.getTitleDecorations();
            let title = this.getWindowTitle() || this.productService.nameLong;
            if (prefix) {
                title = `${prefix} ${title}`;
            }
            if (suffix) {
                title = `${title} ${suffix}`;
            }
            // Replace non-space whitespace
            return title.replace(/[^\S ]/g, ' ');
        }
        getTitleDecorations() {
            let prefix;
            let suffix;
            if (this.properties.prefix) {
                prefix = this.properties.prefix;
            }
            if (this.environmentService.isExtensionDevelopment) {
                prefix = !prefix
                    ? WindowTitle_1.NLS_EXTENSION_HOST
                    : `${WindowTitle_1.NLS_EXTENSION_HOST} - ${prefix}`;
            }
            if (this.properties.isAdmin) {
                suffix = WindowTitle_1.NLS_USER_IS_ADMIN;
            }
            return { prefix, suffix };
        }
        updateProperties(properties) {
            const isAdmin = typeof properties.isAdmin === 'boolean' ? properties.isAdmin : this.properties.isAdmin;
            const isPure = typeof properties.isPure === 'boolean' ? properties.isPure : this.properties.isPure;
            const prefix = typeof properties.prefix === 'string' ? properties.prefix : this.properties.prefix;
            if (isAdmin !== this.properties.isAdmin || isPure !== this.properties.isPure || prefix !== this.properties.prefix) {
                this.properties.isAdmin = isAdmin;
                this.properties.isPure = isPure;
                this.properties.prefix = prefix;
                this.titleUpdater.schedule();
            }
        }
        registerVariables(variables) {
            let changed = false;
            for (const { name, contextKey } of variables) {
                if (!this.variables.has(contextKey)) {
                    this.variables.set(contextKey, name);
                    changed = true;
                }
            }
            if (changed) {
                this.titleUpdater.schedule();
            }
        }
        /**
         * Possible template values:
         *
         * {activeEditorLong}: e.g. /Users/Development/myFolder/myFileFolder/myFile.txt
         * {activeEditorMedium}: e.g. myFolder/myFileFolder/myFile.txt
         * {activeEditorShort}: e.g. myFile.txt
         * {activeFolderLong}: e.g. /Users/Development/myFolder/myFileFolder
         * {activeFolderMedium}: e.g. myFolder/myFileFolder
         * {activeFolderShort}: e.g. myFileFolder
         * {rootName}: e.g. myFolder1, myFolder2, myFolder3
         * {rootPath}: e.g. /Users/Development
         * {folderName}: e.g. myFolder
         * {folderPath}: e.g. /Users/Development/myFolder
         * {appName}: e.g. VS Code
         * {remoteName}: e.g. SSH
         * {dirty}: indicator
         * {focusedView}: e.g. Terminal
         * {separator}: conditional separator
         */
        getWindowTitle() {
            const editor = this.editorService.activeEditor;
            const workspace = this.contextService.getWorkspace();
            // Compute root
            let root;
            if (workspace.configuration) {
                root = workspace.configuration;
            }
            else if (workspace.folders.length) {
                root = workspace.folders[0].uri;
            }
            // Compute active editor folder
            const editorResource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            let editorFolderResource = editorResource ? (0, resources_1.dirname)(editorResource) : undefined;
            if (editorFolderResource?.path === '.') {
                editorFolderResource = undefined;
            }
            // Compute folder resource
            // Single Root Workspace: always the root single workspace in this case
            // Otherwise: root folder of the currently active file if any
            let folder = undefined;
            if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                folder = workspace.folders[0];
            }
            else if (editorResource) {
                folder = this.contextService.getWorkspaceFolder(editorResource) ?? undefined;
            }
            // Compute remote
            // vscode-remtoe: use as is
            // otherwise figure out if we have a virtual folder opened
            let remoteName = undefined;
            if (this.environmentService.remoteAuthority && !platform_1.isWeb) {
                remoteName = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, this.environmentService.remoteAuthority);
            }
            else {
                const virtualWorkspaceLocation = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(workspace);
                if (virtualWorkspaceLocation) {
                    remoteName = this.labelService.getHostLabel(virtualWorkspaceLocation.scheme, virtualWorkspaceLocation.authority);
                }
            }
            // Variables
            const activeEditorShort = editor ? editor.getTitle(0 /* Verbosity.SHORT */) : '';
            const activeEditorMedium = editor ? editor.getTitle(1 /* Verbosity.MEDIUM */) : activeEditorShort;
            const activeEditorLong = editor ? editor.getTitle(2 /* Verbosity.LONG */) : activeEditorMedium;
            const activeFolderShort = editorFolderResource ? (0, resources_1.basename)(editorFolderResource) : '';
            const activeFolderMedium = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource, { relative: true }) : '';
            const activeFolderLong = editorFolderResource ? this.labelService.getUriLabel(editorFolderResource) : '';
            const rootName = this.labelService.getWorkspaceLabel(workspace);
            const rootNameShort = this.labelService.getWorkspaceLabel(workspace, { verbose: 0 /* LabelVerbosity.SHORT */ });
            const rootPath = root ? this.labelService.getUriLabel(root) : '';
            const folderName = folder ? folder.name : '';
            const folderPath = folder ? this.labelService.getUriLabel(folder.uri) : '';
            const dirty = editor?.isDirty() && !editor.isSaving() ? WindowTitle_1.TITLE_DIRTY : '';
            const appName = this.productService.nameLong;
            const profileName = this.userDataProfileService.currentProfile.isDefault ? '' : this.userDataProfileService.currentProfile.name;
            const focusedView = this.viewsService.getFocusedViewName();
            const variables = {};
            for (const [contextKey, name] of this.variables) {
                variables[name] = this.contextKeyService.getContextKeyValue(contextKey) ?? '';
            }
            let titleTemplate = this.configurationService.getValue("window.title" /* WindowSettingNames.title */);
            if (typeof titleTemplate !== 'string') {
                titleTemplate = exports.defaultWindowTitle;
            }
            let separator = this.configurationService.getValue("window.titleSeparator" /* WindowSettingNames.titleSeparator */);
            if (typeof separator !== 'string') {
                separator = exports.defaultWindowTitleSeparator;
            }
            return (0, labels_1.template)(titleTemplate, {
                ...variables,
                activeEditorShort,
                activeEditorLong,
                activeEditorMedium,
                activeFolderShort,
                activeFolderMedium,
                activeFolderLong,
                rootName,
                rootPath,
                rootNameShort,
                folderName,
                folderPath,
                dirty,
                appName,
                remoteName,
                profileName,
                focusedView,
                separator: { label: separator }
            });
        }
        isCustomTitleFormat() {
            const title = this.configurationService.inspect("window.title" /* WindowSettingNames.title */);
            const titleSeparator = this.configurationService.inspect("window.titleSeparator" /* WindowSettingNames.titleSeparator */);
            return title.value !== title.defaultValue || titleSeparator.value !== titleSeparator.defaultValue;
        }
    };
    exports.WindowTitle = WindowTitle;
    exports.WindowTitle = WindowTitle = WindowTitle_1 = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, editorService_1.IEditorService),
        __param(5, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, label_1.ILabelService),
        __param(8, userDataProfile_1.IUserDataProfileService),
        __param(9, productService_1.IProductService),
        __param(10, viewsService_1.IViewsService)
    ], WindowTitle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93VGl0bGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3RpdGxlYmFyL3dpbmRvd1RpdGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE2QmhHLElBQVcsa0JBR1Y7SUFIRCxXQUFXLGtCQUFrQjtRQUM1Qiw4REFBd0MsQ0FBQTtRQUN4Qyw0Q0FBc0IsQ0FBQTtJQUN2QixDQUFDLEVBSFUsa0JBQWtCLEtBQWxCLGtCQUFrQixRQUc1QjtJQUVZLFFBQUEsa0JBQWtCLEdBQUcsQ0FBQyxHQUFHLEVBQUU7UUFDdkMsSUFBSSxzQkFBVyxJQUFJLG1CQUFRLEVBQUUsQ0FBQztZQUM3QixPQUFPLHVFQUF1RSxDQUFDLENBQUMsbUNBQW1DO1FBQ3BILENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxxR0FBcUcsQ0FBQztRQUNuSCxJQUFJLGdCQUFLLEVBQUUsQ0FBQztZQUNYLE9BQU8sSUFBSSxHQUFHLDJCQUEyQixDQUFDLENBQUMsK0JBQStCO1FBQzNFLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDUSxRQUFBLDJCQUEyQixHQUFHLHNCQUFXLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBRXJFLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSxzQkFBVTs7aUJBRWxCLHNCQUFpQixHQUFHLG9CQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLEFBQWpHLENBQWtHO2lCQUNuSCx1QkFBa0IsR0FBRyxJQUFBLGNB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