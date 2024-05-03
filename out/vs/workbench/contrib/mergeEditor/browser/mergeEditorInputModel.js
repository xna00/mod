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
define(["require", "exports", "vs/base/common/assert", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/resources", "vs/base/common/severity", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/common/editor", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/mergeEditor/browser/mergeMarkers/mergeMarkersController", "vs/workbench/contrib/mergeEditor/browser/model/diffComputer", "vs/workbench/contrib/mergeEditor/browser/model/mergeEditorModel", "vs/workbench/contrib/mergeEditor/common/mergeEditor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, assert_1, errors_1, event_1, lifecycle_1, observable_1, resources_1, severity_1, model_1, resolverService_1, nls_1, dialogs_1, instantiation_1, storage_1, editor_1, editorModel_1, mergeMarkersController_1, diffComputer_1, mergeEditorModel_1, mergeEditor_1, editorService_1, textfiles_1) {
    "use strict";
    var WorkspaceMergeEditorModeFactory_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceMergeEditorModeFactory = exports.TempFileMergeEditorModeFactory = void 0;
    /* ================ Temp File ================ */
    let TempFileMergeEditorModeFactory = class TempFileMergeEditorModeFactory {
        constructor(_mergeEditorTelemetry, _instantiationService, _textModelService, _modelService) {
            this._mergeEditorTelemetry = _mergeEditorTelemetry;
            this._instantiationService = _instantiationService;
            this._textModelService = _textModelService;
            this._modelService = _modelService;
        }
        async createInputModel(args) {
            const store = new lifecycle_1.DisposableStore();
            const [base, result, input1Data, input2Data,] = await Promise.all([
                this._textModelService.createModelReference(args.base),
                this._textModelService.createModelReference(args.result),
                toInputData(args.input1, this._textModelService, store),
                toInputData(args.input2, this._textModelService, store),
            ]);
            store.add(base);
            store.add(result);
            const tempResultUri = result.object.textEditorModel.uri.with({ scheme: 'merge-result' });
            const temporaryResultModel = this._modelService.createModel('', {
                languageId: result.object.textEditorModel.getLanguageId(),
                onDidChange: event_1.Event.None,
            }, tempResultUri);
            store.add(temporaryResultModel);
            const mergeDiffComputer = this._instantiationService.createInstance(diffComputer_1.MergeDiffComputer);
            const model = this._instantiationService.createInstance(mergeEditorModel_1.MergeEditorModel, base.object.textEditorModel, input1Data, input2Data, temporaryResultModel, mergeDiffComputer, {
                resetResult: true,
            }, this._mergeEditorTelemetry);
            store.add(model);
            await model.onInitialized;
            return this._instantiationService.createInstance(TempFileMergeEditorInputModel, model, store, result.object, args.result);
        }
    };
    exports.TempFileMergeEditorModeFactory = TempFileMergeEditorModeFactory;
    exports.TempFileMergeEditorModeFactory = TempFileMergeEditorModeFactory = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, model_1.IModelService)
    ], TempFileMergeEditorModeFactory);
    let TempFileMergeEditorInputModel = class TempFileMergeEditorInputModel extends editorModel_1.EditorModel {
        constructor(model, disposable, result, resultUri, textFileService, dialogService, editorService) {
            super();
            this.model = model;
            this.disposable = disposable;
            this.result = result;
            this.resultUri = resultUri;
            this.textFileService = textFileService;
            this.dialogService = dialogService;
            this.editorService = editorService;
            this.savedAltVersionId = (0, observable_1.observableValue)(this, this.model.resultTextModel.getAlternativeVersionId());
            this.altVersionId = (0, observable_1.observableFromEvent)(e => this.model.resultTextModel.onDidChangeContent(e), () => 
            /** @description getAlternativeVersionId */ this.model.resultTextModel.getAlternativeVersionId());
            this.isDirty = (0, observable_1.derived)(this, (reader) => this.altVersionId.read(reader) !== this.savedAltVersionId.read(reader));
            this.finished = false;
        }
        dispose() {
            this.disposable.dispose();
            super.dispose();
        }
        async accept() {
            const value = await this.model.resultTextModel.getValue();
            this.result.textEditorModel.setValue(value);
            this.savedAltVersionId.set(this.model.resultTextModel.getAlternativeVersionId(), undefined);
            await this.textFileService.save(this.result.textEditorModel.uri);
            this.finished = true;
        }
        async _discard() {
            await this.textFileService.revert(this.model.resultTextModel.uri);
            this.savedAltVersionId.set(this.model.resultTextModel.getAlternativeVersionId(), undefined);
            this.finished = true;
        }
        shouldConfirmClose() {
            return true;
        }
        async confirmClose(inputModels) {
            (0, assert_1.assertFn)(() => inputModels.some((m) => m === this));
            const someDirty = inputModels.some((m) => m.isDirty.get());
            let choice;
            if (someDirty) {
                const isMany = inputModels.length > 1;
                const message = isMany
                    ? (0, nls_1.localize)('messageN', 'Do you want keep the merge result of {0} files?', inputModels.length)
                    : (0, nls_1.localize)('message1', 'Do you want keep the merge result of {0}?', (0, resources_1.basename)(inputModels[0].model.resultTextModel.uri));
                const hasUnhandledConflicts = inputModels.some((m) => m.model.hasUnhandledConflicts.get());
                const buttons = [
                    {
                        label: hasUnhandledConflicts ?
                            (0, nls_1.localize)({ key: 'saveWithConflict', comment: ['&& denotes a mnemonic'] }, "&&Save With Conflicts") :
                            (0, nls_1.localize)({ key: 'save', comment: ['&& denotes a mnemonic'] }, "&&Save"),
                        run: () => 0 /* ConfirmResult.SAVE */
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'discard', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
                        run: () => 1 /* ConfirmResult.DONT_SAVE */
                    }
                ];
                choice = (await this.dialogService.prompt({
                    type: severity_1.default.Info,
                    message,
                    detail: hasUnhandledConflicts
                        ? isMany
                            ? (0, nls_1.localize)('detailNConflicts', "The files contain unhandled conflicts. The merge results will be lost if you don't save them.")
                            : (0, nls_1.localize)('detail1Conflicts', "The file contains unhandled conflicts. The merge result will be lost if you don't save it.")
                        : isMany
                            ? (0, nls_1.localize)('detailN', "The merge results will be lost if you don't save them.")
                            : (0, nls_1.localize)('detail1', "The merge result will be lost if you don't save it."),
                    buttons,
                    cancelButton: {
                        run: () => 2 /* ConfirmResult.CANCEL */
                    }
                })).result;
            }
            else {
                choice = 1 /* ConfirmResult.DONT_SAVE */;
            }
            if (choice === 0 /* ConfirmResult.SAVE */) {
                // save with conflicts
                await Promise.all(inputModels.map(m => m.accept()));
            }
            else if (choice === 1 /* ConfirmResult.DONT_SAVE */) {
                // discard changes
                await Promise.all(inputModels.map(m => m._discard()));
            }
            else {
                // cancel: stay in editor
            }
            return choice;
        }
        async save(options) {
            if (this.finished) {
                return;
            }
            // It does not make sense to save anything in the temp file mode.
            // The file stays dirty from the first edit on.
            (async () => {
                const { confirmed } = await this.dialogService.confirm({
                    message: (0, nls_1.localize)('saveTempFile.message', "Do you want to accept the merge result?"),
                    detail: (0, nls_1.localize)('saveTempFile.detail', "This will write the merge result to the original file and close the merge editor."),
                    primaryButton: (0, nls_1.localize)({ key: 'acceptMerge', comment: ['&& denotes a mnemonic'] }, '&&Accept Merge')
                });
                if (confirmed) {
                    await this.accept();
                    const editors = this.editorService.findEditors(this.resultUri).filter(e => e.editor.typeId === 'mergeEditor.Input');
                    await this.editorService.closeEditors(editors);
                }
            })();
        }
        async revert(options) {
            // no op
        }
    };
    TempFileMergeEditorInputModel = __decorate([
        __param(4, textfiles_1.ITextFileService),
        __param(5, dialogs_1.IDialogService),
        __param(6, editorService_1.IEditorService)
    ], TempFileMergeEditorInputModel);
    /* ================ Workspace ================ */
    let WorkspaceMergeEditorModeFactory = class WorkspaceMergeEditorModeFactory {
        static { WorkspaceMergeEditorModeFactory_1 = this; }
        constructor(_mergeEditorTelemetry, _instantiationService, _textModelService, textFileService) {
            this._mergeEditorTelemetry = _mergeEditorTelemetry;
            this._instantiationService = _instantiationService;
            this._textModelService = _textModelService;
            this.textFileService = textFileService;
        }
        static { this.FILE_SAVED_SOURCE = editor_1.SaveSourceRegistry.registerSource('merge-editor.source', (0, nls_1.localize)('merge-editor.source', "Before Resolving Conflicts In Merge Editor")); }
        async createInputModel(args) {
            const store = new lifecycle_1.DisposableStore();
            let resultTextFileModel = undefined;
            const modelListener = store.add(new lifecycle_1.DisposableStore());
            const handleDidCreate = (model) => {
                if ((0, resources_1.isEqual)(args.result, model.resource)) {
                    modelListener.clear();
                    resultTextFileModel = model;
                }
            };
            modelListener.add(this.textFileService.files.onDidCreate(handleDidCreate));
            this.textFileService.files.models.forEach(handleDidCreate);
            const [base, result, input1Data, input2Data,] = await Promise.all([
                this._textModelService.createModelReference(args.base),
                this._textModelService.createModelReference(args.result),
                toInputData(args.input1, this._textModelService, store),
                toInputData(args.input2, this._textModelService, store),
            ]);
            store.add(base);
            store.add(result);
            if (!resultTextFileModel) {
                throw new errors_1.BugIndicatingError();
            }
            // So that "Don't save" does revert the file
            await resultTextFileModel.save({ source: WorkspaceMergeEditorModeFactory_1.FILE_SAVED_SOURCE });
            const lines = resultTextFileModel.textEditorModel.getLinesContent();
            const hasConflictMarkers = lines.some(l => l.startsWith(mergeMarkersController_1.conflictMarkers.start));
            const resetResult = hasConflictMarkers;
            const mergeDiffComputer = this._instantiationService.createInstance(diffComputer_1.MergeDiffComputer);
            const model = this._instantiationService.createInstance(mergeEditorModel_1.MergeEditorModel, base.object.textEditorModel, input1Data, input2Data, result.object.textEditorModel, mergeDiffComputer, {
                resetResult
            }, this._mergeEditorTelemetry);
            store.add(model);
            await model.onInitialized;
            return this._instantiationService.createInstance(WorkspaceMergeEditorInputModel, model, store, resultTextFileModel, this._mergeEditorTelemetry);
        }
    };
    exports.WorkspaceMergeEditorModeFactory = WorkspaceMergeEditorModeFactory;
    exports.WorkspaceMergeEditorModeFactory = WorkspaceMergeEditorModeFactory = WorkspaceMergeEditorModeFactory_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, textfiles_1.ITextFileService)
    ], WorkspaceMergeEditorModeFactory);
    let WorkspaceMergeEditorInputModel = class WorkspaceMergeEditorInputModel extends editorModel_1.EditorModel {
        constructor(model, disposableStore, resultTextFileModel, telemetry, _dialogService, _storageService) {
            super();
            this.model = model;
            this.disposableStore = disposableStore;
            this.resultTextFileModel = resultTextFileModel;
            this.telemetry = telemetry;
            this._dialogService = _dialogService;
            this._storageService = _storageService;
            this.isDirty = (0, observable_1.observableFromEvent)(event_1.Event.any(this.resultTextFileModel.onDidChangeDirty, this.resultTextFileModel.onDidSaveError), () => /** @description isDirty */ this.resultTextFileModel.isDirty());
            this.reported = false;
            this.dateTimeOpened = new Date();
        }
        dispose() {
            this.disposableStore.dispose();
            super.dispose();
            this.reportClose(false);
        }
        reportClose(accepted) {
            if (!this.reported) {
                const remainingConflictCount = this.model.unhandledConflictsCount.get();
                const durationOpenedMs = new Date().getTime() - this.dateTimeOpened.getTime();
                this.telemetry.reportMergeEditorClosed({
                    durationOpenedSecs: durationOpenedMs / 1000,
                    remainingConflictCount,
                    accepted,
                    conflictCount: this.model.conflictCount,
                    combinableConflictCount: this.model.combinableConflictCount,
                    conflictsResolvedWithBase: this.model.conflictsResolvedWithBase,
                    conflictsResolvedWithInput1: this.model.conflictsResolvedWithInput1,
                    conflictsResolvedWithInput2: this.model.conflictsResolvedWithInput2,
                    conflictsResolvedWithSmartCombination: this.model.conflictsResolvedWithSmartCombination,
                    manuallySolvedConflictCountThatEqualNone: this.model.manuallySolvedConflictCountThatEqualNone,
                    manuallySolvedConflictCountThatEqualSmartCombine: this.model.manuallySolvedConflictCountThatEqualSmartCombine,
                    manuallySolvedConflictCountThatEqualInput1: this.model.manuallySolvedConflictCountThatEqualInput1,
                    manuallySolvedConflictCountThatEqualInput2: this.model.manuallySolvedConflictCountThatEqualInput2,
                    manuallySolvedConflictCountThatEqualNoneAndStartedWithBase: this.model.manuallySolvedConflictCountThatEqualNoneAndStartedWithBase,
                    manuallySolvedConflictCountThatEqualNoneAndStartedWithInput1: this.model.manuallySolvedConflictCountThatEqualNoneAndStartedWithInput1,
                    manuallySolvedConflictCountThatEqualNoneAndStartedWithInput2: this.model.manuallySolvedConflictCountThatEqualNoneAndStartedWithInput2,
                    manuallySolvedConflictCountThatEqualNoneAndStartedWithBothNonSmart: this.model.manuallySolvedConflictCountThatEqualNoneAndStartedWithBothNonSmart,
                    manuallySolvedConflictCountThatEqualNoneAndStartedWithBothSmart: this.model.manuallySolvedConflictCountThatEqualNoneAndStartedWithBothSmart,
                });
                this.reported = true;
            }
        }
        async accept() {
            this.reportClose(true);
            await this.resultTextFileModel.save();
        }
        get resultUri() {
            return this.resultTextFileModel.resource;
        }
        async save(options) {
            await this.resultTextFileModel.save(options);
        }
        /**
         * If save resets the dirty state, revert must do so too.
        */
        async revert(options) {
            await this.resultTextFileModel.revert(options);
        }
        shouldConfirmClose() {
            // Always confirm
            return true;
        }
        async confirmClose(inputModels) {
            const isMany = inputModels.length > 1;
            const someDirty = inputModels.some(m => m.isDirty.get());
            const someUnhandledConflicts = inputModels.some(m => m.model.hasUnhandledConflicts.get());
            if (someDirty) {
                const message = isMany
                    ? (0, nls_1.localize)('workspace.messageN', 'Do you want to save the changes you made to {0} files?', inputModels.length)
                    : (0, nls_1.localize)('workspace.message1', 'Do you want to save the changes you made to {0}?', (0, resources_1.basename)(inputModels[0].resultUri));
                const { result } = await this._dialogService.prompt({
                    type: severity_1.default.Info,
                    message,
                    detail: someUnhandledConflicts ?
                        isMany
                            ? (0, nls_1.localize)('workspace.detailN.unhandled', "The files contain unhandled conflicts. Your changes will be lost if you don't save them.")
                            : (0, nls_1.localize)('workspace.detail1.unhandled', "The file contains unhandled conflicts. Your changes will be lost if you don't save them.")
                        : isMany
                            ? (0, nls_1.localize)('workspace.detailN.handled', "Your changes will be lost if you don't save them.")
                            : (0, nls_1.localize)('workspace.detail1.handled', "Your changes will be lost if you don't save them."),
                    buttons: [
                        {
                            label: someUnhandledConflicts
                                ? (0, nls_1.localize)({ key: 'workspace.saveWithConflict', comment: ['&& denotes a mnemonic'] }, '&&Save with Conflicts')
                                : (0, nls_1.localize)({ key: 'workspace.save', comment: ['&& denotes a mnemonic'] }, '&&Save'),
                            run: () => 0 /* ConfirmResult.SAVE */
                        },
                        {
                            label: (0, nls_1.localize)({ key: 'workspace.doNotSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
                            run: () => 1 /* ConfirmResult.DONT_SAVE */
                        }
                    ],
                    cancelButton: {
                        run: () => 2 /* ConfirmResult.CANCEL */
                    }
                });
                return result;
            }
            else if (someUnhandledConflicts && !this._storageService.getBoolean(mergeEditor_1.StorageCloseWithConflicts, 0 /* StorageScope.PROFILE */, false)) {
                const { confirmed, checkboxChecked } = await this._dialogService.confirm({
                    message: isMany
                        ? (0, nls_1.localize)('workspace.messageN.nonDirty', 'Do you want to close {0} merge editors?', inputModels.length)
                        : (0, nls_1.localize)('workspace.message1.nonDirty', 'Do you want to close the merge editor for {0}?', (0, resources_1.basename)(inputModels[0].resultUri)),
                    detail: someUnhandledConflicts ?
                        isMany
                            ? (0, nls_1.localize)('workspace.detailN.unhandled.nonDirty', "The files contain unhandled conflicts.")
                            : (0, nls_1.localize)('workspace.detail1.unhandled.nonDirty', "The file contains unhandled conflicts.")
                        : undefined,
                    primaryButton: someUnhandledConflicts
                        ? (0, nls_1.localize)({ key: 'workspace.closeWithConflicts', comment: ['&& denotes a mnemonic'] }, '&&Close with Conflicts')
                        : (0, nls_1.localize)({ key: 'workspace.close', comment: ['&& denotes a mnemonic'] }, '&&Close'),
                    checkbox: { label: (0, nls_1.localize)('noMoreWarn', "Do not ask me again") }
                });
                if (checkboxChecked) {
                    this._storageService.store(mergeEditor_1.StorageCloseWithConflicts, true, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                }
                return confirmed ? 0 /* ConfirmResult.SAVE */ : 2 /* ConfirmResult.CANCEL */;
            }
            else {
                // This shouldn't do anything
                return 0 /* ConfirmResult.SAVE */;
            }
        }
    };
    WorkspaceMergeEditorInputModel = __decorate([
        __param(4, dialogs_1.IDialogService),
        __param(5, storage_1.IStorageService)
    ], WorkspaceMergeEditorInputModel);
    /* ================= Utils ================== */
    async function toInputData(data, textModelService, store) {
        const ref = await textModelService.createModelReference(data.uri);
        store.add(ref);
        return {
            textModel: ref.object.textEditorModel,
            title: data.title,
            description: data.description,
            detail: data.detail,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3JJbnB1dE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci9icm93c2VyL21lcmdlRWRpdG9ySW5wdXRNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNkRoRyxpREFBaUQ7SUFFMUMsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBOEI7UUFDMUMsWUFDa0IscUJBQTJDLEVBQ3BCLHFCQUE0QyxFQUNoRCxpQkFBb0MsRUFDeEMsYUFBNEI7WUFIM0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFzQjtZQUNwQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2hELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDeEMsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFFN0QsQ0FBQztRQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFxQjtZQUMzQyxNQUFNLEtBQUssR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVwQyxNQUFNLENBQ0wsSUFBSSxFQUNKLE1BQU0sRUFDTixVQUFVLEVBQ1YsVUFBVSxFQUNWLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNyQixJQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDdEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ3hELFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUM7Z0JBQ3ZELFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFB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