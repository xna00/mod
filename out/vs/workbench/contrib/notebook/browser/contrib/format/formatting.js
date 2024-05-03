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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/bulkEditService", "vs/editor/common/editorContextKeys", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/editor/contrib/format/browser/format", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, nls_1, cancellation_1, lifecycle_1, editorExtensions_1, bulkEditService_1, editorContextKeys_1, editorWorker_1, languageFeatures_1, resolverService_1, format_1, actions_1, contextkey_1, instantiation_1, progress_1, coreActions_1, notebookBrowser_1, notebookContextKeys_1, editorService_1, notebookExecutionService_1, notebookCommon_1, configuration_1, platform_1, contributions_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellExecutionParticipantsContribution = void 0;
    // format notebook
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.format',
                title: (0, nls_1.localize2)('format.title', 'Format Notebook'),
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus.toNegated(),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                f1: true,
                menu: {
                    id: actions_1.MenuId.EditorContext,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.inCompositeEditor, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const textModelService = accessor.get(resolverService_1.ITextModelService);
            const editorWorkerService = accessor.get(editorWorker_1.IEditorWorkerService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor || !editor.hasModel()) {
                return;
            }
            const notebook = editor.textModel;
            const disposable = new lifecycle_1.DisposableStore();
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    const ref = await textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    const formatEdits = await (0, format_1.getDocumentFormattingEditsUntilResult)(editorWorkerService, languageFeaturesService, model, model.getOptions(), cancellation_1.CancellationToken.None);
                    const edits = [];
                    if (formatEdits) {
                        for (const edit of formatEdits) {
                            edits.push(new bulkEditService_1.ResourceTextEdit(model.uri, edit, model.getVersionId()));
                        }
                        return edits;
                    }
                    return [];
                }));
                await bulkEditService.apply(/* edit */ allCellEdits.flat(), { label: (0, nls_1.localize)('label', "Format Notebook"), code: 'undoredo.formatNotebook', });
            }
            finally {
                disposable.dispose();
            }
        }
    });
    // format cell
    (0, editorExtensions_1.registerEditorAction)(class FormatCellAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'notebook.formatCell',
                label: (0, nls_1.localize)('formatCell.label', "Format Cell"),
                alias: 'Format Cell',
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, editorContextKeys_1.EditorContextKeys.inCompositeEditor, editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus),
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.301
                }
            });
        }
        async run(accessor, editor) {
            if (editor.hasModel()) {
                const instaService = accessor.get(instantiation_1.IInstantiationService);
                await instaService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editor, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None, true);
            }
        }
    });
    let FormatOnCellExecutionParticipant = class FormatOnCellExecutionParticipant {
        constructor(bulkEditService, languageFeaturesService, textModelService, editorWorkerService, configurationService, _notebookService) {
            this.bulkEditService = bulkEditService;
            this.languageFeaturesService = languageFeaturesService;
            this.textModelService = textModelService;
            this.editorWorkerService = editorWorkerService;
            this.configurationService = configurationService;
            this._notebookService = _notebookService;
        }
        async onWillExecuteCell(executions) {
            const enabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.formatOnCellExecution);
            if (!enabled) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            try {
                const allCellEdits = await Promise.all(executions.map(async (cellExecution) => {
                    const nbModel = this._notebookService.getNotebookTextModel(cellExecution.notebook);
                    if (!nbModel) {
                        return [];
                    }
                    let activeCell;
                    for (const cell of nbModel.cells) {
                        if (cell.handle === cellExecution.cellHandle) {
                            activeCell = cell;
                            break;
                        }
                    }
                    if (!activeCell) {
                        return [];
                    }
                    const ref = await this.textModelService.createModelReference(activeCell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    // todo: eventually support cancellation. potential leak if cell deleted mid execution
                    const formatEdits = await (0, format_1.getDocumentFormattingEditsUntilResult)(this.editorWorkerService, this.languageFeaturesService, model, model.getOptions(), cancellation_1.CancellationToken.None);
                    const edits = [];
                    if (formatEdits) {
                        edits.push(...formatEdits.map(edit => new bulkEditService_1.ResourceTextEdit(model.uri, edit, model.getVersionId())));
                        return edits;
                    }
                    return [];
                }));
                await this.bulkEditService.apply(/* edit */ allCellEdits.flat(), { label: (0, nls_1.localize)('formatCells.label', "Format Cells"), code: 'undoredo.notebooks.onWillExecuteFormat', });
            }
            finally {
                disposable.dispose();
            }
        }
    };
    FormatOnCellExecutionParticipant = __decorate([
        __param(0, bulkEditService_1.IBulkEditService),
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, editorWorker_1.IEditorWorkerService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, notebookService_1.INotebookService)
    ], FormatOnCellExecutionParticipant);
    let CellExecutionParticipantsContribution = class CellExecutionParticipantsContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, notebookExecutionService) {
            super();
            this.instantiationService = instantiationService;
            this.notebookExecutionService = notebookExecutionService;
            this.registerKernelExecutionParticipants();
        }
        registerKernelExecutionParticipants() {
            this._register(this.notebookExecutionService.registerExecutionParticipant(this.instantiationService.createInstance(FormatOnCellExecutionParticipant)));
        }
    };
    exports.CellExecutionParticipantsContribution = CellExecutionParticipantsContribution;
    exports.CellExecutionParticipantsContribution = CellExecutionParticipantsContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookExecutionService_1.INotebookExecutionService)
    ], CellExecutionParticipantsContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(CellExecutionParticipantsContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2Zvcm1hdC9mb3JtYXR0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdDaEcsa0JBQWtCO0lBQ2xCLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsaUJBQU87UUFDcEM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGlCQUFpQjtnQkFDckIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQztnQkFDbkQsUUFBUSxFQUFFLHVDQUF5QjtnQkFDbkMsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLCtDQUF5QixFQUFFLDhDQUF3QixDQUFDO2dCQUNyRixVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLHFDQUFpQixDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUU7b0JBQ25ELE9BQU8sRUFBRSw4Q0FBeUIsd0JBQWU7b0JBQ2pELEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxtREFBNkIsd0JBQWUsRUFBRTtvQkFDaEUsTUFBTSw2Q0FBbUM7aUJBQ3pDO2dCQUNELEVBQUUsRUFBRSxJQUFJO2dCQUNSLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhO29CQUN4QixJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMscUNBQWlCLENBQUMsaUJBQWlCLEVBQUUscUNBQWlCLENBQUMsNkJBQTZCLENBQUM7b0JBQzlHLEtBQUssRUFBRSxnQkFBZ0I7b0JBQ3ZCLEtBQUssRUFBRSxHQUFHO2lCQUNWO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENB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