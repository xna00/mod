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
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/editor/contrib/format/browser/format", "vs/editor/contrib/snippet/browser/snippetController2", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/workingCopy/common/workingCopyFileService"], function (require, exports, hierarchicalKind_1, lifecycle_1, resources_1, bulkEditService_1, trimTrailingWhitespaceCommand_1, position_1, range_1, editorWorker_1, languageFeatures_1, resolverService_1, codeAction_1, types_1, format_1, snippetController2_1, nls_1, configuration_1, instantiation_1, log_1, platform_1, workspaceTrust_1, contributions_1, notebookBrowser_1, notebookCommon_1, notebookEditorModel_1, editorService_1, workingCopyFileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveParticipantsContribution = void 0;
    let FormatOnSaveParticipant = class FormatOnSaveParticipant {
        constructor(editorWorkerService, languageFeaturesService, textModelService, bulkEditService, configurationService) {
            this.editorWorkerService = editorWorkerService;
            this.languageFeaturesService = languageFeaturesService;
            this.textModelService = textModelService;
            this.bulkEditService = bulkEditService;
            this.configurationService = configurationService;
        }
        async participate(workingCopy, context, progress, token) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            if (context.reason === 2 /* SaveReason.AUTO */) {
                return undefined;
            }
            const enabled = this.configurationService.getValue(notebookCommon_1.NotebookSetting.formatOnSave);
            if (!enabled) {
                return undefined;
            }
            const notebook = workingCopy.model.notebookModel;
            progress.report({ message: (0, nls_1.localize)('notebookFormatSave.formatting', "Formatting") });
            const disposable = new lifecycle_1.DisposableStore();
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    const ref = await this.textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    const formatEdits = await (0, format_1.getDocumentFormattingEditsUntilResult)(this.editorWorkerService, this.languageFeaturesService, model, model.getOptions(), token);
                    const edits = [];
                    if (formatEdits) {
                        edits.push(...formatEdits.map(edit => new bulkEditService_1.ResourceTextEdit(model.uri, edit, model.getVersionId())));
                        return edits;
                    }
                    return [];
                }));
                await this.bulkEditService.apply(/* edit */ allCellEdits.flat(), { label: (0, nls_1.localize)('formatNotebook', "Format Notebook"), code: 'undoredo.formatNotebook', });
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    FormatOnSaveParticipant = __decorate([
        __param(0, editorWorker_1.IEditorWorkerService),
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, configuration_1.IConfigurationService)
    ], FormatOnSaveParticipant);
    let TrimWhitespaceParticipant = class TrimWhitespaceParticipant {
        constructor(configurationService, editorService, textModelService, bulkEditService) {
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.textModelService = textModelService;
            this.bulkEditService = bulkEditService;
        }
        async participate(workingCopy, context, progress, _token) {
            const trimTrailingWhitespaceOption = this.configurationService.getValue('files.trimTrailingWhitespace');
            const trimInRegexAndStrings = this.configurationService.getValue('files.trimTrailingWhitespaceInRegexAndStrings');
            if (trimTrailingWhitespaceOption) {
                await this.doTrimTrailingWhitespace(workingCopy, context.reason === 2 /* SaveReason.AUTO */, trimInRegexAndStrings, progress);
            }
        }
        async doTrimTrailingWhitespace(workingCopy, isAutoSaved, trimInRegexesAndStrings, progress) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            const notebook = workingCopy.model.notebookModel;
            const activeCellEditor = getActiveCellCodeEditor(this.editorService);
            let cursors = [];
            let prevSelection = [];
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    if (cell.cellKind !== notebookCommon_1.CellKind.Code) {
                        return [];
                    }
                    const ref = await this.textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const model = ref.object.textEditorModel;
                    const isActiveCell = (activeCellEditor && cell.uri.toString() === activeCellEditor.getModel()?.uri.toString());
                    if (isActiveCell) {
                        prevSelection = activeCellEditor.getSelections() ?? [];
                        if (isAutoSaved) {
                            cursors = prevSelection.map(s => s.getPosition()); // get initial cursor positions
                            const snippetsRange = snippetController2_1.SnippetController2.get(activeCellEditor)?.getSessionEnclosingRange();
                            if (snippetsRange) {
                                for (let lineNumber = snippetsRange.startLineNumber; lineNumber <= snippetsRange.endLineNumber; lineNumber++) {
                                    cursors.push(new position_1.Position(lineNumber, model.getLineMaxColumn(lineNumber)));
                                }
                            }
                        }
                    }
                    const ops = (0, trimTrailingWhitespaceCommand_1.trimTrailingWhitespace)(model, cursors, trimInRegexesAndStrings);
                    if (!ops.length) {
                        return []; // Nothing to do
                    }
                    return ops.map(op => new bulkEditService_1.ResourceTextEdit(model.uri, { ...op, text: op.text || '' }, model.getVersionId()));
                }));
                const filteredEdits = allCellEdits.flat().filter(edit => edit !== undefined);
                await this.bulkEditService.apply(filteredEdits, { label: (0, nls_1.localize)('trimNotebookWhitespace', "Notebook Trim Trailing Whitespace"), code: 'undoredo.notebookTrimTrailingWhitespace' });
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    TrimWhitespaceParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, bulkEditService_1.IBulkEditService)
    ], TrimWhitespaceParticipant);
    let TrimFinalNewLinesParticipant = class TrimFinalNewLinesParticipant {
        constructor(configurationService, editorService, bulkEditService) {
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.bulkEditService = bulkEditService;
        }
        async participate(workingCopy, context, progress, _token) {
            if (this.configurationService.getValue('files.trimFinalNewlines')) {
                await this.doTrimFinalNewLines(workingCopy, context.reason === 2 /* SaveReason.AUTO */, progress);
            }
        }
        /**
         * returns 0 if the entire file is empty
         */
        findLastNonEmptyLine(textBuffer) {
            for (let lineNumber = textBuffer.getLineCount(); lineNumber >= 1; lineNumber--) {
                const lineLength = textBuffer.getLineLength(lineNumber);
                if (lineLength) {
                    // this line has content
                    return lineNumber;
                }
            }
            // no line has content
            return 0;
        }
        async doTrimFinalNewLines(workingCopy, isAutoSaved, progress) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            const notebook = workingCopy.model.notebookModel;
            const activeCellEditor = getActiveCellCodeEditor(this.editorService);
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    if (cell.cellKind !== notebookCommon_1.CellKind.Code) {
                        return;
                    }
                    // autosave -- don't trim every trailing line, just up to the cursor line
                    let cannotTouchLineNumber = 0;
                    const isActiveCell = (activeCellEditor && cell.uri.toString() === activeCellEditor.getModel()?.uri.toString());
                    if (isAutoSaved && isActiveCell) {
                        const selections = activeCellEditor.getSelections() ?? [];
                        for (const sel of selections) {
                            cannotTouchLineNumber = Math.max(cannotTouchLineNumber, sel.selectionStartLineNumber);
                        }
                    }
                    const textBuffer = cell.textBuffer;
                    const lastNonEmptyLine = this.findLastNonEmptyLine(textBuffer);
                    const deleteFromLineNumber = Math.max(lastNonEmptyLine + 1, cannotTouchLineNumber + 1);
                    if (deleteFromLineNumber > textBuffer.getLineCount()) {
                        return;
                    }
                    const deletionRange = new range_1.Range(deleteFromLineNumber, 1, textBuffer.getLineCount(), textBuffer.getLineLastNonWhitespaceColumn(textBuffer.getLineCount()));
                    if (deletionRange.isEmpty()) {
                        return;
                    }
                    // create the edit to delete all lines in deletionRange
                    return new bulkEditService_1.ResourceTextEdit(cell.uri, { range: deletionRange, text: '' }, cell.textModel?.getVersionId());
                }));
                const filteredEdits = allCellEdits.flat().filter(edit => edit !== undefined);
                await this.bulkEditService.apply(filteredEdits, { label: (0, nls_1.localize)('trimNotebookNewlines', "Trim Final New Lines"), code: 'undoredo.trimFinalNewLines' });
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    TrimFinalNewLinesParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, bulkEditService_1.IBulkEditService)
    ], TrimFinalNewLinesParticipant);
    let InsertFinalNewLineParticipant = class InsertFinalNewLineParticipant {
        constructor(configurationService, bulkEditService, editorService) {
            this.configurationService = configurationService;
            this.bulkEditService = bulkEditService;
            this.editorService = editorService;
        }
        async participate(workingCopy, context, progress, _token) {
            // waiting on notebook-specific override before this feature can sync with 'files.insertFinalNewline'
            // if (this.configurationService.getValue('files.insertFinalNewline')) {
            if (this.configurationService.getValue(notebookCommon_1.NotebookSetting.insertFinalNewline)) {
                await this.doInsertFinalNewLine(workingCopy, context.reason === 2 /* SaveReason.AUTO */, progress);
            }
        }
        async doInsertFinalNewLine(workingCopy, isAutoSaved, progress) {
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            const disposable = new lifecycle_1.DisposableStore();
            const notebook = workingCopy.model.notebookModel;
            // get initial cursor positions
            const activeCellEditor = getActiveCellCodeEditor(this.editorService);
            let selections;
            if (activeCellEditor) {
                selections = activeCellEditor.getSelections() ?? [];
            }
            try {
                const allCellEdits = await Promise.all(notebook.cells.map(async (cell) => {
                    if (cell.cellKind !== notebookCommon_1.CellKind.Code) {
                        return;
                    }
                    const lineCount = cell.textBuffer.getLineCount();
                    const lastLineIsEmptyOrWhitespace = cell.textBuffer.getLineFirstNonWhitespaceColumn(lineCount) === 0;
                    if (!lineCount || lastLineIsEmptyOrWhitespace) {
                        return;
                    }
                    return new bulkEditService_1.ResourceTextEdit(cell.uri, { range: new range_1.Range(lineCount + 1, cell.textBuffer.getLineLength(lineCount), lineCount + 1, cell.textBuffer.getLineLength(lineCount)), text: cell.textBuffer.getEOL() }, cell.textModel?.getVersionId());
                }));
                const filteredEdits = allCellEdits.filter(edit => edit !== undefined);
                await this.bulkEditService.apply(filteredEdits, { label: (0, nls_1.localize)('insertFinalNewLine', "Insert Final New Line"), code: 'undoredo.insertFinalNewLine' });
                // set cursor back to initial position after inserting final new line
                if (activeCellEditor && selections) {
                    activeCellEditor.setSelections(selections);
                }
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
    };
    InsertFinalNewLineParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, bulkEditService_1.IBulkEditService),
        __param(2, editorService_1.IEditorService)
    ], InsertFinalNewLineParticipant);
    let CodeActionOnSaveParticipant = class CodeActionOnSaveParticipant {
        constructor(configurationService, logService, workspaceTrustManagementService, languageFeaturesService, textModelService, instantiationService) {
            this.configurationService = configurationService;
            this.logService = logService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.languageFeaturesService = languageFeaturesService;
            this.textModelService = textModelService;
            this.instantiationService = instantiationService;
        }
        async participate(workingCopy, context, progress, token) {
            const nbDisposable = new lifecycle_1.DisposableStore();
            const isTrusted = this.workspaceTrustManagementService.isWorkspaceTrusted();
            if (!isTrusted) {
                return;
            }
            if (!workingCopy.model || !(workingCopy.model instanceof notebookEditorModel_1.NotebookFileWorkingCopyModel)) {
                return;
            }
            let saveTrigger = '';
            if (context.reason === 2 /* SaveReason.AUTO */) {
                // currently this won't happen, as vs/editor/contrib/codeAction/browser/codeAction.ts L#104 filters out codeactions on autosave. Just future-proofing
                // ? notebook CodeActions on autosave seems dangerous (perf-wise)
                // saveTrigger = 'always'; // TODO@Yoyokrazy, support during debt
                return undefined;
            }
            else if (context.reason === 1 /* SaveReason.EXPLICIT */) {
                saveTrigger = 'explicit';
            }
            else {
                // 	SaveReason.FOCUS_CHANGE, WINDOW_CHANGE need to be addressed when autosaves are enabled
                return undefined;
            }
            const notebookModel = workingCopy.model.notebookModel;
            const setting = this.configurationService.getValue(notebookCommon_1.NotebookSetting.codeActionsOnSave);
            if (!setting) {
                return undefined;
            }
            const settingItems = Array.isArray(setting)
                ? setting
                : Object.keys(setting).filter(x => setting[x]);
            if (!settingItems.length) {
                return undefined;
            }
            const allCodeActions = this.createCodeActionsOnSave(settingItems);
            const excludedActions = allCodeActions
                .filter(x => setting[x.value] === 'never' || setting[x.value] === false);
            const includedActions = allCodeActions
                .filter(x => setting[x.value] === saveTrigger || setting[x.value] === true);
            const editorCodeActionsOnSave = includedActions.filter(x => !types_1.CodeActionKind.Notebook.contains(x));
            const notebookCodeActionsOnSave = includedActions.filter(x => types_1.CodeActionKind.Notebook.contains(x));
            if (!editorCodeActionsOnSave.length && !notebookCodeActionsOnSave.length) {
                return undefined;
            }
            // prioritize `source.fixAll` code actions
            if (!Array.isArray(setting)) {
                editorCodeActionsOnSave.sort((a, b) => {
                    if (types_1.CodeActionKind.SourceFixAll.contains(a)) {
                        if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                            return 0;
                        }
                        return -1;
                    }
                    if (types_1.CodeActionKind.SourceFixAll.contains(b)) {
                        return 1;
                    }
                    return 0;
                });
            }
            // run notebook code actions
            progress.report({ message: (0, nls_1.localize)('notebookSaveParticipants.notebookCodeActions', "Running 'Notebook' code actions") });
            try {
                const cell = notebookModel.cells[0];
                const ref = await this.textModelService.createModelReference(cell.uri);
                nbDisposable.add(ref);
                const textEditorModel = ref.object.textEditorModel;
                await this.applyOnSaveActions(textEditorModel, notebookCodeActionsOnSave, excludedActions, progress, token);
            }
            catch {
                this.logService.error('Failed to apply notebook code action on save');
            }
            finally {
                progress.report({ increment: 100 });
                nbDisposable.dispose();
            }
            // run cell level code actions
            const disposable = new lifecycle_1.DisposableStore();
            progress.report({ message: (0, nls_1.localize)('notebookSaveParticipants.cellCodeActions', "Running 'Cell' code actions") });
            try {
                await Promise.all(notebookModel.cells.map(async (cell) => {
                    const ref = await this.textModelService.createModelReference(cell.uri);
                    disposable.add(ref);
                    const textEditorModel = ref.object.textEditorModel;
                    await this.applyOnSaveActions(textEditorModel, editorCodeActionsOnSave, excludedActions, progress, token);
                }));
            }
            catch {
                this.logService.error('Failed to apply code action on save');
            }
            finally {
                progress.report({ increment: 100 });
                disposable.dispose();
            }
        }
        createCodeActionsOnSave(settingItems) {
            const kinds = settingItems.map(x => new hierarchicalKind_1.HierarchicalKind(x));
            // Remove subsets
            return kinds.filter(kind => {
                return kinds.every(otherKind => otherKind.equals(kind) || !otherKind.contains(kind));
            });
        }
        async applyOnSaveActions(model, codeActionsOnSave, excludes, progress, token) {
            const getActionProgress = new class {
                constructor() {
                    this._names = new Set();
                }
                _report() {
                    progress.report({
                        message: (0, nls_1.localize)({ key: 'codeaction.get2', comment: ['[configure]({1}) is a link. Only translate `configure`. Do not change brackets and parentheses or {1}'] }, "Getting code actions from '{0}' ([configure]({1})).", [...this._names].map(name => `'${name}'`).join(', '), 'command:workbench.action.openSettings?%5B%22editor.codeActionsOnSave%22%5D')
                    });
                }
                report(provider) {
                    if (provider.displayName && !this._names.has(provider.displayName)) {
                        this._names.add(provider.displayName);
                        this._report();
                    }
                }
            };
            for (const codeActionKind of codeActionsOnSave) {
                const actionsToRun = await this.getActionsToRun(model, codeActionKind, excludes, getActionProgress, token);
                if (token.isCancellationRequested) {
                    actionsToRun.dispose();
                    return;
                }
                try {
                    for (const action of actionsToRun.validActions) {
                        const codeActionEdits = action.action.edit?.edits;
                        let breakFlag = false;
                        if (!action.action.kind?.startsWith('notebook')) {
                            for (const edit of codeActionEdits ?? []) {
                                const workspaceTextEdit = edit;
                                if (workspaceTextEdit.resource && (0, resources_1.isEqual)(workspaceTextEdit.resource, model.uri)) {
                                    continue;
                                }
                                else {
                                    // error -> applied to multiple resources
                                    breakFlag = true;
                                    break;
                                }
                            }
                        }
                        if (breakFlag) {
                            this.logService.warn('Failed to apply code action on save, applied to multiple resources.');
                            continue;
                        }
                        progress.report({ message: (0, nls_1.localize)('codeAction.apply', "Applying code action '{0}'.", action.action.title) });
                        await this.instantiationService.invokeFunction(codeAction_1.applyCodeAction, action, codeAction_1.ApplyCodeActionReason.OnSave, {}, token);
                        if (token.isCancellationRequested) {
                            return;
                        }
                    }
                }
                catch {
                    // Failure to apply a code action should not block other on save actions
                }
                finally {
                    actionsToRun.dispose();
                }
            }
        }
        getActionsToRun(model, codeActionKind, excludes, progress, token) {
            return (0, codeAction_1.getCodeActions)(this.languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), {
                type: 1 /* CodeActionTriggerType.Invoke */,
                triggerAction: types_1.CodeActionTriggerSource.OnSave,
                filter: { include: codeActionKind, excludes: excludes, includeSourceActions: true },
            }, progress, token);
        }
    };
    CodeActionOnSaveParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILogService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, instantiation_1.IInstantiationService)
    ], CodeActionOnSaveParticipant);
    function getActiveCellCodeEditor(editorService) {
        const activePane = editorService.activeEditorPane;
        const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(activePane);
        const activeCodeEditor = notebookEditor?.activeCodeEditor;
        return activeCodeEditor;
    }
    let SaveParticipantsContribution = class SaveParticipantsContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, workingCopyFileService) {
            super();
            this.instantiationService = instantiationService;
            this.workingCopyFileService = workingCopyFileService;
            this.registerSaveParticipants();
        }
        registerSaveParticipants() {
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(TrimWhitespaceParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(CodeActionOnSaveParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(FormatOnSaveParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(InsertFinalNewLineParticipant)));
            this._register(this.workingCopyFileService.addSaveParticipant(this.instantiationService.createInstance(TrimFinalNewLinesParticipant)));
        }
    };
    exports.SaveParticipantsContribution = SaveParticipantsContribution;
    exports.SaveParticipantsContribution = SaveParticipantsContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyFileService_1.IWorkingCopyFileService)
    ], SaveParticipantsContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(SaveParticipantsContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZVBhcnRpY2lwYW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL3NhdmVQYXJ0aWNpcGFudHMvc2F2ZVBhcnRpY2lwYW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQ2hHLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCO1FBQzVCLFlBQ3dDLG1CQUF5QyxFQUNyQyx1QkFBaUQsRUFDeEQsZ0JBQW1DLEVBQ3BDLGVBQWlDLEVBQzVCLG9CQUEyQztZQUo1Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3JDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDeEQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNwQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDNUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtRQUNoRixDQUFDO1FBRUwsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFnRSxFQUFFLE9BQXFELEVBQUUsUUFBa0MsRUFBRSxLQUF3QjtZQUN0TSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssWUFBWSxrREFBNEIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hGLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsTUFBTSw0QkFBb0IsRUFBRSxDQUFDO2dCQUN4QyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxnQ0FBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFFakQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEYsTUFBTSxVQUFVLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDekMsSUFBSSxDQUFDO2dCQUNKLE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsSUFBSSxFQUFDLEVBQUU7b0JBQ3RFLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDdkUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFcEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7b0JBRXpDLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSw4Q0FBcUMsRUFDOUQsSUFBSSxDQUFDLG1CQUFtQixFQUN4QixJQUFJLENBQUMsdUJBQXVCLEVBQzVCLEtBQUssRUFDTCxLQUFLLENBQUMsVUFBVSxFQUFFLEVBQ2xCLEtBQUssQ0FDTCxDQUFDO29CQUVGLE1BQU0sS0FBSyxHQUF1QixFQUFFLENBQUM7b0JBRXJDLElBQUksV0FBVyxFQUFFLENBQUM7d0JBQ2pCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxrQ0FBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3BHLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7b0JBRUQsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQSxZQUFZLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxJQUFJLEVBQUUseUJBQXlCLEdBQUcsQ0FBQyxDQUFDO1lBRTdKLENBQUM7b0JBQVMsQ0FBQztnQkFDVixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3BDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUEzREssdUJBQXVCO1FBRTFCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSwyQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFdBQUEsa0NBQWdCLENBQUE7UUFDaEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQU5sQix1QkFBdUIsQ0EyRDVCO0lBRUQsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBeUI7UUFFOUIsWUFDeUMsb0JBQTJDLEVBQ2xELGFBQTZCLEVBQzFCLGdCQUFtQyxFQUNwQyxlQUFpQztZQUg1Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMxQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3BDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtRQUNqRSxDQUFDO1FBRUwsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFnRSxFQUFFLE9BQXFELEVBQUUsUUFBa0MsRUFBRSxNQUF5QjtZQUN2TSxNQUFNLDRCQUE0QixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUsOEJBQThCLENBQUMsQ0FBQztZQUNqSCxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUsK0NBQStDLENBQUMsQ0FBQztZQUMzSCxJQUFJLDRCQUE0QixFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsTUFBTSw0QkFBb0IsRUFBRSxxQkFBcUIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN2SCxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxXQUFnRSxFQUFFLFdBQW9CLEVBQUUsdUJBQWdDLEVBQUUsUUFBa0M7WUFDbE0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFlBQVksa0RBQTRCLENBQUMsRUFBRSxDQUFDO2dCQUN4RixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO1lBQ2pELE1BQU0sZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXJFLElBQUksT0FBTyxHQUFlLEVBQUUsQ0FBQztZQUM3QixJQUFJLGFBQWEsR0FBZ0IsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQztnQkFDSixNQUFNLFlBQVksR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO29CQUN4RSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUsseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDckMsT0FBTyxFQUFFLENBQUM7b0JBQ1gsQ0FBQztvQkFFRCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3ZFLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3BCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDO29CQUV6QyxNQUFNLFlBQVksR0FBRyxDQUFDLGdCQUFnQixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQy9HLElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ2xCLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUM7d0JBQ3ZELElBQUksV0FBVyxFQUFFLENBQUM7NEJBQ2pCLE9BQU8sR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQywrQkFBK0I7NEJBQ2xGLE1BQU0sYUFBYSxHQUFHLHVDQUFrQixDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLHdCQUF3QixFQUFFLENBQUM7NEJBQzNGLElBQUksYUFBYSxFQUFFLENBQUM7Z0NBQ25CLEtBQUssSUFBSSxVQUFVLEdBQUcsYUFBYSxDQUFDLGVBQWUsRUFBRSxVQUFVLElBQUksYUFBYSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO29DQUM5RyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDNUUsQ0FBQzs0QkFDRixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxNQUFNLEdBQUcsR0FBRyxJQUFBLHNEQUFzQixFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztvQkFDNUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQzt3QkFDakIsT0FBTyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0I7b0JBQzVCLENBQUM7b0JBRUQsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxrQ0FBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0csQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBbUIsQ0FBQztnQkFDL0YsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsbUNBQW1DLENBQUMsRUFBRSxJQUFJLEVBQUUseUNBQXlDLEVBQUUsQ0FBQyxDQUFDO1lBRXRMLENBQUM7b0JBQVMsQ0FBQztnQkFDVixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3BDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFwRUsseUJBQXlCO1FBRzVCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSxtQ0FBaUIsQ0FBQTtRQUNqQixXQUFBLGtDQUFnQixDQUFBO09BTmIseUJBQXlCLENBb0U5QjtJQUVELElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTRCO1FBRWpDLFlBQ3lDLG9CQUEyQyxFQUNsRCxhQUE2QixFQUMzQixlQUFpQztZQUY1Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xELGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7UUFDakUsQ0FBQztRQUVMLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBZ0UsRUFBRSxPQUFxRCxFQUFFLFFBQWtDLEVBQUUsTUFBeUI7WUFDdk0sSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFVLHlCQUF5QixDQUFDLEVBQUUsQ0FBQztnQkFDNUUsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxNQUFNLDRCQUFvQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNGLENBQUM7UUFDRixDQUFDO1FBRUQ7O1dBRUc7UUFDSyxvQkFBb0IsQ0FBQyxVQUErQjtZQUMzRCxLQUFLLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxVQUFVLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hGLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLHdCQUF3QjtvQkFDeEIsT0FBTyxVQUFVLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDO1lBQ0Qsc0JBQXNCO1lBQ3RCLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxXQUFnRSxFQUFFLFdBQW9CLEVBQUUsUUFBa0M7WUFDM0osSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLFlBQVksa0RBQTRCLENBQUMsRUFBRSxDQUFDO2dCQUN4RixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO1lBQ2pELE1BQU0sZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXJFLElBQUksQ0FBQztnQkFDSixNQUFNLFlBQVksR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO29CQUN4RSxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUsseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzt3QkFDckMsT0FBTztvQkFDUixDQUFDO29CQUVELHlFQUF5RTtvQkFDekUsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7b0JBQzlCLE1BQU0sWUFBWSxHQUFHLENBQUMsZ0JBQWdCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFDL0csSUFBSSxXQUFXLElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ2pDLE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQzt3QkFDMUQsS0FBSyxNQUFNLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQzs0QkFDOUIscUJBQXFCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQzt3QkFDdkYsQ0FBQztvQkFDRixDQUFDO29CQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7b0JBQ25DLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUMvRCxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLHFCQUFxQixHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUN2RixJQUFJLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO3dCQUN0RCxPQUFPO29CQUNSLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxhQUFLLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxVQUFVLENBQUMsOEJBQThCLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDMUosSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQzt3QkFDN0IsT0FBTztvQkFDUixDQUFDO29CQUVELHVEQUF1RDtvQkFDdkQsT0FBTyxJQUFJLGtDQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksS0FBSyxTQUFTLENBQW1CLENBQUM7Z0JBQy9GLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLHNCQUFzQixDQUFDLEVBQUUsSUFBSSxFQUFFLDRCQUE0QixFQUFFLENBQUMsQ0FBQztZQUUxSixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNwQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBOUVLLDRCQUE0QjtRQUcvQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsa0NBQWdCLENBQUE7T0FMYiw0QkFBNEIsQ0E4RWpDO0lBRUQsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFFbEMsWUFDeUMsb0JBQTJDLEVBQ2hELGVBQWlDLEVBQ25DLGFBQTZCO1lBRnRCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDaEQsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtRQUMzRCxDQUFDO1FBRUwsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFnRSxFQUFFLE9BQXFELEVBQUUsUUFBa0MsRUFBRSxNQUF5QjtZQUN2TSxxR0FBcUc7WUFDckcsd0VBQXdFO1lBRXhFLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxnQ0FBZSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQztnQkFDckYsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxNQUFNLDRCQUFvQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVGLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLG9CQUFvQixDQUFDLFdBQWdFLEVBQUUsV0FBb0IsRUFBRSxRQUFrQztZQUM1SixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssWUFBWSxrREFBNEIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hGLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDekMsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFFakQsK0JBQStCO1lBQy9CLE1BQU0sZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3JFLElBQUksVUFBVSxDQUFDO1lBQ2YsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QixVQUFVLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ3JELENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxZQUFZLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtvQkFDeEUsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLHlCQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ3JDLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO29CQUNqRCxNQUFNLDJCQUEyQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsK0JBQStCLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUVyRyxJQUFJLENBQUMsU0FBUyxJQUFJLDJCQUEyQixFQUFFLENBQUM7d0JBQy9DLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxPQUFPLElBQUksa0NBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFNBQVMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDL08sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFSixNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBbUIsQ0FBQztnQkFDeEYsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxJQUFJLEVBQUUsNkJBQTZCLEVBQUUsQ0FBQyxDQUFDO2dCQUV6SixxRUFBcUU7Z0JBQ3JFLElBQUksZ0JBQWdCLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ3BDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDNUMsQ0FBQztZQUNGLENBQUM7b0JBQVMsQ0FBQztnQkFDVixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3BDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUE1REssNkJBQTZCO1FBR2hDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxrQ0FBZ0IsQ0FBQTtRQUNoQixXQUFBLDhCQUFjLENBQUE7T0FMWCw2QkFBNkIsQ0E0RGxDO0lBRUQsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBMkI7UUFDaEMsWUFDeUMsb0JBQTJDLEVBQ3JELFVBQXVCLEVBQ0YsK0JBQWlFLEVBQ3pFLHVCQUFpRCxFQUN4RCxnQkFBbUMsRUFDL0Isb0JBQTJDO1lBTDNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDckQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNGLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDekUsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN4RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQy9CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFFcEYsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBZ0UsRUFBRSxPQUFxRCxFQUFFLFFBQWtDLEVBQUUsS0FBd0I7WUFDdE0sTUFBTSxZQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDM0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLCtCQUErQixDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDNUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxZQUFZLGtEQUE0QixDQUFDLEVBQUUsQ0FBQztnQkFDeEYsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDckIsSUFBSSxPQUFPLENBQUMsTUFBTSw0QkFBb0IsRUFBRSxDQUFDO2dCQUN4QyxxSkFBcUo7Z0JBQ3JKLGlFQUFpRTtnQkFDakUsaUVBQWlFO2dCQUNqRSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO2lCQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sZ0NBQXdCLEVBQUUsQ0FBQztnQkFDbkQsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUMxQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsMEZBQTBGO2dCQUMxRixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFFdEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBdUMsZ0NBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVILElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsTUFBTSxZQUFZLEdBQWEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7Z0JBQ3BELENBQUMsQ0FBQyxPQUFPO2dCQUNULENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbEUsTUFBTSxlQUFlLEdBQUcsY0FBYztpQkFDcEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztZQUMxRSxNQUFNLGVBQWUsR0FBRyxjQUFjO2lCQUNwQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLFdBQVcsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBRTdFLE1BQU0sdUJBQXVCLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsc0JBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEcsTUFBTSx5QkFBeUIsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsc0JBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxRSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsMENBQTBDO1lBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDckMsSUFBSSxzQkFBYyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDN0MsSUFBSSxzQkFBYyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDN0MsT0FBTyxDQUFDLENBQUM7d0JBQ1YsQ0FBQzt3QkFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNYLENBQUM7b0JBQ0QsSUFBSSxzQkFBYyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDN0MsT0FBTyxDQUFDLENBQUM7b0JBQ1YsQ0FBQztvQkFDRCxPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCw0QkFBNEI7WUFDNUIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyw4Q0FBOEMsRUFBRSxpQ0FBaUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxSCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RSxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUV0QixNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQztnQkFFbkQsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLHlCQUF5QixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0csQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7b0JBQVMsQ0FBQztnQkFDVixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3BDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN4QixDQUFDO1lBRUQsOEJBQThCO1lBQzlCLE1BQU0sVUFBVSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3pDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsMENBQTBDLEVBQUUsNkJBQTZCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEgsSUFBSSxDQUFDO2dCQUNKLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsSUFBSSxFQUFDLEVBQUU7b0JBQ3RELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDdkUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFcEIsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7b0JBRW5ELE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSx1QkFBdUIsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMzRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUFDLE1BQU0sQ0FBQztnQkFDUixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1lBQzlELENBQUM7b0JBQVMsQ0FBQztnQkFDVixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3BDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztRQUVPLHVCQUF1QixDQUFDLFlBQStCO1lBQzlELE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLG1DQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFN0QsaUJBQWlCO1lBQ2pCLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDMUIsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxpQkFBOEMsRUFBRSxRQUFxQyxFQUFFLFFBQWtDLEVBQUUsS0FBd0I7WUFFdE0sTUFBTSxpQkFBaUIsR0FBRyxJQUFJO2dCQUFBO29CQUNyQixXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztnQkFpQnBDLENBQUM7Z0JBaEJRLE9BQU87b0JBQ2QsUUFBUSxDQUFDLE1BQU0sQ0FBQzt3QkFDZixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQ2hCLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxDQUFDLHVHQUF1RyxDQUFDLEVBQUUsRUFDOUkscURBQXFELEVBQ3JELENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDcEQsNEVBQTRFLENBQzVFO3FCQUNELENBQUMsQ0FBQztnQkFDSixDQUFDO2dCQUNELE1BQU0sQ0FBQyxRQUE0QjtvQkFDbEMsSUFBSSxRQUFRLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7d0JBQ3BFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFDdEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNoQixDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDO1lBRUYsS0FBSyxNQUFNLGNBQWMsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dCQUNoRCxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNHLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JBQ25DLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDdkIsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUksQ0FBQztvQkFDSixLQUFLLE1BQU0sTUFBTSxJQUFJLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDaEQsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDO3dCQUNsRCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7d0JBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQzs0QkFDakQsS0FBSyxNQUFNLElBQUksSUFBSSxlQUFlLElBQUksRUFBRSxFQUFFLENBQUM7Z0NBQzFDLE1BQU0saUJBQWlCLEdBQUcsSUFBMEIsQ0FBQztnQ0FDckQsSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLElBQUksSUFBQSxtQkFBTyxFQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQ0FDbEYsU0FBUztnQ0FDVixDQUFDO3FDQUFNLENBQUM7b0NBQ1AseUNBQXlDO29DQUN6QyxTQUFTLEdBQUcsSUFBSSxDQUFDO29DQUNqQixNQUFNO2dDQUNQLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO3dCQUNELElBQUksU0FBUyxFQUFFLENBQUM7NEJBQ2YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMscUVBQXFFLENBQUMsQ0FBQzs0QkFDNUYsU0FBUzt3QkFDVixDQUFDO3dCQUNELFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsNkJBQTZCLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQy9HLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw0QkFBZSxFQUFFLE1BQU0sRUFBRSxrQ0FBcUIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNqSCxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDOzRCQUNuQyxPQUFPO3dCQUNSLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO2dCQUFDLE1BQU0sQ0FBQztvQkFDUix3RUFBd0U7Z0JBQ3pFLENBQUM7d0JBQVMsQ0FBQztvQkFDVixZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3hCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLGVBQWUsQ0FBQyxLQUFpQixFQUFFLGNBQWdDLEVBQUUsUUFBcUMsRUFBRSxRQUF1QyxFQUFFLEtBQXdCO1lBQ3BMLE9BQU8sSUFBQSwyQkFBYyxFQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3hHLElBQUksc0NBQThCO2dCQUNsQyxhQUFhLEVBQUUsK0JBQXVCLENBQUMsTUFBTTtnQkFDN0MsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRTthQUNuRixFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyQixDQUFDO0tBQ0QsQ0FBQTtJQWhNSywyQkFBMkI7UUFFOUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLGlEQUFnQyxDQUFBO1FBQ2hDLFdBQUEsMkNBQXdCLENBQUE7UUFDeEIsV0FBQSxtQ0FBaUIsQ0FBQTtRQUNqQixXQUFBLHFDQUFxQixDQUFBO09BUGxCLDJCQUEyQixDQWdNaEM7SUFFRCxTQUFTLHVCQUF1QixDQUFDLGFBQTZCO1FBQzdELE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztRQUNsRCxNQUFNLGNBQWMsR0FBRyxJQUFBLGlEQUErQixFQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxFQUFFLGdCQUFnQixDQUFDO1FBQzFELE9BQU8sZ0JBQWdCLENBQUM7SUFDekIsQ0FBQztJQUVNLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7UUFDM0QsWUFDeUMsb0JBQTJDLEVBQ3pDLHNCQUErQztZQUV6RixLQUFLLEVBQUUsQ0FBQztZQUhnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3pDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFHekYsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDakMsQ0FBQztRQUVPLHdCQUF3QjtZQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEksQ0FBQztLQUNELENBQUE7SUFoQlksb0VBQTRCOzJDQUE1Qiw0QkFBNEI7UUFFdEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGdEQUF1QixDQUFBO09BSGIsNEJBQTRCLENBZ0J4QztJQUVELE1BQU0sOEJBQThCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFnQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hJLDhCQUE4QixDQUFDLDZCQUE2QixDQUFDLDRCQUE0QixrQ0FBMEIsQ0FBQyJ9