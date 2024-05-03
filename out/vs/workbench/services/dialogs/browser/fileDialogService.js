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
define(["require", "exports", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/workbench/services/dialogs/browser/abstractFileDialogService", "vs/base/common/network", "vs/base/common/decorators", "vs/nls", "vs/base/common/mime", "vs/base/common/resources", "vs/base/browser/dom", "vs/base/common/severity", "vs/base/common/buffer", "vs/platform/dnd/browser/dnd", "vs/base/common/iterator", "vs/platform/files/browser/webFileSystemAccess", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget"], function (require, exports, dialogs_1, extensions_1, abstractFileDialogService_1, network_1, decorators_1, nls_1, mime_1, resources_1, dom_1, severity_1, buffer_1, dnd_1, iterator_1, webFileSystemAccess_1, embeddedCodeEditorWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDialogService = void 0;
    class FileDialogService extends abstractFileDialogService_1.AbstractFileDialogService {
        get fileSystemProvider() {
            return this.fileService.getProvider(network_1.Schemas.file);
        }
        async pickFileFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileFolderAndOpenSimplified(schema, options, false);
            }
            throw new Error((0, nls_1.localize)('pickFolderAndOpen', "Can't open folders, try adding a folder to the workspace instead."));
        }
        addFileSchemaIfNeeded(schema, isFolder) {
            return (schema === network_1.Schemas.untitled) ? [network_1.Schemas.file]
                : (((schema !== network_1.Schemas.file) && (!isFolder || (schema !== network_1.Schemas.vscodeRemote))) ? [schema, network_1.Schemas.file] : [schema]);
        }
        async pickFileAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileAndOpenSimplified(schema, options, false);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('open');
            }
            let fileHandle = undefined;
            try {
                ([fileHandle] = await activeWindow.showOpenFilePicker({ multiple: false }));
            }
            catch (error) {
                return; // `showOpenFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return;
            }
            const uri = await this.fileSystemProvider.registerFileHandle(fileHandle);
            this.addFileToRecentlyOpened(uri);
            await this.openerService.open(uri, { fromUserGesture: true, editorOptions: { pinned: true } });
        }
        async pickFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFolderPath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFolderAndOpenSimplified(schema, options);
            }
            throw new Error((0, nls_1.localize)('pickFolderAndOpen', "Can't open folders, try adding a folder to the workspace instead."));
        }
        async pickWorkspaceAndOpen(options) {
            options.availableFileSystems = this.getWorkspaceAvailableFileSystems(options);
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultWorkspacePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickWorkspaceAndOpenSimplified(schema, options);
            }
            throw new Error((0, nls_1.localize)('pickWorkspaceAndOpen', "Can't open workspaces, try adding a folder to the workspace instead."));
        }
        async pickFileToSave(defaultUri, availableFileSystems) {
            const schema = this.getFileSystemSchema({ defaultUri, availableFileSystems });
            const options = this.getPickFileToSaveDialogOptions(defaultUri, availableFileSystems);
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileToSaveSimplified(schema, options);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('save');
            }
            let fileHandle = undefined;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories);
            try {
                fileHandle = await activeWindow.showSaveFilePicker({ types: this.getFilePickerTypes(options.filters), ...{ suggestedName: (0, resources_1.basename)(defaultUri), startIn } });
            }
            catch (error) {
                return; // `showSaveFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return undefined;
            }
            return this.fileSystemProvider.registerFileHandle(fileHandle);
        }
        getFilePickerTypes(filters) {
            return filters?.filter(filter => {
                return !((filter.extensions.length === 1) && ((filter.extensions[0] === '*') || filter.extensions[0] === ''));
            }).map(filter => {
                const accept = {};
                const extensions = filter.extensions.filter(ext => (ext.indexOf('-') < 0) && (ext.indexOf('*') < 0) && (ext.indexOf('_') < 0));
                accept[(0, mime_1.getMediaOrTextMime)(`fileName.${filter.extensions[0]}`) ?? 'text/plain'] = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
                return {
                    description: filter.name,
                    accept
                };
            });
        }
        async showSaveDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema)) {
                return super.showSaveDialogSimplified(schema, options);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('save');
            }
            let fileHandle = undefined;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories);
            try {
                fileHandle = await activeWindow.showSaveFilePicker({ types: this.getFilePickerTypes(options.filters), ...options.defaultUri ? { suggestedName: (0, resources_1.basename)(options.defaultUri) } : undefined, ...{ startIn } });
            }
            catch (error) {
                return undefined; // `showSaveFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return undefined;
            }
            return this.fileSystemProvider.registerFileHandle(fileHandle);
        }
        async showOpenDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema)) {
                return super.showOpenDialogSimplified(schema, options);
            }
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                return this.showUnsupportedBrowserWarning('open');
            }
            let uri;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories) ?? 'documents';
            try {
                if (options.canSelectFiles) {
                    const handle = await activeWindow.showOpenFilePicker({ multiple: false, types: this.getFilePickerTypes(options.filters), ...{ startIn } });
                    if (handle.length === 1 && webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle[0])) {
                        uri = await this.fileSystemProvider.registerFileHandle(handle[0]);
                    }
                }
                else {
                    const handle = await activeWindow.showDirectoryPicker({ ...{ startIn } });
                    uri = await this.fileSystemProvider.registerDirectoryHandle(handle);
                }
            }
            catch (error) {
                // ignore - `showOpenFilePicker` / `showDirectoryPicker` will throw an error when the user cancels
            }
            return uri ? [uri] : undefined;
        }
        async showUnsupportedBrowserWarning(context) {
            // When saving, try to just download the contents
            // of the active text editor if any as a workaround
            if (context === 'save') {
                const activeCodeEditor = this.codeEditorService.getActiveCodeEditor();
                if (!(activeCodeEditor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget)) {
                    const activeTextModel = activeCodeEditor?.getModel();
                    if (activeTextModel) {
                        (0, dom_1.triggerDownload)(buffer_1.VSBuffer.fromString(activeTextModel.getValue()).buffer, (0, resources_1.basename)(activeTextModel.uri));
                        return;
                    }
                }
            }
            // Otherwise inform the user about options
            const buttons = [
                {
                    label: (0, nls_1.localize)({ key: 'openRemote', comment: ['&& denotes a mnemonic'] }, "&&Open Remote..."),
                    run: async () => { await this.commandService.executeCommand('workbench.action.remote.showMenu'); }
                },
                {
                    label: (0, nls_1.localize)({ key: 'learnMore', comment: ['&& denotes a mnemonic'] }, "&&Learn More"),
                    run: async () => { await this.openerService.open('https://aka.ms/VSCodeWebLocalFileSystemAccess'); }
                }
            ];
            if (context === 'open') {
                buttons.push({
                    label: (0, nls_1.localize)({ key: 'openFiles', comment: ['&& denotes a mnemonic'] }, "Open &&Files..."),
                    run: async () => {
                        const files = await (0, dom_1.triggerUpload)();
                        if (files) {
                            const filesData = (await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractFileListData)(accessor, files))).filter(fileData => !fileData.isDirectory);
                            if (filesData.length > 0) {
                                this.editorService.openEditors(filesData.map(fileData => {
                                    return {
                                        resource: fileData.resource,
                                        contents: fileData.contents?.toString(),
                                        options: { pinned: true }
                                    };
                                }));
                            }
                        }
                    }
                });
            }
            await this.dialogService.prompt({
                type: severity_1.default.Warning,
                message: (0, nls_1.localize)('unsupportedBrowserMessage', "Opening Local Folders is Unsupported"),
                detail: (0, nls_1.localize)('unsupportedBrowserDetail', "Your browser doesn't support opening local folders.\nYou can either open single files or open a remote repository."),
                buttons
            });
            return undefined;
        }
        shouldUseSimplified(scheme) {
            return ![network_1.Schemas.file, network_1.Schemas.vscodeUserData, network_1.Schemas.tmp].includes(scheme);
        }
    }
    exports.FileDialogService = FileDialogService;
    __decorate([
        decorators_1.memoize
    ], FileDialogService.prototype, "fileSystemProvider", null);
    (0, extensions_1.registerSingleton)(dialogs_1.IFileDialogService, FileDialogService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZURpYWxvZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9kaWFsb2dzL2Jyb3dzZXIvZmlsZURpYWxvZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBb0JoRyxNQUFhLGlCQUFrQixTQUFRLHFEQUF5QjtRQUcvRCxJQUFZLGtCQUFrQjtZQUM3QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFPLENBQUMsSUFBSSxDQUEyQixDQUFDO1FBQzdFLENBQUM7UUFFRCxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBNEI7WUFDdkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWpELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sQ0FBQyxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLG1FQUFtRSxDQUFDLENBQUMsQ0FBQztRQUNySCxDQUFDO1FBRWtCLHFCQUFxQixDQUFDLE1BQWMsRUFBRSxRQUFpQjtZQUN6RSxPQUFPLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FB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