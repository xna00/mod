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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/shiftCommand", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/model", "vs/editor/contrib/indentation/common/indentUtils", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/editor/common/languages/autoIndent", "../common/indentation"], function (require, exports, lifecycle_1, strings, editorExtensions_1, shiftCommand_1, range_1, editorContextKeys_1, languageConfigurationRegistry_1, model_1, indentUtils, nls, quickInput_1, autoIndent_1, indentation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndentationToTabsCommand = exports.IndentationToSpacesCommand = exports.AutoIndentOnPaste = exports.AutoIndentOnPasteCommand = exports.ReindentSelectedLinesAction = exports.ReindentLinesAction = exports.DetectIndentation = exports.ChangeTabDisplaySize = exports.IndentUsingSpaces = exports.IndentUsingTabs = exports.ChangeIndentationSizeAction = exports.IndentationToTabsAction = exports.IndentationToSpacesAction = void 0;
    class IndentationToSpacesAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.indentationToSpaces'; }
        constructor() {
            super({
                id: IndentationToSpacesAction.ID,
                label: nls.localize('indentationToSpaces', "Convert Indentation to Spaces"),
                alias: 'Convert Indentation to Spaces',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const modelOpts = model.getOptions();
            const selection = editor.getSelection();
            if (!selection) {
                return;
            }
            const command = new IndentationToSpacesCommand(selection, modelOpts.tabSize);
            editor.pushUndoStop();
            editor.executeCommands(this.id, [command]);
            editor.pushUndoStop();
            model.updateOptions({
                insertSpaces: true
            });
        }
    }
    exports.IndentationToSpacesAction = IndentationToSpacesAction;
    class IndentationToTabsAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.indentationToTabs'; }
        constructor() {
            super({
                id: IndentationToTabsAction.ID,
                label: nls.localize('indentationToTabs', "Convert Indentation to Tabs"),
                alias: 'Convert Indentation to Tabs',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const modelOpts = model.getOptions();
            const selection = editor.getSelection();
            if (!selection) {
                return;
            }
            const command = new IndentationToTabsCommand(selection, modelOpts.tabSize);
            editor.pushUndoStop();
            editor.executeCommands(this.id, [command]);
            editor.pushUndoStop();
            model.updateOptions({
                insertSpaces: false
            });
        }
    }
    exports.IndentationToTabsAction = IndentationToTabsAction;
    class ChangeIndentationSizeAction extends editorExtensions_1.EditorAction {
        constructor(insertSpaces, displaySizeOnly, opts) {
            super(opts);
            this.insertSpaces = insertSpaces;
            this.displaySizeOnly = displaySizeOnly;
        }
        run(accessor, editor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const modelService = accessor.get(model_1.IModelService);
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const creationOpts = modelService.getCreationOptions(model.getLanguageId(), model.uri, model.isForSimpleWidget);
            const modelOpts = model.getOptions();
            const picks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
                id: n.toString(),
                label: n.toString(),
                // add description for tabSize value set in the configuration
                description: (n === creationOpts.tabSize && n === modelOpts.tabSize
                    ? nls.localize('configuredTabSize', "Configured Tab Size")
                    : n === creationOpts.tabSize
                        ? nls.localize('defaultTabSize', "Default Tab Size")
                        : n === modelOpts.tabSize
                            ? nls.localize('currentTabSize', "Current Tab Size")
                            : undefined)
            }));
            // auto focus the tabSize set for the current editor
            const autoFocusIndex = Math.min(model.getOptions().tabSize - 1, 7);
            setTimeout(() => {
                quickInputService.pick(picks, { placeHolder: nls.localize({ key: 'selectTabWidth', comment: ['Tab corresponds to the tab key'] }, "Select Tab Size for Current File"), activeItem: picks[autoFocusIndex] }).then(pick => {
                    if (pick) {
                        if (model && !model.isDisposed()) {
                            const pickedVal = parseInt(pick.label, 10);
                            if (this.displaySizeOnly) {
                                model.updateOptions({
                                    tabSize: pickedVal
                                });
                            }
                            else {
                                model.updateOptions({
                                    tabSize: pickedVal,
                                    indentSize: pickedVal,
                                    insertSpaces: this.insertSpaces
                                });
                            }
                        }
                    }
                });
            }, 50 /* quick input is sensitive to being opened so soon after another */);
        }
    }
    exports.ChangeIndentationSizeAction = ChangeIndentationSizeAction;
    class IndentUsingTabs extends ChangeIndentationSizeAction {
        static { this.ID = 'editor.action.indentUsingTabs'; }
        constructor() {
            super(false, false, {
                id: IndentUsingTabs.ID,
                label: nls.localize('indentUsingTabs', "Indent Using Tabs"),
                alias: 'Indent Using Tabs',
                precondition: undefined
            });
        }
    }
    exports.IndentUsingTabs = IndentUsingTabs;
    class IndentUsingSpaces extends ChangeIndentationSizeAction {
        static { this.ID = 'editor.action.indentUsingSpaces'; }
        constructor() {
            super(true, false, {
                id: IndentUsingSpaces.ID,
                label: nls.localize('indentUsingSpaces', "Indent Using Spaces"),
                alias: 'Indent Using Spaces',
                precondition: undefined
            });
        }
    }
    exports.IndentUsingSpaces = IndentUsingSpaces;
    class ChangeTabDisplaySize extends ChangeIndentationSizeAction {
        static { this.ID = 'editor.action.changeTabDisplaySize'; }
        constructor() {
            super(true, true, {
                id: ChangeTabDisplaySize.ID,
                label: nls.localize('changeTabDisplaySize', "Change Tab Display Size"),
                alias: 'Change Tab Display Size',
                precondition: undefined
            });
        }
    }
    exports.ChangeTabDisplaySize = ChangeTabDisplaySize;
    class DetectIndentation extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.detectIndentation'; }
        constructor() {
            super({
                id: DetectIndentation.ID,
                label: nls.localize('detectIndentation', "Detect Indentation from Content"),
                alias: 'Detect Indentation from Content',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const modelService = accessor.get(model_1.IModelService);
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const creationOpts = modelService.getCreationOptions(model.getLanguageId(), model.uri, model.isForSimpleWidget);
            model.detectIndentation(creationOpts.insertSpaces, creationOpts.tabSize);
        }
    }
    exports.DetectIndentation = DetectIndentation;
    class ReindentLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.reindentlines',
                label: nls.localize('editor.reindentlines', "Reindent Lines"),
                alias: 'Reindent Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const edits = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            if (edits.length > 0) {
                editor.pushUndoStop();
                editor.executeEdits(this.id, edits);
                editor.pushUndoStop();
            }
        }
    }
    exports.ReindentLinesAction = ReindentLinesAction;
    class ReindentSelectedLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.reindentselectedlines',
                label: nls.localize('editor.reindentselectedlines', "Reindent Selected Lines"),
                alias: 'Reindent Selected Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const model = editor.getModel();
            if (!model) {
                return;
            }
            const selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            const edits = [];
            for (const selection of selections) {
                let startLineNumber = selection.startLineNumber;
                let endLineNumber = selection.endLineNumber;
                if (startLineNumber !== endLineNumber && selection.endColumn === 1) {
                    endLineNumber--;
                }
                if (startLineNumber === 1) {
                    if (startLineNumber === endLineNumber) {
                        continue;
                    }
                }
                else {
                    startLineNumber--;
                }
                const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, startLineNumber, endLineNumber);
                edits.push(...editOperations);
            }
            if (edits.length > 0) {
                editor.pushUndoStop();
                editor.executeEdits(this.id, edits);
                editor.pushUndoStop();
            }
        }
    }
    exports.ReindentSelectedLinesAction = ReindentSelectedLinesAction;
    class AutoIndentOnPasteCommand {
        constructor(edits, initialSelection) {
            this._initialSelection = initialSelection;
            this._edits = [];
            this._selectionId = null;
            for (const edit of edits) {
                if (edit.range && typeof edit.text === 'string') {
                    this._edits.push(edit);
                }
            }
        }
        getEditOperations(model, builder) {
            for (const edit of this._edits) {
                builder.addEditOperation(range_1.Range.lift(edit.range), edit.text);
            }
            let selectionIsSet = false;
            if (Array.isArray(this._edits) && this._edits.length === 1 && this._initialSelection.isEmpty()) {
                if (this._edits[0].range.startColumn === this._initialSelection.endColumn &&
                    this._edits[0].range.startLineNumber === this._initialSelection.endLineNumber) {
                    selectionIsSet = true;
                    this._selectionId = builder.trackSelection(this._initialSelection, true);
                }
                else if (this._edits[0].range.endColumn === this._initialSelection.startColumn &&
                    this._edits[0].range.endLineNumber === this._initialSelection.startLineNumber) {
                    selectionIsSet = true;
                    this._selectionId = builder.trackSelection(this._initialSelection, false);
                }
            }
            if (!selectionIsSet) {
                this._selectionId = builder.trackSelection(this._initialSelection);
            }
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        }
    }
    exports.AutoIndentOnPasteCommand = AutoIndentOnPasteCommand;
    let AutoIndentOnPaste = class AutoIndentOnPaste {
        static { this.ID = 'editor.contrib.autoIndentOnPaste'; }
        constructor(editor, _languageConfigurationService) {
            this.editor = editor;
            this._languageConfigurationService = _languageConfigurationService;
            this.callOnDispose = new lifecycle_1.DisposableStore();
            this.callOnModel = new lifecycle_1.DisposableStore();
            this.callOnDispose.add(editor.onDidChangeConfiguration(() => this.update()));
            this.callOnDispose.add(editor.onDidChangeModel(() => this.update()));
            this.callOnDispose.add(editor.onDidChangeModelLanguage(() => this.update()));
        }
        update() {
            // clean up
            this.callOnModel.clear();
            // we are disabled
            if (this.editor.getOption(12 /* EditorOption.autoIndent */) < 4 /* EditorAutoIndentStrategy.Full */ || this.editor.getOption(55 /* EditorOption.formatOnPaste */)) {
                return;
            }
            // no model
            if (!this.editor.hasModel()) {
                return;
            }
            this.callOnModel.add(this.editor.onDidPaste(({ range }) => {
                this.trigger(range);
            }));
        }
        trigger(range) {
            const selections = this.editor.getSelections();
            if (selections === null || selections.length > 1) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (!model.tokenization.isCheapToTokenize(range.getStartPosition().lineNumber)) {
                return;
            }
            const autoIndent = this.editor.getOption(12 /* EditorOption.autoIndent */);
            const { tabSize, indentSize, insertSpaces } = model.getOptions();
            const textEdits = [];
            const indentConverter = {
                shiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.shiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                },
                unshiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.unshiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                }
            };
            let startLineNumber = range.startLineNumber;
            while (startLineNumber <= range.endLineNumber) {
                if (this.shouldIgnoreLine(model, startLineNumber)) {
                    startLineNumber++;
                    continue;
                }
                break;
            }
            if (startLineNumber > range.endLineNumber) {
                return;
            }
            let firstLineText = model.getLineContent(startLineNumber);
            if (!/\S/.test(firstLineText.substring(0, range.startColumn - 1))) {
                const indentOfFirstLine = (0, autoIndent_1.getGoodIndentForLine)(autoIndent, model, model.getLanguageId(), startLineNumber, indentConverter, this._languageConfigurationService);
                if (indentOfFirstLine !== null) {
                    const oldIndentation = strings.getLeadingWhitespace(firstLineText);
                    const newSpaceCnt = indentUtils.getSpaceCnt(indentOfFirstLine, tabSize);
                    const oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                    if (newSpaceCnt !== oldSpaceCnt) {
                        const newIndent = indentUtils.generateIndent(newSpaceCnt, tabSize, insertSpaces);
                        textEdits.push({
                            range: new range_1.Range(startLineNumber, 1, startLineNumber, oldIndentation.length + 1),
                            text: newIndent
                        });
                        firstLineText = newIndent + firstLineText.substr(oldIndentation.length);
                    }
                    else {
                        const indentMetadata = (0, autoIndent_1.getIndentMetadata)(model, startLineNumber, this._languageConfigurationService);
                        if (indentMetadata === 0 || indentMetadata === 8 /* IndentConsts.UNINDENT_MASK */) {
                            // we paste content into a line where only contains whitespaces
                            // after pasting, the indentation of the first line is already correct
                            // the first line doesn't match any indentation rule
                            // then no-op.
                            return;
                        }
                    }
                }
            }
            const firstLineNumber = startLineNumber;
            // ignore empty or ignored lines
            while (startLineNumber < range.endLineNumber) {
                if (!/\S/.test(model.getLineContent(startLineNumber + 1))) {
                    startLineNumber++;
                    continue;
                }
                break;
            }
            if (startLineNumber !== range.endLineNumber) {
                const virtualModel = {
                    tokenization: {
                        getLineTokens: (lineNumber) => {
                            return model.tokenization.getLineTokens(lineNumber);
                        },
                        getLanguageId: () => {
                            return model.getLanguageId();
                        },
                        getLanguageIdAtPosition: (lineNumber, column) => {
                            return model.getLanguageIdAtPosition(lineNumber, column);
                        },
                    },
                    getLineContent: (lineNumber) => {
                        if (lineNumber === firstLineNumber) {
                            return firstLineText;
                        }
                        else {
                            return model.getLineContent(lineNumber);
                        }
                    }
                };
                const indentOfSecondLine = (0, autoIndent_1.getGoodIndentForLine)(autoIndent, virtualModel, model.getLanguageId(), startLineNumber + 1, indentConverter, this._languageConfigurationService);
                if (indentOfSecondLine !== null) {
                    const newSpaceCntOfSecondLine = indentUtils.getSpaceCnt(indentOfSecondLine, tabSize);
                    const oldSpaceCntOfSecondLine = indentUtils.getSpaceCnt(strings.getLeadingWhitespace(model.getLineContent(startLineNumber + 1)), tabSize);
                    if (newSpaceCntOfSecondLine !== oldSpaceCntOfSecondLine) {
                        const spaceCntOffset = newSpaceCntOfSecondLine - oldSpaceCntOfSecondLine;
                        for (let i = startLineNumber + 1; i <= range.endLineNumber; i++) {
                            const lineContent = model.getLineContent(i);
                            const originalIndent = strings.getLeadingWhitespace(lineContent);
                            const originalSpacesCnt = indentUtils.getSpaceCnt(originalIndent, tabSize);
                            const newSpacesCnt = originalSpacesCnt + spaceCntOffset;
                            const newIndent = indentUtils.generateIndent(newSpacesCnt, tabSize, insertSpaces);
                            if (newIndent !== originalIndent) {
                                textEdits.push({
                                    range: new range_1.Range(i, 1, i, originalIndent.length + 1),
                                    text: newIndent
                                });
                            }
                        }
                    }
                }
            }
            if (textEdits.length > 0) {
                this.editor.pushUndoStop();
                const cmd = new AutoIndentOnPasteCommand(textEdits, this.editor.getSelection());
                this.editor.executeCommand('autoIndentOnPaste', cmd);
                this.editor.pushUndoStop();
            }
        }
        shouldIgnoreLine(model, lineNumber) {
            model.tokenization.forceTokenization(lineNumber);
            const nonWhitespaceColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
            if (nonWhitespaceColumn === 0) {
                return true;
            }
            const tokens = model.tokenization.getLineTokens(lineNumber);
            if (tokens.getCount() > 0) {
                const firstNonWhitespaceTokenIndex = tokens.findTokenIndexAtOffset(nonWhitespaceColumn);
                if (firstNonWhitespaceTokenIndex >= 0 && tokens.getStandardTokenType(firstNonWhitespaceTokenIndex) === 1 /* StandardTokenType.Comment */) {
                    return true;
                }
            }
            return false;
        }
        dispose() {
            this.callOnDispose.dispose();
            this.callOnModel.dispose();
        }
    };
    exports.AutoIndentOnPaste = AutoIndentOnPaste;
    exports.AutoIndentOnPaste = AutoIndentOnPaste = __decorate([
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], AutoIndentOnPaste);
    function getIndentationEditOperations(model, builder, tabSize, tabsToSpaces) {
        if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
            // Model is empty
            return;
        }
        let spaces = '';
        for (let i = 0; i < tabSize; i++) {
            spaces += ' ';
        }
        const spacesRegExp = new RegExp(spaces, 'gi');
        for (let lineNumber = 1, lineCount = model.getLineCount(); lineNumber <= lineCount; lineNumber++) {
            let lastIndentationColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
            if (lastIndentationColumn === 0) {
                lastIndentationColumn = model.getLineMaxColumn(lineNumber);
            }
            if (lastIndentationColumn === 1) {
                continue;
            }
            const originalIndentationRange = new range_1.Range(lineNumber, 1, lineNumber, lastIndentationColumn);
            const originalIndentation = model.getValueInRange(originalIndentationRange);
            const newIndentation = (tabsToSpaces
                ? originalIndentation.replace(/\t/ig, spaces)
                : originalIndentation.replace(spacesRegExp, '\t'));
            builder.addEditOperation(originalIndentationRange, newIndentation);
        }
    }
    class IndentationToSpacesCommand {
        constructor(selection, tabSize) {
            this.selection = selection;
            this.tabSize = tabSize;
            this.selectionId = null;
        }
        getEditOperations(model, builder) {
            this.selectionId = builder.trackSelection(this.selection);
            getIndentationEditOperations(model, builder, this.tabSize, true);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this.selectionId);
        }
    }
    exports.IndentationToSpacesCommand = IndentationToSpacesCommand;
    class IndentationToTabsCommand {
        constructor(selection, tabSize) {
            this.selection = selection;
            this.tabSize = tabSize;
            this.selectionId = null;
        }
        getEditOperations(model, builder) {
            this.selectionId = builder.trackSelection(this.selection);
            getIndentationEditOperations(model, builder, this.tabSize, false);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this.selectionId);
        }
    }
    exports.IndentationToTabsCommand = IndentationToTabsCommand;
    (0, editorExtensions_1.registerEditorContribution)(AutoIndentOnPaste.ID, AutoIndentOnPaste, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(IndentationToSpacesAction);
    (0, editorExtensions_1.registerEditorAction)(IndentationToTabsAction);
    (0, editorExtensions_1.registerEditorAction)(IndentUsingTabs);
    (0, editorExtensions_1.registerEditorAction)(IndentUsingSpaces);
    (0, editorExtensions_1.registerEditorAction)(ChangeTabDisplaySize);
    (0, editorExtensions_1.registerEditorAction)(DetectIndentation);
    (0, editorExtensions_1.registerEditorAction)(ReindentLinesAction);
    (0, editorExtensions_1.registerEditorAction)(ReindentSelectedLinesAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50YXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2luZGVudGF0aW9uL2Jyb3dzZXIvaW5kZW50YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxNQUFhLHlCQUEwQixTQUFRLCtCQUFZO2lCQUNuQyxPQUFFLEdBQUcsbUNBQW1DLENBQUM7UUFFaEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHlCQUF5QixDQUFDLEVBQUU7Z0JBQ2hDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLCtCQUErQixDQUFDO2dCQUMzRSxLQUFLLEVBQUUsK0JBQStCO2dCQUN0QyxZQUFZLEVBQUUscUNBQWlCLENBQUMsUUFBUTthQUN4QyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDekQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNyQyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLElBQUksMEJBQTBCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU3RSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFB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