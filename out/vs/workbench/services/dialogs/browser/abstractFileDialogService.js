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
define(["require", "exports", "vs/nls", "vs/platform/window/common/window", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/base/common/path", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/dialogs/browser/simpleFileDialog", "vs/platform/workspaces/common/workspaces", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/workbench/services/host/browser/host", "vs/base/common/severity", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/languages/language", "vs/platform/label/common/label", "vs/workbench/services/path/common/pathService", "vs/base/common/network", "vs/editor/common/languages/modesRegistry", "vs/platform/commands/common/commands", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/editor/common/editorService", "vs/platform/editor/common/editor", "vs/platform/log/common/log"], function (require, exports, nls, window_1, dialogs_1, workspace_1, history_1, environmentService_1, resources, path_1, instantiation_1, simpleFileDialog_1, workspaces_1, configuration_1, files_1, opener_1, host_1, severity_1, arrays_1, strings_1, language_1, label_1, pathService_1, network_1, modesRegistry_1, commands_1, codeEditorService_1, editorService_1, editor_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractFileDialogService = void 0;
    let AbstractFileDialogService = class AbstractFileDialogService {
        constructor(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, dialogService, languageService, workspacesService, labelService, pathService, commandService, editorService, codeEditorService, logService) {
            this.hostService = hostService;
            this.contextService = contextService;
            this.historyService = historyService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.openerService = openerService;
            this.dialogService = dialogService;
            this.languageService = languageService;
            this.workspacesService = workspacesService;
            this.labelService = labelService;
            this.pathService = pathService;
            this.commandService = commandService;
            this.editorService = editorService;
            this.codeEditorService = codeEditorService;
            this.logService = logService;
        }
        async defaultFilePath(schemeFilter = this.getSchemeFilterForWindow(), authorityFilter = this.getAuthorityFilterForWindow()) {
            // Check for last active file first...
            let candidate = this.historyService.getLastActiveFile(schemeFilter, authorityFilter);
            // ...then for last active file root
            if (!candidate) {
                candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter, authorityFilter);
            }
            else {
                candidate = resources.dirname(candidate);
            }
            if (!candidate) {
                candidate = await this.preferredHome(schemeFilter);
            }
            return candidate;
        }
        async defaultFolderPath(schemeFilter = this.getSchemeFilterForWindow(), authorityFilter = this.getAuthorityFilterForWindow()) {
            // Check for last active file root first...
            let candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter, authorityFilter);
            // ...then for last active file
            if (!candidate) {
                candidate = this.historyService.getLastActiveFile(schemeFilter, authorityFilter);
            }
            if (!candidate) {
                return this.preferredHome(schemeFilter);
            }
            return resources.dirname(candidate);
        }
        async preferredHome(schemeFilter = this.getSchemeFilterForWindow()) {
            const preferLocal = schemeFilter === network_1.Schemas.file;
            const preferredHomeConfig = this.configurationService.inspect('files.dialog.defaultPath');
            const preferredHomeCandidate = preferLocal ? preferredHomeConfig.userLocalValue : preferredHomeConfig.userRemoteValue;
            if (preferredHomeCandidate) {
                const isPreferredHomeCandidateAbsolute = preferLocal ? (0, path_1.isAbsolute)(preferredHomeCandidate) : (await this.pathService.path).isAbsolute(preferredHomeCandidate);
                if (isPreferredHomeCandidateAbsolute) {
                    const preferredHomeNormalized = preferLocal ? (0, path_1.normalize)(preferredHomeCandidate) : (await this.pathService.path).normalize(preferredHomeCandidate);
                    const preferredHome = resources.toLocalResource(await this.pathService.fileURI(preferredHomeNormalized), this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
                    if (await this.fileService.exists(preferredHome)) {
                        return preferredHome;
                    }
                }
            }
            return this.pathService.userHome({ preferLocal });
        }
        async defaultWorkspacePath(schemeFilter = this.getSchemeFilterForWindow()) {
            let defaultWorkspacePath;
            // Check for current workspace config file first...
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const configuration = this.contextService.getWorkspace().configuration;
                if (configuration?.scheme === schemeFilter && (0, workspace_1.isSavedWorkspace)(configuration, this.environmentService) && !(0, workspace_1.isTemporaryWorkspace)(configuration)) {
                    defaultWorkspacePath = resources.dirname(configuration);
                }
            }
            // ...then fallback to default file path
            if (!defaultWorkspacePath) {
                defaultWorkspacePath = await this.defaultFilePath(schemeFilter);
            }
            return defaultWorkspacePath;
        }
        async showSaveConfirm(fileNamesOrResources) {
            if (this.skipDialogs()) {
                this.logService.trace('FileDialogService: refused to show save confirmation dialog in tests.');
                // no veto when we are in extension dev testing mode because we cannot assume we run interactive
                return 1 /* ConfirmResult.DONT_SAVE */;
            }
            return this.doShowSaveConfirm(fileNamesOrResources);
        }
        skipDialogs() {
            if (this.environmentService.isExtensionDevelopment && this.environmentService.extensionTestsLocationURI) {
                return true; // integration tests
            }
            return !!this.environmentService.enableSmokeTestDriver; // smoke tests
        }
        async doShowSaveConfirm(fileNamesOrResources) {
            if (fileNamesOrResources.length === 0) {
                return 1 /* ConfirmResult.DONT_SAVE */;
            }
            let message;
            let detail = nls.localize('saveChangesDetail', "Your changes will be lost if you don't save them.");
            if (fileNamesOrResources.length === 1) {
                message = nls.localize('saveChangesMessage', "Do you want to save the changes you made to {0}?", typeof fileNamesOrResources[0] === 'string' ? fileNamesOrResources[0] : resources.basename(fileNamesOrResources[0]));
            }
            else {
                message = nls.localize('saveChangesMessages', "Do you want to save the changes to the following {0} files?", fileNamesOrResources.length);
                detail = (0, dialogs_1.getFileNamesMessage)(fileNamesOrResources) + '\n' + detail;
            }
            const { result } = await this.dialogService.prompt({
                type: severity_1.default.Warning,
                message,
                detail,
                buttons: [
                    {
                        label: fileNamesOrResources.length > 1 ?
                            nls.localize({ key: 'saveAll', comment: ['&& denotes a mnemonic'] }, "&&Save All") :
                            nls.localize({ key: 'save', comment: ['&& denotes a mnemonic'] }, "&&Save"),
                        run: () => 0 /* ConfirmResult.SAVE */
                    },
                    {
                        label: nls.localize({ key: 'dontSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
                        run: () => 1 /* ConfirmResult.DONT_SAVE */
                    }
                ],
                cancelButton: {
                    run: () => 2 /* ConfirmResult.CANCEL */
                }
            });
            return result;
        }
        addFileSchemaIfNeeded(schema, _isFolder) {
            return schema === network_1.Schemas.untitled ? [network_1.Schemas.file] : (schema !== network_1.Schemas.file ? [schema, network_1.Schemas.file] : [schema]);
        }
        async pickFileFolderAndOpenSimplified(schema, options, preferNewWindow) {
            const title = nls.localize('openFileOrFolder.title', 'Open File or Folder');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                const stat = await this.fileService.stat(uri);
                const toOpen = stat.isDirectory ? { folderUri: uri } : { fileUri: uri };
                if (!(0, window_1.isWorkspaceToOpen)(toOpen) && (0, window_1.isFileToOpen)(toOpen)) {
                    this.addFileToRecentlyOpened(toOpen.fileUri);
                }
                if (stat.isDirectory || options.forceNewWindow || preferNewWindow) {
                    await this.hostService.openWindow([toOpen], { forceNewWindow: options.forceNewWindow, remoteAuthority: options.remoteAuthority });
                }
                else {
                    await this.editorService.openEditors([{ resource: uri, options: { source: editor_1.EditorOpenSource.USER, pinned: true } }], undefined, { validateTrust: true });
                }
            }
        }
        async pickFileAndOpenSimplified(schema, options, preferNewWindow) {
            const title = nls.localize('openFile.title', 'Open File');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                this.addFileToRecentlyOpened(uri);
                if (options.forceNewWindow || preferNewWindow) {
                    await this.hostService.openWindow([{ fileUri: uri }], { forceNewWindow: options.forceNewWindow, remoteAuthority: options.remoteAuthority });
                }
                else {
                    await this.editorService.openEditors([{ resource: uri, options: { source: editor_1.EditorOpenSource.USER, pinned: true } }], undefined, { validateTrust: true });
                }
            }
        }
        addFileToRecentlyOpened(uri) {
            this.workspacesService.addRecentlyOpened([{ fileUri: uri, label: this.labelService.getUriLabel(uri) }]);
        }
        async pickFolderAndOpenSimplified(schema, options) {
            const title = nls.localize('openFolder.title', 'Open Folder');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema, true);
            const uri = await this.pickResource({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                return this.hostService.openWindow([{ folderUri: uri }], { forceNewWindow: options.forceNewWindow, remoteAuthority: options.remoteAuthority });
            }
        }
        async pickWorkspaceAndOpenSimplified(schema, options) {
            const title = nls.localize('openWorkspace.title', 'Open Workspace from File');
            const filters = [{ name: nls.localize('filterName.workspace', 'Workspace'), extensions: [workspace_1.WORKSPACE_EXTENSION] }];
            const availableFileSystems = this.addFileSchemaIfNeeded(schema, true);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, filters, availableFileSystems });
            if (uri) {
                return this.hostService.openWindow([{ workspaceUri: uri }], { forceNewWindow: options.forceNewWindow, remoteAuthority: options.remoteAuthority });
            }
        }
        async pickFileToSaveSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            options.title = nls.localize('saveFileAs.title', 'Save As');
            const uri = await this.saveRemoteResource(options);
            if (uri) {
                this.addFileToRecentlyOpened(uri);
            }
            return uri;
        }
        async showSaveDialogSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            return this.saveRemoteResource(options);
        }
        async showOpenDialogSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema, options.canSelectFolders);
            }
            const uri = await this.pickResource(options);
            return uri ? [uri] : undefined;
        }
        getSimpleFileDialog() {
            return this.instantiationService.createInstance(simpleFileDialog_1.SimpleFileDialog);
        }
        pickResource(options) {
            return this.getSimpleFileDialog().showOpenDialog(options);
        }
        saveRemoteResource(options) {
            return this.getSimpleFileDialog().showSaveDialog(options);
        }
        getSchemeFilterForWindow(defaultUriScheme) {
            return defaultUriScheme ?? this.pathService.defaultUriScheme;
        }
        getAuthorityFilterForWindow() {
            return this.environmentService.remoteAuthority;
        }
        getFileSystemSchema(options) {
            return options.availableFileSystems && options.availableFileSystems[0] || this.getSchemeFilterForWindow(options.defaultUri?.scheme);
        }
        getWorkspaceAvailableFileSystems(options) {
            if (options.availableFileSystems && (options.availableFileSystems.length > 0)) {
                return options.availableFileSystems;
            }
            const availableFileSystems = [network_1.Schemas.file];
            if (this.environmentService.remoteAuthority) {
                availableFileSystems.unshift(network_1.Schemas.vscodeRemote);
            }
            return availableFileSystems;
        }
        getPickFileToSaveDialogOptions(defaultUri, availableFileSystems) {
            const options = {
                defaultUri,
                title: nls.localize('saveAsTitle', "Save As"),
                availableFileSystems
            };
            // Build the file filter by using our known languages
            const ext = defaultUri ? resources.extname(defaultUri) : undefined;
            let matchingFilter;
            const registeredLanguageNames = this.languageService.getSortedRegisteredLanguageNames();
            const registeredLanguageFilters = (0, arrays_1.coalesce)(registeredLanguageNames.map(({ languageName, languageId }) => {
                const extensions = this.languageService.getExtensions(languageId);
                if (!extensions.length) {
                    return null;
                }
                const filter = { name: languageName, extensions: (0, arrays_1.distinct)(extensions).slice(0, 10).map(e => (0, strings_1.trim)(e, '.')) };
                // https://github.com/microsoft/vscode/issues/115860
                const extOrPlaintext = ext || modesRegistry_1.PLAINTEXT_EXTENSION;
                if (!matchingFilter && extensions.includes(extOrPlaintext)) {
                    matchingFilter = filter;
                    // The selected extension must be in the set of extensions that are in the filter list that is sent to the save dialog.
                    // If it isn't, add it manually. https://github.com/microsoft/vscode/issues/147657
                    const trimmedExt = (0, strings_1.trim)(extOrPlaintext, '.');
                    if (!filter.extensions.includes(trimmedExt)) {
                        filter.extensions.unshift(trimmedExt);
                    }
                    return null; // first matching filter will be added to the top
                }
                return filter;
            }));
            // We have no matching filter, e.g. because the language
            // is unknown. We still add the extension to the list of
            // filters though so that it can be picked
            // (https://github.com/microsoft/vscode/issues/96283)
            if (!matchingFilter && ext) {
                matchingFilter = { name: (0, strings_1.trim)(ext, '.').toUpperCase(), extensions: [(0, strings_1.trim)(ext, '.')] };
            }
            // Order of filters is
            // - All Files (we MUST do this to fix macOS issue https://github.com/microsoft/vscode/issues/102713)
            // - File Extension Match (if any)
            // - All Languages
            // - No Extension
            options.filters = (0, arrays_1.coalesce)([
                { name: nls.localize('allFiles', "All Files"), extensions: ['*'] },
                matchingFilter,
                ...registeredLanguageFilters,
                { name: nls.localize('noExt', "No Extension"), extensions: [''] }
            ]);
            return options;
        }
    };
    exports.AbstractFileDialogService = AbstractFileDialogService;
    exports.AbstractFileDialogService = AbstractFileDialogService = __decorate([
        __param(0, host_1.IHostService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, history_1.IHistoryService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_1.IFileService),
        __param(7, opener_1.IOpenerService),
        __param(8, dialogs_1.IDialogService),
        __param(9, language_1.ILanguageService),
        __param(10, workspaces_1.IWorkspacesService),
        __param(11, label_1.ILabelService),
        __param(12, pathService_1.IPathService),
        __param(13, commands_1.ICommandService),
        __param(14, editorService_1.IEditorService),
        __param(15, codeEditorService_1.ICodeEditorService),
        __param(16, log_1.ILogService)
    ], AbstractFileDialogService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RGaWxlRGlhbG9nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2RpYWxvZ3MvYnJvd3Nlci9hYnN0cmFjdEZpbGVEaWFsb2dTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdDekYsSUFBZSx5QkFBeUIsR0FBeEMsTUFBZSx5QkFBeUI7UUFJOUMsWUFDa0MsV0FBeUIsRUFDYixjQUF3QyxFQUNqRCxjQUErQixFQUNsQixrQkFBZ0QsRUFDdkQsb0JBQTJDLEVBQzNDLG9CQUEyQyxFQUNwRCxXQUF5QixFQUN2QixhQUE2QixFQUM3QixhQUE2QixFQUM3QixlQUFpQyxFQUMvQixpQkFBcUMsRUFDMUMsWUFBMkIsRUFDNUIsV0FBeUIsRUFDcEIsY0FBK0IsRUFDaEMsYUFBNkIsRUFDekIsaUJBQXFDLEVBQzlDLFVBQXVCO1lBaEJwQixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNiLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUN2RCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdkIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzdCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM3QixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDL0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMxQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUM1QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNwQixtQkFBYyxHQUFkLGNB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