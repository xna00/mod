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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/uri", "vs/workbench/services/host/browser/host", "vs/platform/workspace/common/workspace", "vs/platform/dnd/browser/dnd", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/platform", "vs/base/browser/dom", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/labels", "vs/base/common/stream", "vs/base/common/lifecycle", "vs/base/common/functional", "vs/base/common/arrays", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, nls_1, cancellation_1, dialogs_1, files_1, notification_1, progress_1, files_2, files_3, editorService_1, async_1, buffer_1, resources_1, bulkEditService_1, explorerModel_1, uri_1, host_1, workspace_1, dnd_1, workspaceEditing_1, platform_1, dom_1, log_1, network_1, labels_1, stream_1, lifecycle_1, functional_1, arrays_1, errors_1, configuration_1, webFileSystemAccess_1, instantiation_1, storage_1) {
    "use strict";
    var BrowserFileUpload_1, FileDownload_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDownload = exports.ExternalFileImport = exports.BrowserFileUpload = void 0;
    exports.getFileOverwriteConfirm = getFileOverwriteConfirm;
    exports.getMultipleFilesOverwriteConfirm = getMultipleFilesOverwriteConfirm;
    let BrowserFileUpload = class BrowserFileUpload {
        static { BrowserFileUpload_1 = this; }
        static { this.MAX_PARALLEL_UPLOADS = 20; }
        constructor(progressService, dialogService, explorerService, editorService, fileService) {
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.fileService = fileService;
        }
        upload(target, source) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const uploadPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: true,
                title: (0, nls_1.localize)('uploadingFiles', "Uploading")
            }, async (progress) => this.doUpload(target, this.toTransfer(source), progress, cts.token), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => uploadPromise);
            return uploadPromise;
        }
        toTransfer(source) {
            if ((0, dom_1.isDragEvent)(source)) {
                return source.dataTransfer;
            }
            const transfer = { items: [] };
            // We want to reuse the same code for uploading from
            // Drag & Drop as well as input element based upload
            // so we convert into webkit data transfer when the
            // input element approach is used (simplified).
            for (const file of source) {
                transfer.items.push({
                    webkitGetAsEntry: () => {
                        return {
                            name: file.name,
                            isDirectory: false,
                            isFile: true,
                            createReader: () => { throw new Error('Unsupported for files'); },
                            file: resolve => resolve(file)
                        };
                    }
                });
            }
            return transfer;
        }
        async doUpload(target, source, progress, token) {
            const items = source.items;
            // Somehow the items thing is being modified at random, maybe as a security
            // measure since this is a DND operation. As such, we copy the items into
            // an array we own as early as possible before using it.
            const entries = [];
            for (const item of items) {
                entries.push(item.webkitGetAsEntry());
            }
            const results = [];
            const operation = {
                startTime: Date.now(),
                progressScheduler: new async_1.RunOnceWorker(steps => { progress.report(steps[steps.length - 1]); }, 1000),
                filesTotal: entries.length,
                filesUploaded: 0,
                totalBytesUploaded: 0
            };
            // Upload all entries in parallel up to a
            // certain maximum leveraging the `Limiter`
            const uploadLimiter = new async_1.Limiter(BrowserFileUpload_1.MAX_PARALLEL_UPLOADS);
            await async_1.Promises.settled(entries.map(entry => {
                return uploadLimiter.queue(async () => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    // Confirm overwrite as needed
                    if (target && entry.name && target.getChild(entry.name)) {
                        const { confirmed } = await this.dialogService.confirm(getFileOverwriteConfirm(entry.name));
                        if (!confirmed) {
                            return;
                        }
                        await this.explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit((0, resources_1.joinPath)(target.resource, entry.name), undefined, { recursive: true, folder: target.getChild(entry.name)?.isDirectory })], {
                            undoLabel: (0, nls_1.localize)('overwrite', "Overwrite {0}", entry.name),
                            progressLabel: (0, nls_1.localize)('overwriting', "Overwriting {0}", entry.name),
                        });
                        if (token.isCancellationRequested) {
                            return;
                        }
                    }
                    // Upload entry
                    const result = await this.doUploadEntry(entry, target.resource, target, progress, operation, token);
                    if (result) {
                        results.push(result);
                    }
                });
            }));
            operation.progressScheduler.dispose();
            // Open uploaded file in editor only if we upload just one
            const firstUploadedFile = results[0];
            if (!token.isCancellationRequested && firstUploadedFile?.isFile) {
                await this.editorService.openEditor({ resource: firstUploadedFile.resource, options: { pinned: true } });
            }
        }
        async doUploadEntry(entry, parentResource, target, progress, operation, token) {
            if (token.isCancellationRequested || !entry.name || (!entry.isFile && !entry.isDirectory)) {
                return undefined;
            }
            // Report progress
            let fileBytesUploaded = 0;
            const reportProgress = (fileSize, bytesUploaded) => {
                fileBytesUploaded += bytesUploaded;
                operation.totalBytesUploaded += bytesUploaded;
                const bytesUploadedPerSecond = operation.totalBytesUploaded / ((Date.now() - operation.startTime) / 1000);
                // Small file
                let message;
                if (fileSize < files_1.ByteSize.MB) {
                    if (operation.filesTotal === 1) {
                        message = `${entry.name}`;
                    }
                    else {
                        message = (0, nls_1.localize)('uploadProgressSmallMany', "{0} of {1} files ({2}/s)", operation.filesUploaded, operation.filesTotal, files_1.ByteSize.formatSize(bytesUploadedPerSecond));
                    }
                }
                // Large file
                else {
                    message = (0, nls_1.localize)('uploadProgressLarge', "{0} ({1} of {2}, {3}/s)", entry.name, files_1.ByteSize.formatSize(fileBytesUploaded), files_1.ByteSize.formatSize(fileSize), files_1.ByteSize.formatSize(bytesUploadedPerSecond));
                }
                // Report progress but limit to update only once per second
                operation.progressScheduler.work({ message });
            };
            operation.filesUploaded++;
            reportProgress(0, 0);
            // Handle file upload
            const resource = (0, resources_1.joinPath)(parentResource, entry.name);
            if (entry.isFile) {
                const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Chrome/Edge/Firefox support stream method, but only use it for
                // larger files to reduce the overhead of the streaming approach
                if (typeof file.stream === 'function' && file.size > files_1.ByteSize.MB) {
                    await this.doUploadFileBuffered(resource, file, reportProgress, token);
                }
                // Fallback to unbuffered upload for other browsers or small files
                else {
                    await this.doUploadFileUnbuffered(resource, file, reportProgress);
                }
                return { isFile: true, resource };
            }
            // Handle folder upload
            else {
                // Create target folder
                await this.fileService.createFolder(resource);
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Recursive upload files in this directory
                const dirReader = entry.createReader();
                const childEntries = [];
                let done = false;
                do {
                    const childEntriesChunk = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
                    if (childEntriesChunk.length > 0) {
                        childEntries.push(...childEntriesChunk);
                    }
                    else {
                        done = true; // an empty array is a signal that all entries have been read
                    }
                } while (!done && !token.isCancellationRequested);
                // Update operation total based on new counts
                operation.filesTotal += childEntries.length;
                // Split up files from folders to upload
                const folderTarget = target && target.getChild(entry.name) || undefined;
                const fileChildEntries = [];
                const folderChildEntries = [];
                for (const childEntry of childEntries) {
                    if (childEntry.isFile) {
                        fileChildEntries.push(childEntry);
                    }
                    else if (childEntry.isDirectory) {
                        folderChildEntries.push(childEntry);
                    }
                }
                // Upload files (up to `MAX_PARALLEL_UPLOADS` in parallel)
                const fileUploadQueue = new async_1.Limiter(BrowserFileUpload_1.MAX_PARALLEL_UPLOADS);
                await async_1.Promises.settled(fileChildEntries.map(fileChildEntry => {
                    return fileUploadQueue.queue(() => this.doUploadEntry(fileChildEntry, resource, folderTarget, progress, operation, token));
                }));
                // Upload folders (sequentially give we don't know their sizes)
                for (const folderChildEntry of folderChildEntries) {
                    await this.doUploadEntry(folderChildEntry, resource, folderTarget, progress, operation, token);
                }
                return { isFile: false, resource };
            }
        }
        async doUploadFileBuffered(resource, file, progressReporter, token) {
            const writeableStream = (0, buffer_1.newWriteableBufferStream)({
                // Set a highWaterMark to prevent the stream
                // for file upload to produce large buffers
                // in-memory
                highWaterMark: 10
            });
            const writeFilePromise = this.fileService.writeFile(resource, writeableStream);
            // Read the file in chunks using File.stream() web APIs
            try {
                const reader = file.stream().getReader();
                let res = await reader.read();
                while (!res.done) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    // Write buffer into stream but make sure to wait
                    // in case the `highWaterMark` is reached
                    const buffer = buffer_1.VSBuffer.wrap(res.value);
                    await writeableStream.write(buffer);
                    if (token.isCancellationRequested) {
                        break;
                    }
                    // Report progress
                    progressReporter(file.size, buffer.byteLength);
                    res = await reader.read();
                }
                writeableStream.end(undefined);
            }
            catch (error) {
                writeableStream.error(error);
                writeableStream.end();
            }
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Wait for file being written to target
            await writeFilePromise;
        }
        doUploadFileUnbuffered(resource, file, progressReporter) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        if (event.target?.result instanceof ArrayBuffer) {
                            const buffer = buffer_1.VSBuffer.wrap(new Uint8Array(event.target.result));
                            await this.fileService.writeFile(resource, buffer);
                            // Report progress
                            progressReporter(file.size, buffer.byteLength);
                        }
                        else {
                            throw new Error('Could not read from dropped file.');
                        }
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                // Start reading the file to trigger `onload`
                reader.readAsArrayBuffer(file);
            });
        }
    };
    exports.BrowserFileUpload = BrowserFileUpload;
    exports.BrowserFileUpload = BrowserFileUpload = BrowserFileUpload_1 = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, dialogs_1.IDialogService),
        __param(2, files_2.IExplorerService),
        __param(3, editorService_1.IEditorService),
        __param(4, files_1.IFileService)
    ], BrowserFileUpload);
    //#endregion
    //#region External File Import (drag and drop)
    let ExternalFileImport = class ExternalFileImport {
        constructor(fileService, hostService, contextService, configurationService, dialogService, workspaceEditingService, explorerService, editorService, progressService, notificationService, instantiationService) {
            this.fileService = fileService;
            this.hostService = hostService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            this.workspaceEditingService = workspaceEditingService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
        }
        async import(target, source, targetWindow) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const importPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: true,
                title: (0, nls_1.localize)('copyingFiles', "Copying...")
            }, async () => await this.doImport(target, source, targetWindow, cts.token), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => importPromise);
            return importPromise;
        }
        async doImport(target, source, targetWindow, token) {
            // Activate all providers for the resources dropped
            const candidateFiles = (0, arrays_1.coalesce)((await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractEditorsAndFilesDropData)(accessor, source))).map(editor => editor.resource));
            await Promise.all(candidateFiles.map(resource => this.fileService.activateProvider(resource.scheme)));
            // Check for dropped external files to be folders
            const files = (0, arrays_1.coalesce)(candidateFiles.filter(resource => this.fileService.hasProvider(resource)));
            const resolvedFiles = await this.fileService.resolveAll(files.map(file => ({ resource: file })));
            if (token.isCancellationRequested) {
                return;
            }
            // Pass focus to window
            this.hostService.focus(targetWindow);
            // Handle folders by adding to workspace if we are in workspace context and if dropped on top
            const folders = resolvedFiles.filter(resolvedFile => resolvedFile.success && resolvedFile.stat?.isDirectory).map(resolvedFile => ({ uri: resolvedFile.stat.resource }));
            if (folders.length > 0 && target.isRoot) {
                let ImportChoice;
                (function (ImportChoice) {
                    ImportChoice[ImportChoice["Copy"] = 1] = "Copy";
                    ImportChoice[ImportChoice["Add"] = 2] = "Add";
                })(ImportChoice || (ImportChoice = {}));
                const buttons = [
                    {
                        label: folders.length > 1 ?
                            (0, nls_1.localize)('copyFolders', "&&Copy Folders") :
                            (0, nls_1.localize)('copyFolder', "&&Copy Folder"),
                        run: () => ImportChoice.Copy
                    }
                ];
                let message;
                // We only allow to add a folder to the workspace if there is already a workspace folder with that scheme
                const workspaceFolderSchemas = this.contextService.getWorkspace().folders.map(folder => folder.uri.scheme);
                if (folders.some(folder => workspaceFolderSchemas.indexOf(folder.uri.scheme) >= 0)) {
                    buttons.unshift({
                        label: folders.length > 1 ?
                            (0, nls_1.localize)('addFolders', "&&Add Folders to Workspace") :
                            (0, nls_1.localize)('addFolder', "&&Add Folder to Workspace"),
                        run: () => ImportChoice.Add
                    });
                    message = folders.length > 1 ?
                        (0, nls_1.localize)('dropFolders', "Do you want to copy the folders or add the folders to the workspace?") :
                        (0, nls_1.localize)('dropFolder', "Do you want to copy '{0}' or add '{0}' as a folder to the workspace?", (0, resources_1.basename)(folders[0].uri));
                }
                else {
                    message = folders.length > 1 ?
                        (0, nls_1.localize)('copyfolders', "Are you sure to want to copy folders?") :
                        (0, nls_1.localize)('copyfolder', "Are you sure to want to copy '{0}'?", (0, resources_1.basename)(folders[0].uri));
                }
                const { result } = await this.dialogService.prompt({
                    type: notification_1.Severity.Info,
                    message,
                    buttons,
                    cancelButton: true
                });
                // Add folders
                if (result === ImportChoice.Add) {
                    return this.workspaceEditingService.addFolders(folders);
                }
                // Copy resources
                if (result === ImportChoice.Copy) {
                    return this.importResources(target, files, token);
                }
            }
            // Handle dropped files (only support FileStat as target)
            else if (target instanceof explorerModel_1.ExplorerItem) {
                return this.importResources(target, files, token);
            }
        }
        async importResources(target, resources, token) {
            if (resources && resources.length > 0) {
                // Resolve target to check for name collisions and ask user
                const targetStat = await this.fileService.resolve(target.resource);
                if (token.isCancellationRequested) {
                    return;
                }
                // Check for name collisions
                const targetNames = new Set();
                const caseSensitive = this.fileService.hasCapability(target.resource, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
                if (targetStat.children) {
                    targetStat.children.forEach(child => {
                        targetNames.add(caseSensitive ? child.name : child.name.toLowerCase());
                    });
                }
                let inaccessibleFileCount = 0;
                const resourcesFiltered = (0, arrays_1.coalesce)((await async_1.Promises.settled(resources.map(async (resource) => {
                    const fileDoesNotExist = !(await this.fileService.exists(resource));
                    if (fileDoesNotExist) {
                        inaccessibleFileCount++;
                        return undefined;
                    }
                    if (targetNames.has(caseSensitive ? (0, resources_1.basename)(resource) : (0, resources_1.basename)(resource).toLowerCase())) {
                        const confirmationResult = await this.dialogService.confirm(getFileOverwriteConfirm((0, resources_1.basename)(resource)));
                        if (!confirmationResult.confirmed) {
                            return undefined;
                        }
                    }
                    return resource;
                }))));
                if (inaccessibleFileCount > 0) {
                    this.notificationService.error(inaccessibleFileCount > 1 ? (0, nls_1.localize)('filesInaccessible', "Some or all of the dropped files could not be accessed for import.") : (0, nls_1.localize)('fileInaccessible', "The dropped file could not be accessed for import."));
                }
                // Copy resources through bulk edit API
                const resourceFileEdits = resourcesFiltered.map(resource => {
                    const sourceFileName = (0, resources_1.basename)(resource);
                    const targetFile = (0, resources_1.joinPath)(target.resource, sourceFileName);
                    return new bulkEditService_1.ResourceFileEdit(resource, targetFile, { overwrite: true, copy: true });
                });
                const undoLevel = this.configurationService.getValue().explorer.confirmUndo;
                await this.explorerService.applyBulkEdit(resourceFileEdits, {
                    undoLabel: resourcesFiltered.length === 1 ?
                        (0, nls_1.localize)({ comment: ['substitution will be the name of the file that was imported'], key: 'importFile' }, "Import {0}", (0, resources_1.basename)(resourcesFiltered[0])) :
                        (0, nls_1.localize)({ comment: ['substitution will be the number of files that were imported'], key: 'importnFile' }, "Import {0} resources", resourcesFiltered.length),
                    progressLabel: resourcesFiltered.length === 1 ?
                        (0, nls_1.localize)({ comment: ['substitution will be the name of the file that was copied'], key: 'copyingFile' }, "Copying {0}", (0, resources_1.basename)(resourcesFiltered[0])) :
                        (0, nls_1.localize)({ comment: ['substitution will be the number of files that were copied'], key: 'copyingnFile' }, "Copying {0} resources", resourcesFiltered.length),
                    progressLocation: 10 /* ProgressLocation.Window */,
                    confirmBeforeUndo: undoLevel === "verbose" /* UndoConfirmLevel.Verbose */ || undoLevel === "default" /* UndoConfirmLevel.Default */,
                });
                // if we only add one file, just open it directly
                if (resourceFileEdits.length === 1) {
                    const item = this.explorerService.findClosest(resourceFileEdits[0].newResource);
                    if (item && !item.isDirectory) {
                        this.editorService.openEditor({ resource: item.resource, options: { pinned: true } });
                    }
                }
            }
        }
    };
    exports.ExternalFileImport = ExternalFileImport;
    exports.ExternalFileImport = ExternalFileImport = __decorate([
        __param(0, files_1.IFileService),
        __param(1, host_1.IHostService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, workspaceEditing_1.IWorkspaceEditingService),
        __param(6, files_2.IExplorerService),
        __param(7, editorService_1.IEditorService),
        __param(8, progress_1.IProgressService),
        __param(9, notification_1.INotificationService),
        __param(10, instantiation_1.IInstantiationService)
    ], ExternalFileImport);
    let FileDownload = class FileDownload {
        static { FileDownload_1 = this; }
        static { this.LAST_USED_DOWNLOAD_PATH_STORAGE_KEY = 'workbench.explorer.downloadPath'; }
        constructor(fileService, explorerService, progressService, logService, fileDialogService, storageService) {
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.progressService = progressService;
            this.logService = logService;
            this.fileDialogService = fileDialogService;
            this.storageService = storageService;
        }
        download(source) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const downloadPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: platform_1.isWeb,
                title: (0, nls_1.localize)('downloadingFiles', "Downloading")
            }, async (progress) => this.doDownload(source, progress, cts), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => downloadPromise);
            return downloadPromise;
        }
        async doDownload(sources, progress, cts) {
            for (const source of sources) {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Web: use DOM APIs to download files with optional support
                // for folders and large files
                if (platform_1.isWeb) {
                    await this.doDownloadBrowser(source.resource, progress, cts);
                }
                // Native: use working copy file service to get at the contents
                else {
                    await this.doDownloadNative(source, progress, cts);
                }
            }
        }
        async doDownloadBrowser(resource, progress, cts) {
            const stat = await this.fileService.resolve(resource, { resolveMetadata: true });
            if (cts.token.isCancellationRequested) {
                return;
            }
            const maxBlobDownloadSize = 32 * files_1.ByteSize.MB; // avoid to download via blob-trick >32MB to avoid memory pressure
            const preferFileSystemAccessWebApis = stat.isDirectory || stat.size > maxBlobDownloadSize;
            // Folder: use FS APIs to download files and folders if available and preferred
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (preferFileSystemAccessWebApis && webFileSystemAccess_1.WebFileSystemAccess.supported(activeWindow)) {
                try {
                    const parentFolder = await activeWindow.showDirectoryPicker();
                    const operation = {
                        startTime: Date.now(),
                        progressScheduler: new async_1.RunOnceWorker(steps => { progress.report(steps[steps.length - 1]); }, 1000),
                        filesTotal: stat.isDirectory ? 0 : 1, // folders increment filesTotal within downloadFolder method
                        filesDownloaded: 0,
                        totalBytesDownloaded: 0,
                        fileBytesDownloaded: 0
                    };
                    if (stat.isDirectory) {
                        const targetFolder = await parentFolder.getDirectoryHandle(stat.name, { create: true });
                        await this.downloadFolderBrowser(stat, targetFolder, operation, cts.token);
                    }
                    else {
                        await this.downloadFileBrowser(parentFolder, stat, operation, cts.token);
                    }
                    operation.progressScheduler.dispose();
                }
                catch (error) {
                    this.logService.warn(error);
                    cts.cancel(); // `showDirectoryPicker` will throw an error when the user cancels
                }
            }
            // File: use traditional download to circumvent browser limitations
            else if (stat.isFile) {
                let bufferOrUri;
                try {
                    bufferOrUri = (await this.fileService.readFile(stat.resource, { limits: { size: maxBlobDownloadSize } }, cts.token)).value.buffer;
                }
                catch (error) {
                    bufferOrUri = network_1.FileAccess.uriToBrowserUri(stat.resource);
                }
                if (!cts.token.isCancellationRequested) {
                    (0, dom_1.triggerDownload)(bufferOrUri, stat.name);
                }
            }
        }
        async downloadFileBufferedBrowser(resource, target, operation, token) {
            const contents = await this.fileService.readFileStream(resource, undefined, token);
            if (token.isCancellationRequested) {
                target.close();
                return;
            }
            return new Promise((resolve, reject) => {
                const sourceStream = contents.value;
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add((0, lifecycle_1.toDisposable)(() => target.close()));
                disposables.add((0, functional_1.createSingleCallFunction)(token.onCancellationRequested)(() => {
                    disposables.dispose();
                    reject((0, errors_1.canceled)());
                }));
                (0, stream_1.listenStream)(sourceStream, {
                    onData: data => {
                        target.write(data.buffer);
                        this.reportProgress(contents.name, contents.size, data.byteLength, operation);
                    },
                    onError: error => {
                        disposables.dispose();
                        reject(error);
                    },
                    onEnd: () => {
                        disposables.dispose();
                        resolve();
                    }
                }, token);
            });
        }
        async downloadFileUnbufferedBrowser(resource, target, operation, token) {
            const contents = await this.fileService.readFile(resource, undefined, token);
            if (!token.isCancellationRequested) {
                target.write(contents.value.buffer);
                this.reportProgress(contents.name, contents.size, contents.value.byteLength, operation);
            }
            target.close();
        }
        async downloadFileBrowser(targetFolder, file, operation, token) {
            // Report progress
            operation.filesDownloaded++;
            operation.fileBytesDownloaded = 0; // reset for this file
            this.reportProgress(file.name, 0, 0, operation);
            // Start to download
            const targetFile = await targetFolder.getFileHandle(file.name, { create: true });
            const targetFileWriter = await targetFile.createWritable();
            // For large files, write buffered using streams
            if (file.size > files_1.ByteSize.MB) {
                return this.downloadFileBufferedBrowser(file.resource, targetFileWriter, operation, token);
            }
            // For small files prefer to write unbuffered to reduce overhead
            return this.downloadFileUnbufferedBrowser(file.resource, targetFileWriter, operation, token);
        }
        async downloadFolderBrowser(folder, targetFolder, operation, token) {
            if (folder.children) {
                operation.filesTotal += (folder.children.map(child => child.isFile)).length;
                for (const child of folder.children) {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (child.isFile) {
                        await this.downloadFileBrowser(targetFolder, child, operation, token);
                    }
                    else {
                        const childFolder = await targetFolder.getDirectoryHandle(child.name, { create: true });
                        const resolvedChildFolder = await this.fileService.resolve(child.resource, { resolveMetadata: true });
                        await this.downloadFolderBrowser(resolvedChildFolder, childFolder, operation, token);
                    }
                }
            }
        }
        reportProgress(name, fileSize, bytesDownloaded, operation) {
            operation.fileBytesDownloaded += bytesDownloaded;
            operation.totalBytesDownloaded += bytesDownloaded;
            const bytesDownloadedPerSecond = operation.totalBytesDownloaded / ((Date.now() - operation.startTime) / 1000);
            // Small file
            let message;
            if (fileSize < files_1.ByteSize.MB) {
                if (operation.filesTotal === 1) {
                    message = name;
                }
                else {
                    message = (0, nls_1.localize)('downloadProgressSmallMany', "{0} of {1} files ({2}/s)", operation.filesDownloaded, operation.filesTotal, files_1.ByteSize.formatSize(bytesDownloadedPerSecond));
                }
            }
            // Large file
            else {
                message = (0, nls_1.localize)('downloadProgressLarge', "{0} ({1} of {2}, {3}/s)", name, files_1.ByteSize.formatSize(operation.fileBytesDownloaded), files_1.ByteSize.formatSize(fileSize), files_1.ByteSize.formatSize(bytesDownloadedPerSecond));
            }
            // Report progress but limit to update only once per second
            operation.progressScheduler.work({ message });
        }
        async doDownloadNative(explorerItem, progress, cts) {
            progress.report({ message: explorerItem.name });
            let defaultUri;
            const lastUsedDownloadPath = this.storageService.get(FileDownload_1.LAST_USED_DOWNLOAD_PATH_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            if (lastUsedDownloadPath) {
                defaultUri = (0, resources_1.joinPath)(uri_1.URI.file(lastUsedDownloadPath), explorerItem.name);
            }
            else {
                defaultUri = (0, resources_1.joinPath)(explorerItem.isDirectory ?
                    await this.fileDialogService.defaultFolderPath(network_1.Schemas.file) :
                    await this.fileDialogService.defaultFilePath(network_1.Schemas.file), explorerItem.name);
            }
            const destination = await this.fileDialogService.showSaveDialog({
                availableFileSystems: [network_1.Schemas.file],
                saveLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)('downloadButton', "Download")),
                title: (0, nls_1.localize)('chooseWhereToDownload', "Choose Where to Download"),
                defaultUri
            });
            if (destination) {
                // Remember as last used download folder
                this.storageService.store(FileDownload_1.LAST_USED_DOWNLOAD_PATH_STORAGE_KEY, (0, resources_1.dirname)(destination).fsPath, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                // Perform download
                await this.explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit(explorerItem.resource, destination, { overwrite: true, copy: true })], {
                    undoLabel: (0, nls_1.localize)('downloadBulkEdit', "Download {0}", explorerItem.name),
                    progressLabel: (0, nls_1.localize)('downloadingBulkEdit', "Downloading {0}", explorerItem.name),
                    progressLocation: 10 /* ProgressLocation.Window */
                });
            }
            else {
                cts.cancel(); // User canceled a download. In case there were multiple files selected we should cancel the remainder of the prompts #86100
            }
        }
    };
    exports.FileDownload = FileDownload;
    exports.FileDownload = FileDownload = FileDownload_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, files_2.IExplorerService),
        __param(2, progress_1.IProgressService),
        __param(3, log_1.ILogService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, storage_1.IStorageService)
    ], FileDownload);
    //#endregion
    //#region Helpers
    function getFileOverwriteConfirm(name) {
        return {
            message: (0, nls_1.localize)('confirmOverwrite', "A file or folder with the name '{0}' already exists in the destination folder. Do you want to replace it?", name),
            detail: (0, nls_1.localize)('irreversible', "This action is irreversible!"),
            primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
            type: 'warning'
        };
    }
    function getMultipleFilesOverwriteConfirm(files) {
        if (files.length > 1) {
            return {
                message: (0, nls_1.localize)('confirmManyOverwrites', "The following {0} files and/or folders already exist in the destination folder. Do you want to replace them?", files.length),
                detail: (0, dialogs_1.getFileNamesMessage)(files) + '\n' + (0, nls_1.localize)('irreversible', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                type: 'warning'
            };
        }
        return getFileOverwriteConfirm((0, resources_1.basename)(files[0]));
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUltcG9ydEV4cG9ydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci9maWxlSW1wb3J0RXhwb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvMUJoRywwREFPQztJQUVELDRFQVdDO0lBbnlCTSxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjs7aUJBRUwseUJBQW9CLEdBQUcsRUFBRSxBQUFMLENBQU07UUFFbEQsWUFDb0MsZUFBaUMsRUFDbkMsYUFBNkIsRUFDM0IsZUFBaUMsRUFDbkMsYUFBNkIsRUFDL0IsV0FBeUI7WUFKckIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDbkMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQy9CLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1FBRXpELENBQUM7UUFFRCxNQUFNLENBQUMsTUFBb0IsRUFBRSxNQUE0QjtZQUN4RCxNQUFNLEdBQUcsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFFMUMsNkJBQTZCO1lBQzdCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUN0RDtnQkFDQyxRQUFRLGtDQUF5QjtnQkFDakMsS0FBSyxFQUFFLEdBQUc7Z0JBQ1YsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUM7YUFDOUMsRUFDRCxLQUFLLEVBQUMsUUFBUSxFQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FB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