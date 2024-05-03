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
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/codeEditorService", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/browser/codeAction", "vs/editor/contrib/codeAction/common/types", "vs/editor/contrib/format/browser/format", "vs/editor/contrib/snippet/browser/snippetController2", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/format/browser/formatModified", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, hierarchicalKind_1, lifecycle_1, strings, editorBrowser_1, codeEditorService_1, trimTrailingWhitespaceCommand_1, editOperation_1, position_1, range_1, languageFeatures_1, codeAction_1, types_1, format_1, snippetController2_1, nls_1, configuration_1, instantiation_1, progress_1, platform_1, contributions_1, formatModified_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveParticipantsContribution = exports.TrimFinalNewLinesParticipant = exports.FinalNewLineParticipant = exports.TrimWhitespaceParticipant = void 0;
    let TrimWhitespaceParticipant = class TrimWhitespaceParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, context) {
            if (!model.textEditorModel) {
                return;
            }
            const trimTrailingWhitespaceOption = this.configurationService.getValue('files.trimTrailingWhitespace', { overrideIdentifier: model.textEditorModel.getLanguageId(), resource: model.resource });
            const trimInRegexAndStrings = this.configurationService.getValue('files.trimTrailingWhitespaceInRegexAndStrings', { overrideIdentifier: model.textEditorModel.getLanguageId(), resource: model.resource });
            if (trimTrailingWhitespaceOption) {
                this.doTrimTrailingWhitespace(model.textEditorModel, context.reason === 2 /* SaveReason.AUTO */, trimInRegexAndStrings);
            }
        }
        doTrimTrailingWhitespace(model, isAutoSaved, trimInRegexesAndStrings) {
            let prevSelection = [];
            let cursors = [];
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                // Find `prevSelection` in any case do ensure a good undo stack when pushing the edit
                // Collect active cursors in `cursors` only if `isAutoSaved` to avoid having the cursors jump
                prevSelection = editor.getSelections();
                if (isAutoSaved) {
                    cursors = prevSelection.map(s => s.getPosition());
                    const snippetsRange = snippetController2_1.SnippetController2.get(editor)?.getSessionEnclosingRange();
                    if (snippetsRange) {
                        for (let lineNumber = snippetsRange.startLineNumber; lineNumber <= snippetsRange.endLineNumber; lineNumber++) {
                            cursors.push(new position_1.Position(lineNumber, model.getLineMaxColumn(lineNumber)));
                        }
                    }
                }
            }
            const ops = (0, trimTrailingWhitespaceCommand_1.trimTrailingWhitespace)(model, cursors, trimInRegexesAndStrings);
            if (!ops.length) {
                return; // Nothing to do
            }
            model.pushEditOperations(prevSelection, ops, (_edits) => prevSelection);
        }
    };
    exports.TrimWhitespaceParticipant = TrimWhitespaceParticipant;
    exports.TrimWhitespaceParticipant = TrimWhitespaceParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], TrimWhitespaceParticipant);
    function findEditor(model, codeEditorService) {
        let candidate = null;
        if (model.isAttachedToEditor()) {
            for (const editor of codeEditorService.listCodeEditors()) {
                if (editor.hasModel() && editor.getModel() === model) {
                    if (editor.hasTextFocus()) {
                        return editor; // favour focused editor if there are multiple
                    }
                    candidate = editor;
                }
            }
        }
        return candidate;
    }
    let FinalNewLineParticipant = class FinalNewLineParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, context) {
            if (!model.textEditorModel) {
                return;
            }
            if (this.configurationService.getValue('files.insertFinalNewline', { overrideIdentifier: model.textEditorModel.getLanguageId(), resource: model.resource })) {
                this.doInsertFinalNewLine(model.textEditorModel);
            }
        }
        doInsertFinalNewLine(model) {
            const lineCount = model.getLineCount();
            const lastLine = model.getLineContent(lineCount);
            const lastLineIsEmptyOrWhitespace = strings.lastNonWhitespaceIndex(lastLine) === -1;
            if (!lineCount || lastLineIsEmptyOrWhitespace) {
                return;
            }
            const edits = [editOperation_1.EditOperation.insert(new position_1.Position(lineCount, model.getLineMaxColumn(lineCount)), model.getEOL())];
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                editor.executeEdits('insertFinalNewLine', edits, editor.getSelections());
            }
            else {
                model.pushEditOperations([], edits, () => null);
            }
        }
    };
    exports.FinalNewLineParticipant = FinalNewLineParticipant;
    exports.FinalNewLineParticipant = FinalNewLineParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], FinalNewLineParticipant);
    let TrimFinalNewLinesParticipant = class TrimFinalNewLinesParticipant {
        constructor(configurationService, codeEditorService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            // Nothing
        }
        async participate(model, context) {
            if (!model.textEditorModel) {
                return;
            }
            if (this.configurationService.getValue('files.trimFinalNewlines', { overrideIdentifier: model.textEditorModel.getLanguageId(), resource: model.resource })) {
                this.doTrimFinalNewLines(model.textEditorModel, context.reason === 2 /* SaveReason.AUTO */);
            }
        }
        /**
         * returns 0 if the entire file is empty
         */
        findLastNonEmptyLine(model) {
            for (let lineNumber = model.getLineCount(); lineNumber >= 1; lineNumber--) {
                const lineLength = model.getLineLength(lineNumber);
                if (lineLength > 0) {
                    // this line has content
                    return lineNumber;
                }
            }
            // no line has content
            return 0;
        }
        doTrimFinalNewLines(model, isAutoSaved) {
            const lineCount = model.getLineCount();
            // Do not insert new line if file does not end with new line
            if (lineCount === 1) {
                return;
            }
            let prevSelection = [];
            let cannotTouchLineNumber = 0;
            const editor = findEditor(model, this.codeEditorService);
            if (editor) {
                prevSelection = editor.getSelections();
                if (isAutoSaved) {
                    for (let i = 0, len = prevSelection.length; i < len; i++) {
                        const positionLineNumber = prevSelection[i].positionLineNumber;
                        if (positionLineNumber > cannotTouchLineNumber) {
                            cannotTouchLineNumber = positionLineNumber;
                        }
                    }
                }
            }
            const lastNonEmptyLine = this.findLastNonEmptyLine(model);
            const deleteFromLineNumber = Math.max(lastNonEmptyLine + 1, cannotTouchLineNumber + 1);
            const deletionRange = model.validateRange(new range_1.Range(deleteFromLineNumber, 1, lineCount, model.getLineMaxColumn(lineCount)));
            if (deletionRange.isEmpty()) {
                return;
            }
            model.pushEditOperations(prevSelection, [editOperation_1.EditOperation.delete(deletionRange)], _edits => prevSelection);
            editor?.setSelections(prevSelection);
        }
    };
    exports.TrimFinalNewLinesParticipant = TrimFinalNewLinesParticipant;
    exports.TrimFinalNewLinesParticipant = TrimFinalNewLinesParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], TrimFinalNewLinesParticipant);
    let FormatOnSaveParticipant = class FormatOnSaveParticipant {
        constructor(configurationService, codeEditorService, instantiationService) {
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            this.instantiationService = instantiationService;
            // Nothing
        }
        async participate(model, context, progress, token) {
            if (!model.textEditorModel) {
                return;
            }
            if (context.reason === 2 /* SaveReason.AUTO */) {
                return undefined;
            }
            const textEditorModel = model.textEditorModel;
            const overrides = { overrideIdentifier: textEditorModel.getLanguageId(), resource: textEditorModel.uri };
            const nestedProgress = new progress_1.Progress(provider => {
                progress.report({
                    message: (0, nls_1.localize)({ key: 'formatting2', comment: ['[configure]({1}) is a link. Only translate `configure`. Do not change brackets and parentheses or {1}'] }, "Running '{0}' Formatter ([configure]({1})).", provider.displayName || provider.extensionId && provider.extensionId.value || '???', 'command:workbench.action.openSettings?%5B%22editor.formatOnSave%22%5D')
                });
            });
            const enabled = this.configurationService.getValue('editor.formatOnSave', overrides);
            if (!enabled) {
                return undefined;
            }
            const editorOrModel = findEditor(textEditorModel, this.codeEditorService) || textEditorModel;
            const mode = this.configurationService.getValue('editor.formatOnSaveMode', overrides);
            if (mode === 'file') {
                await this.instantiationService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editorOrModel, 2 /* FormattingMode.Silent */, nestedProgress, token);
            }
            else {
                const ranges = await this.instantiationService.invokeFunction(formatModified_1.getModifiedRanges, (0, editorBrowser_1.isCodeEditor)(editorOrModel) ? editorOrModel.getModel() : editorOrModel);
                if (ranges === null && mode === 'modificationsIfAvailable') {
                    // no SCM, fallback to formatting the whole file iff wanted
                    await this.instantiationService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editorOrModel, 2 /* FormattingMode.Silent */, nestedProgress, token);
                }
                else if (ranges) {
                    // formatted modified ranges
                    await this.instantiationService.invokeFunction(format_1.formatDocumentRangesWithSelectedProvider, editorOrModel, ranges, 2 /* FormattingMode.Silent */, nestedProgress, token, false);
                }
            }
        }
    };
    FormatOnSaveParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, instantiation_1.IInstantiationService)
    ], FormatOnSaveParticipant);
    let CodeActionOnSaveParticipant = class CodeActionOnSaveParticipant {
        constructor(configurationService, instantiationService, languageFeaturesService) {
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.languageFeaturesService = languageFeaturesService;
        }
        async participate(model, context, progress, token) {
            if (!model.textEditorModel) {
                return;
            }
            const textEditorModel = model.textEditorModel;
            const settingsOverrides = { overrideIdentifier: textEditorModel.getLanguageId(), resource: textEditorModel.uri };
            // Convert boolean values to strings
            const setting = this.configurationService.getValue('editor.codeActionsOnSave', settingsOverrides);
            if (!setting) {
                return undefined;
            }
            if (context.reason === 2 /* SaveReason.AUTO */) {
                return undefined;
            }
            if (context.reason !== 1 /* SaveReason.EXPLICIT */ && Array.isArray(setting)) {
                return undefined;
            }
            const settingItems = Array.isArray(setting)
                ? setting
                : Object.keys(setting).filter(x => setting[x] && setting[x] !== 'never');
            const codeActionsOnSave = this.createCodeActionsOnSave(settingItems);
            if (!Array.isArray(setting)) {
                codeActionsOnSave.sort((a, b) => {
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
            if (!codeActionsOnSave.length) {
                return undefined;
            }
            const excludedActions = Array.isArray(setting)
                ? []
                : Object.keys(setting)
                    .filter(x => setting[x] === 'never' || false)
                    .map(x => new hierarchicalKind_1.HierarchicalKind(x));
            progress.report({ message: (0, nls_1.localize)('codeaction', "Quick Fixes") });
            const filteredSaveList = Array.isArray(setting) ? codeActionsOnSave : codeActionsOnSave.filter(x => setting[x.value] === 'always' || ((setting[x.value] === 'explicit' || setting[x.value] === true) && context.reason === 1 /* SaveReason.EXPLICIT */));
            await this.applyOnSaveActions(textEditorModel, filteredSaveList, excludedActions, progress, token);
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
                type: 2 /* CodeActionTriggerType.Auto */,
                triggerAction: types_1.CodeActionTriggerSource.OnSave,
                filter: { include: codeActionKind, excludes: excludes, includeSourceActions: true },
            }, progress, token);
        }
    };
    CodeActionOnSaveParticipant = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], CodeActionOnSaveParticipant);
    let SaveParticipantsContribution = class SaveParticipantsContribution extends lifecycle_1.Disposable {
        constructor(instantiationService, textFileService) {
            super();
            this.instantiationService = instantiationService;
            this.textFileService = textFileService;
            this.registerSaveParticipants();
        }
        registerSaveParticipants() {
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(TrimWhitespaceParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(CodeActionOnSaveParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(FormatOnSaveParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(FinalNewLineParticipant)));
            this._register(this.textFileService.files.addSaveParticipant(this.instantiationService.createInstance(TrimFinalNewLinesParticipant)));
        }
    };
    exports.SaveParticipantsContribution = SaveParticipantsContribution;
    exports.SaveParticipantsContribution = SaveParticipantsContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, textfiles_1.ITextFileService)
    ], SaveParticipantsContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(SaveParticipantsContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZVBhcnRpY2lwYW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9icm93c2VyL3NhdmVQYXJ0aWNpcGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0N6RixJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUF5QjtRQUVyQyxZQUN5QyxvQkFBMkMsRUFDOUMsaUJBQXFDO1lBRGxDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUUxRSxVQUFVO1FBQ1gsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBMkIsRUFBRSxPQUF3QztZQUN0RixJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM1QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sNEJBQTRCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSw4QkFBOEIsRUFBRSxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzFNLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSwrQ0FBK0MsRUFBRSxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsYUFBYSxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BOLElBQUksNEJBQTRCLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFD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