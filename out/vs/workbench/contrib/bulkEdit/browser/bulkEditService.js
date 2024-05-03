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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/map", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/bulkEdit/browser/bulkFileEdits", "vs/workbench/contrib/bulkEdit/browser/bulkTextEdits", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyService"], function (require, exports, cancellation_1, lifecycle_1, linkedList_1, map_1, editorBrowser_1, bulkEditService_1, nls_1, configuration_1, configurationRegistry_1, dialogs_1, extensions_1, instantiation_1, log_1, progress_1, platform_1, undoRedo_1, bulkCellEdits_1, bulkFileEdits_1, bulkTextEdits_1, editorService_1, lifecycle_2, workingCopyService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditService = void 0;
    function liftEdits(edits) {
        return edits.map(edit => {
            if (bulkEditService_1.ResourceTextEdit.is(edit)) {
                return bulkEditService_1.ResourceTextEdit.lift(edit);
            }
            if (bulkEditService_1.ResourceFileEdit.is(edit)) {
                return bulkEditService_1.ResourceFileEdit.lift(edit);
            }
            if (bulkCellEdits_1.ResourceNotebookCellEdit.is(edit)) {
                return bulkCellEdits_1.ResourceNotebookCellEdit.lift(edit);
            }
            throw new Error('Unsupported edit');
        });
    }
    let BulkEdit = class BulkEdit {
        constructor(_label, _code, _editor, _progress, _token, _edits, _undoRedoGroup, _undoRedoSource, _confirmBeforeUndo, _instaService, _logService) {
            this._label = _label;
            this._code = _code;
            this._editor = _editor;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._confirmBeforeUndo = _confirmBeforeUndo;
            this._instaService = _instaService;
            this._logService = _logService;
        }
        ariaMessage() {
            const otherResources = new map_1.ResourceMap();
            const textEditResources = new map_1.ResourceMap();
            let textEditCount = 0;
            for (const edit of this._edits) {
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    textEditCount += 1;
                    textEditResources.set(edit.resource, true);
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    otherResources.set(edit.oldResource ?? edit.newResource, true);
                }
            }
            if (this._edits.length === 0) {
                return (0, nls_1.localize)('summary.0', "Made no edits");
            }
            else if (otherResources.size === 0) {
                if (textEditCount > 1 && textEditResources.size > 1) {
                    return (0, nls_1.localize)('summary.nm', "Made {0} text edits in {1} files", textEditCount, textEditResources.size);
                }
                else {
                    return (0, nls_1.localize)('summary.n0', "Made {0} text edits in one file", textEditCount);
                }
            }
            else {
                return (0, nls_1.localize)('summary.textFiles', "Made {0} text edits in {1} files, also created or deleted {2} files", textEditCount, textEditResources.size, otherResources.size);
            }
        }
        async perform() {
            if (this._edits.length === 0) {
                return [];
            }
            const ranges = [1];
            for (let i = 1; i < this._edits.length; i++) {
                if (Object.getPrototypeOf(this._edits[i - 1]) === Object.getPrototypeOf(this._edits[i])) {
                    ranges[ranges.length - 1]++;
                }
                else {
                    ranges.push(1);
                }
            }
            // Show infinte progress when there is only 1 item since we do not know how long it takes
            const increment = this._edits.length > 1 ? 0 : undefined;
            this._progress.report({ increment, total: 100 });
            // Increment by percentage points since progress API expects that
            const progress = { report: _ => this._progress.report({ increment: 100 / this._edits.length }) };
            const resources = [];
            let index = 0;
            for (const range of ranges) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                const group = this._edits.slice(index, index + range);
                if (group[0] instanceof bulkEditService_1.ResourceFileEdit) {
                    resources.push(await this._performFileEdits(group, this._undoRedoGroup, this._undoRedoSource, this._confirmBeforeUndo, progress));
                }
                else if (group[0] instanceof bulkEditService_1.ResourceTextEdit) {
                    resources.push(await this._performTextEdits(group, this._undoRedoGroup, this._undoRedoSource, progress));
                }
                else if (group[0] instanceof bulkCellEdits_1.ResourceNotebookCellEdit) {
                    resources.push(await this._performCellEdits(group, this._undoRedoGroup, this._undoRedoSource, progress));
                }
                else {
                    console.log('UNKNOWN EDIT');
                }
                index = index + range;
            }
            return resources.flat();
        }
        async _performFileEdits(edits, undoRedoGroup, undoRedoSource, confirmBeforeUndo, progress) {
            this._logService.debug('_performFileEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkFileEdits_1.BulkFileEdits, this._label || (0, nls_1.localize)('workspaceEdit', "Workspace Edit"), this._code || 'undoredo.workspaceEdit', undoRedoGroup, undoRedoSource, confirmBeforeUndo, progress, this._token, edits);
            return await model.apply();
        }
        async _performTextEdits(edits, undoRedoGroup, undoRedoSource, progress) {
            this._logService.debug('_performTextEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkTextEdits_1.BulkTextEdits, this._label || (0, nls_1.localize)('workspaceEdit', "Workspace Edit"), this._code || 'undoredo.workspaceEdit', this._editor, undoRedoGroup, undoRedoSource, progress, this._token, edits);
            return await model.apply();
        }
        async _performCellEdits(edits, undoRedoGroup, undoRedoSource, progress) {
            this._logService.debug('_performCellEdits', JSON.stringify(edits));
            const model = this._instaService.createInstance(bulkCellEdits_1.BulkCellEdits, undoRedoGroup, undoRedoSource, progress, this._token, edits);
            return await model.apply();
        }
    };
    BulkEdit = __decorate([
        __param(9, instantiation_1.IInstantiationService),
        __param(10, log_1.ILogService)
    ], BulkEdit);
    let BulkEditService = class BulkEditService {
        constructor(_instaService, _logService, _editorService, _lifecycleService, _dialogService, _workingCopyService, _configService) {
            this._instaService = _instaService;
            this._logService = _logService;
            this._editorService = _editorService;
            this._lifecycleService = _lifecycleService;
            this._dialogService = _dialogService;
            this._workingCopyService = _workingCopyService;
            this._configService = _configService;
            this._activeUndoRedoGroups = new linkedList_1.LinkedList();
        }
        setPreviewHandler(handler) {
            this._previewHandler = handler;
            return (0, lifecycle_1.toDisposable)(() => {
                if (this._previewHandler === handler) {
                    this._previewHandler = undefined;
                }
            });
        }
        hasPreviewHandler() {
            return Boolean(this._previewHandler);
        }
        async apply(editsIn, options) {
            let edits = liftEdits(Array.isArray(editsIn) ? editsIn : editsIn.edits);
            if (edits.length === 0) {
                return { ariaSummary: (0, nls_1.localize)('nothing', "Made no edits"), isApplied: false };
            }
            if (this._previewHandler && (options?.showPreview || edits.some(value => value.metadata?.needsConfirmation))) {
                edits = await this._previewHandler(edits, options);
            }
            let codeEditor = options?.editor;
            // try to find code editor
            if (!codeEditor) {
                const candidate = this._editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(candidate)) {
                    codeEditor = candidate;
                }
                else if ((0, editorBrowser_1.isDiffEditor)(candidate)) {
                    codeEditor = candidate.getModifiedEditor();
                }
            }
            if (codeEditor && codeEditor.getOption(91 /* EditorOption.readOnly */)) {
                // If the code editor is readonly still allow bulk edits to be applied #68549
                codeEditor = undefined;
            }
            // undo-redo-group: if a group id is passed then try to find it
            // in the list of active edits. otherwise (or when not found)
            // create a separate undo-redo-group
            let undoRedoGroup;
            let undoRedoGroupRemove = () => { };
            if (typeof options?.undoRedoGroupId === 'number') {
                for (const candidate of this._activeUndoRedoGroups) {
                    if (candidate.id === options.undoRedoGroupId) {
                        undoRedoGroup = candidate;
                        break;
                    }
                }
            }
            if (!undoRedoGroup) {
                undoRedoGroup = new undoRedo_1.UndoRedoGroup();
                undoRedoGroupRemove = this._activeUndoRedoGroups.push(undoRedoGroup);
            }
            const label = options?.quotableLabel || options?.label;
            const bulkEdit = this._instaService.createInstance(BulkEdit, label, options?.code, codeEditor, options?.progress ?? progress_1.Progress.None, options?.token ?? cancellation_1.CancellationToken.None, edits, undoRedoGroup, options?.undoRedoSource, !!options?.confirmBeforeUndo);
            let listener;
            try {
                listener = this._lifecycleService.onBeforeShutdown(e => e.veto(this._shouldVeto(label, e.reason), 'veto.blukEditService'));
                const resources = await bulkEdit.perform();
                // when enabled (option AND setting) loop over all dirty working copies and trigger save
                // for those that were involved in this bulk edit operation.
                if (options?.respectAutoSaveConfig && this._configService.getValue(autoSaveSetting) === true && resources.length > 1) {
                    await this._saveAll(resources);
                }
                return { ariaSummary: bulkEdit.ariaMessage(), isApplied: edits.length > 0 };
            }
            catch (err) {
                // console.log('apply FAILED');
                // console.log(err);
                this._logService.error(err);
                throw err;
            }
            finally {
                listener?.dispose();
                undoRedoGroupRemove();
            }
        }
        async _saveAll(resources) {
            const set = new map_1.ResourceSet(resources);
            const saves = this._workingCopyService.dirtyWorkingCopies.map(async (copy) => {
                if (set.has(copy.resource)) {
                    await copy.save();
                }
            });
            const result = await Promise.allSettled(saves);
            for (const item of result) {
                if (item.status === 'rejected') {
                    this._logService.warn(item.reason);
                }
            }
        }
        async _shouldVeto(label, reason) {
            let message;
            let primaryButton;
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    message = (0, nls_1.localize)('closeTheWindow.message', "Are you sure you want to close the window?");
                    primaryButton = (0, nls_1.localize)({ key: 'closeTheWindow', comment: ['&& denotes a mnemonic'] }, "&&Close Window");
                    break;
                case 4 /* ShutdownReason.LOAD */:
                    message = (0, nls_1.localize)('changeWorkspace.message', "Are you sure you want to change the workspace?");
                    primaryButton = (0, nls_1.localize)({ key: 'changeWorkspace', comment: ['&& denotes a mnemonic'] }, "Change &&Workspace");
                    break;
                case 3 /* ShutdownReason.RELOAD */:
                    message = (0, nls_1.localize)('reloadTheWindow.message', "Are you sure you want to reload the window?");
                    primaryButton = (0, nls_1.localize)({ key: 'reloadTheWindow', comment: ['&& denotes a mnemonic'] }, "&&Reload Window");
                    break;
                default:
                    message = (0, nls_1.localize)('quit.message', "Are you sure you want to quit?");
                    primaryButton = (0, nls_1.localize)({ key: 'quit', comment: ['&& denotes a mnemonic'] }, "&&Quit");
                    break;
            }
            const result = await this._dialogService.confirm({
                message,
                detail: (0, nls_1.localize)('areYouSureQuiteBulkEdit.detail', "'{0}' is in progress.", label || (0, nls_1.localize)('fileOperation', "File operation")),
                primaryButton
            });
            return !result.confirmed;
        }
    };
    exports.BulkEditService = BulkEditService;
    exports.BulkEditService = BulkEditService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService),
        __param(2, editorService_1.IEditorService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, dialogs_1.IDialogService),
        __param(5, workingCopyService_1.IWorkingCopyService),
        __param(6, configuration_1.IConfigurationService)
    ], BulkEditService);
    (0, extensions_1.registerSingleton)(bulkEditService_1.IBulkEditService, BulkEditService, 1 /* InstantiationType.Delayed */);
    const autoSaveSetting = 'files.refactoring.autoSave';
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'files',
        properties: {
            [autoSaveSetting]: {
                description: (0, nls_1.localize)('refactoring.autoSave', "Controls if files that were part of a refactoring are saved automatically"),
                default: true,
                type: 'boolean'
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9idWxrRWRpdC9icm93c2VyL2J1bGtFZGl0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0QmhHLFNBQVMsU0FBUyxDQUFDLEtBQXFCO1FBQ3ZDLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QixJQUFJLGtDQUFnQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLGtDQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBQ0QsSUFBSSxrQ0FBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxrQ0FBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUNELElBQUksd0NBQXdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLE9BQU8sd0NBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsSUFBTSxRQUFRLEdBQWQsTUFBTSxRQUFRO1FBRWIsWUFDa0IsTUFBMEIsRUFDMUIsS0FBeUIsRUFDekIsT0FBZ0MsRUFDaEMsU0FBbUMsRUFDbkMsTUFBeUIsRUFDekIsTUFBc0IsRUFDdEIsY0FBNkIsRUFDN0IsZUFBMkMsRUFDM0Msa0JBQTJCLEVBQ0osYUFBb0MsRUFDOUMsV0FBd0I7WUFWckMsV0FBTSxHQUFO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