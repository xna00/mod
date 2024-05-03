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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/editor/browser/services/bulkEditService", "vs/platform/progress/common/progress", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/log/common/log", "vs/platform/environment/common/environment", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/api/browser/mainThreadBulkEdits", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/watcher", "vs/platform/workspace/common/workspace"], function (require, exports, lifecycle_1, files_1, extHostCustomers_1, extHost_protocol_1, nls_1, workingCopyFileService_1, bulkEditService_1, progress_1, async_1, cancellation_1, dialogs_1, severity_1, storage_1, actions_1, log_1, environment_1, uriIdentity_1, mainThreadBulkEdits_1, glob_1, strings_1, uri_1, configuration_1, watcher_1, workspace_1) {
    "use strict";
    var MainThreadFileSystemEventService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadFileSystemEventService = void 0;
    let MainThreadFileSystemEventService = class MainThreadFileSystemEventService {
        static { MainThreadFileSystemEventService_1 = this; }
        static { this.MementoKeyAdditionalEdits = `file.particpants.additionalEdits`; }
        constructor(extHostContext, _fileService, workingCopyFileService, bulkEditService, progressService, dialogService, storageService, logService, envService, uriIdentService, _contextService, _logService, _configurationService) {
            this._fileService = _fileService;
            this._contextService = _contextService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._listener = new lifecycle_1.DisposableStore();
            this._watches = new lifecycle_1.DisposableMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystemEventService);
            this._listener.add(_fileService.onDidFilesChange(event => {
                this._proxy.$onFileEvent({
                    created: event.rawAdded,
                    changed: event.rawUpdated,
                    deleted: event.rawDeleted
                });
            }));
            const that = this;
            const fileOperationParticipant = new class {
                async participate(files, operation, undoInfo, timeout, token) {
                    if (undoInfo?.isUndoing) {
                        return;
                    }
                    const cts = new cancellation_1.CancellationTokenSource(token);
                    const timer = setTimeout(() => cts.cancel(), timeout);
                    const data = await progressService.withProgress({
                        location: 15 /* ProgressLocation.Notification */,
                        title: this._progressLabel(operation),
                        cancellable: true,
                        delay: Math.min(timeout / 2, 3000)
                    }, () => {
                        // race extension host event delivery against timeout AND user-cancel
                        const onWillEvent = that._proxy.$onWillRunFileOperation(operation, files, timeout, cts.token);
                        return (0, async_1.raceCancellation)(onWillEvent, cts.token);
                    }, () => {
                        // user-cancel
                        cts.cancel();
                    }).finally(() => {
                        cts.dispose();
                        clearTimeout(timer);
                    });
                    if (!data || data.edit.edits.length === 0) {
                        // cancelled, no reply, or no edits
                        return;
                    }
                    const needsConfirmation = data.edit.edits.some(edit => edit.metadata?.needsConfirmation);
                    let showPreview = storageService.getBoolean(MainThreadFileSystemEventService_1.MementoKeyAdditionalEdits, 0 /* StorageScope.PROFILE */);
                    if (envService.extensionTestsLocationURI) {
                        // don't show dialog in tests
                        showPreview = false;
                    }
                    if (showPreview === undefined) {
                        // show a user facing message
                        let message;
                        if (data.extensionNames.length === 1) {
                            if (operation === 0 /* FileOperation.CREATE */) {
                                message = (0, nls_1.localize)('ask.1.create', "Extension '{0}' wants to make refactoring changes with this file creation", data.extensionNames[0]);
                            }
                            else if (operation === 3 /* FileOperation.COPY */) {
                                message = (0, nls_1.localize)('ask.1.copy', "Extension '{0}' wants to make refactoring changes with this file copy", data.extensionNames[0]);
                            }
                            else if (operation === 2 /* FileOperation.MOVE */) {
                                message = (0, nls_1.localize)('ask.1.move', "Extension '{0}' wants to make refactoring changes with this file move", data.extensionNames[0]);
                            }
                            else /* if (operation === FileOperation.DELETE) */ {
                                message = (0, nls_1.localize)('ask.1.delete', "Extension '{0}' wants to make refactoring changes with this file deletion", data.extensionNames[0]);
                            }
                        }
                        else {
                            if (operation === 0 /* FileOperation.CREATE */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.create', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file creation", data.extensionNames.length);
                            }
                            else if (operation === 3 /* FileOperation.COPY */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.copy', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file copy", data.extensionNames.length);
                            }
                            else if (operation === 2 /* FileOperation.MOVE */) {
                                message = (0, nls_1.localize)({ key: 'ask.N.move', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file move", data.extensionNames.length);
                            }
                            else /* if (operation === FileOperation.DELETE) */ {
                                message = (0, nls_1.localize)({ key: 'ask.N.delete', comment: ['{0} is a number, e.g "3 extensions want..."'] }, "{0} extensions want to make refactoring changes with this file deletion", data.extensionNames.length);
                            }
                        }
                        if (needsConfirmation) {
                            // edit which needs confirmation -> always show dialog
                            const { confirmed } = await dialogService.confirm({
                                type: severity_1.default.Info,
                                message,
                                primaryButton: (0, nls_1.localize)('preview', "Show &&Preview"),
                                cancelButton: (0, nls_1.localize)('cancel', "Skip Changes")
                            });
                            showPreview = true;
                            if (!confirmed) {
                                // no changes wanted
                                return;
                            }
                        }
                        else {
                            // choice
                            let Choice;
                            (function (Choice) {
                                Choice[Choice["OK"] = 0] = "OK";
                                Choice[Choice["Preview"] = 1] = "Preview";
                                Choice[Choice["Cancel"] = 2] = "Cancel";
                            })(Choice || (Choice = {}));
                            const { result, checkboxChecked } = await dialogService.prompt({
                                type: severity_1.default.Info,
                                message,
                                buttons: [
                                    {
                                        label: (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                                        run: () => Choice.OK
                                    },
                                    {
                                        label: (0, nls_1.localize)({ key: 'preview', comment: ['&& denotes a mnemonic'] }, "Show &&Preview"),
                                        run: () => Choice.Preview
                                    }
                                ],
                                cancelButton: {
                                    label: (0, nls_1.localize)('cancel', "Skip Changes"),
                                    run: () => Choice.Cancel
                                },
                                checkbox: { label: (0, nls_1.localize)('again', "Do not ask me again") }
                            });
                            if (result === Choice.Cancel) {
                                // no changes wanted, don't persist cancel option
                                return;
                            }
                            showPreview = result === Choice.Preview;
                            if (checkboxChecked) {
                                storageService.store(MainThreadFileSystemEventService_1.MementoKeyAdditionalEdits, showPreview, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                            }
                        }
                    }
                    logService.info('[onWill-handler] applying additional workspace edit from extensions', data.extensionNames);
                    await bulkEditService.apply((0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(data.edit, uriIdentService), { undoRedoGroupId: undoInfo?.undoRedoGroupId, showPreview });
                }
                _progressLabel(operation) {
                    switch (operation) {
                        case 0 /* FileOperation.CREATE */:
                            return (0, nls_1.localize)('msg-create', "Running 'File Create' participants...");
                        case 2 /* FileOperation.MOVE */:
                            return (0, nls_1.localize)('msg-rename', "Running 'File Rename' participants...");
                        case 3 /* FileOperation.COPY */:
                            return (0, nls_1.localize)('msg-copy', "Running 'File Copy' participants...");
                        case 1 /* FileOperation.DELETE */:
                            return (0, nls_1.localize)('msg-delete', "Running 'File Delete' participants...");
                        case 4 /* FileOperation.WRITE */:
                            return (0, nls_1.localize)('msg-write', "Running 'File Write' participants...");
                    }
                }
            };
            // BEFORE file operation
            this._listener.add(workingCopyFileService.addFileOperationParticipant(fileOperationParticipant));
            // AFTER file operation
            this._listener.add(workingCopyFileService.onDidRunWorkingCopyFileOperation(e => this._proxy.$onDidRunFileOperation(e.operation, e.files)));
        }
        async $watch(extensionId, session, resource, unvalidatedOpts, correlate) {
            const uri = uri_1.URI.revive(resource);
            const opts = {
                ...unvalidatedOpts
            };
            // Convert a recursive watcher to a flat watcher if the path
            // turns out to not be a folder. Recursive watching is only
            // possible on folders, so we help all file watchers by checking
            // early.
            if (opts.recursive) {
                try {
                    const stat = await this._fileService.stat(uri);
                    if (!stat.isDirectory) {
                        opts.recursive = false;
                    }
                }
                catch (error) {
                    // ignore
                }
            }
            // Correlated file watching is taken as is
            if (correlate) {
                this._logService.trace(`MainThreadFileSystemEventService#$watch(): request to start watching correlated (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                const watcherDisposables = new lifecycle_1.DisposableStore();
                const subscription = watcherDisposables.add(this._fileService.createWatcher(uri, opts));
                watcherDisposables.add(subscription.onDidChange(event => {
                    this._proxy.$onFileEvent({
                        session,
                        created: event.rawAdded,
                        changed: event.rawUpdated,
                        deleted: event.rawDeleted
                    });
                }));
                this._watches.set(session, watcherDisposables);
            }
            // Uncorrelated file watching gets special treatment
            else {
                this._logService.trace(`MainThreadFileSystemEventService#$watch(): request to start watching uncorrelated (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                const workspaceFolder = this._contextService.getWorkspaceFolder(uri);
                // Automatically add `files.watcherExclude` patterns when watching
                // recursively to give users a chance to configure exclude rules
                // for reducing the overhead of watching recursively
                if (opts.recursive && opts.excludes.length === 0) {
                    const config = this._configurationService.getValue();
                    if (config.files?.watcherExclude) {
                        for (const key in config.files.watcherExclude) {
                            if (key && config.files.watcherExclude[key] === true) {
                                opts.excludes.push(key);
                            }
                        }
                    }
                }
                // Non-recursive watching inside the workspace will overlap with
                // our standard workspace watchers. To prevent duplicate events,
                // we only want to include events for files that are otherwise
                // excluded via `files.watcherExclude`. As such, we configure
                // to include each configured exclude pattern so that only those
                // events are reported that are otherwise excluded.
                // However, we cannot just use the pattern as is, because a pattern
                // such as `bar` for a exclude, will work to exclude any of
                // `<workspace path>/bar` but will not work as include for files within
                // `bar` unless a suffix of `/**` if added.
                // (https://github.com/microsoft/vscode/issues/148245)
                else if (!opts.recursive && workspaceFolder) {
                    const config = this._configurationService.getValue();
                    if (config.files?.watcherExclude) {
                        for (const key in config.files.watcherExclude) {
                            if (key && config.files.watcherExclude[key] === true) {
                                if (!opts.includes) {
                                    opts.includes = [];
                                }
                                const includePattern = `${(0, strings_1.rtrim)(key, '/')}/${glob_1.GLOBSTAR}`;
                                opts.includes.push((0, watcher_1.normalizeWatcherPattern)(workspaceFolder.uri.fsPath, includePattern));
                            }
                        }
                    }
                    // Still ignore watch request if there are actually no configured
                    // exclude rules, because in that case our default recursive watcher
                    // should be able to take care of all events.
                    if (!opts.includes || opts.includes.length === 0) {
                        this._logService.trace(`MainThreadFileSystemEventService#$watch(): ignoring request to start watching because path is inside workspace and no excludes are configured (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                        return;
                    }
                }
                const subscription = this._fileService.watch(uri, opts);
                this._watches.set(session, subscription);
            }
        }
        $unwatch(session) {
            if (this._watches.has(session)) {
                this._logService.trace(`MainThreadFileSystemEventService#$unwatch(): request to stop watching (session: ${session})`);
                this._watches.deleteAndDispose(session);
            }
        }
        dispose() {
            this._listener.dispose();
            this._watches.dispose();
        }
    };
    exports.MainThreadFileSystemEventService = MainThreadFileSystemEventService;
    exports.MainThreadFileSystemEventService = MainThreadFileSystemEventService = MainThreadFileSystemEventService_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadFileSystemEventService),
        __param(1, files_1.IFileService),
        __param(2, workingCopyFileService_1.IWorkingCopyFileService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, progress_1.IProgressService),
        __param(5, dialogs_1.IDialogService),
        __param(6, storage_1.IStorageService),
        __param(7, log_1.ILogService),
        __param(8, environment_1.IEnvironmentService),
        __param(9, uriIdentity_1.IUriIdentityService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, log_1.ILogService),
        __param(12, configuration_1.IConfigurationService)
    ], MainThreadFileSystemEventService);
    (0, actions_1.registerAction2)(class ResetMemento extends actions_1.Action2 {
        constructor() {
            super({
                id: 'files.participants.resetChoice',
                title: {
                    value: (0, nls_1.localize)('label', "Reset choice for 'File operation needs preview'"),
                    original: `Reset choice for 'File operation needs preview'`
                },
                f1: true
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove(MainThreadFileSystemEventService.MementoKeyAdditionalEdits, 0 /* StorageScope.PROFILE */);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEZpbGVTeXN0ZW1FdmVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRmlsZVN5c3RlbUV2ZW50U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNkJ6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFnQzs7aUJBRTVCLDhCQUF5QixHQUFHLGtDQUFrQyxBQUFyQyxDQUFzQztRQU8vRSxZQUNDLGNBQStCLEVBQ2pCLFlBQTJDLEVBQ2hDLHNCQUErQyxFQUN0RCxlQUFpQyxFQUNqQyxlQUFpQyxFQUNuQyxhQUE2QixFQUM1QixjQUErQixFQUNuQyxVQUF1QixFQUNmLFVBQStCLEVBQy9CLGVBQW9DLEVBQy9CLGVBQTBELEVBQ3ZFLFdBQXlDLEVBQy9CLHFCQUE2RDtZQVhyRCxpQkFBWSxHQUFaLFlBQVksQ0FBYztZQVNkLG9CQUFlLEdBQWYsZUFBZSxDQUEwQjtZQUN0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNkLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFoQnBFLGNBQVMsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNsQyxhQUFRLEdBQUcsSUFBSSx5QkFBYSxFQUFVLENBQUM7WUFpQnZELElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFFcEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQztvQkFDeEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxRQUFRO29C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