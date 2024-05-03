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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/characterClassifier", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/format/browser/format", "vs/editor/contrib/format/browser/formattingEdit", "vs/nls", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress"], function (require, exports, arrays_1, cancellation_1, errors_1, keyCodes_1, lifecycle_1, editorExtensions_1, codeEditorService_1, characterClassifier_1, range_1, editorContextKeys_1, editorWorker_1, languageFeatures_1, format_1, formattingEdit_1, nls, accessibilitySignalService_1, commands_1, contextkey_1, instantiation_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FormatOnType = void 0;
    let FormatOnType = class FormatOnType {
        static { this.ID = 'editor.contrib.autoFormat'; }
        constructor(_editor, _languageFeaturesService, _workerService, _accessibilitySignalService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._workerService = _workerService;
            this._accessibilitySignalService = _accessibilitySignalService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._disposables.add(_languageFeaturesService.onTypeFormattingEditProvider.onDidChange(this._update, this));
            this._disposables.add(_editor.onDidChangeModel(() => this._update()));
            this._disposables.add(_editor.onDidChangeModelLanguage(() => this._update()));
            this._disposables.add(_editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(56 /* EditorOption.formatOnType */)) {
                    this._update();
                }
            }));
            this._update();
        }
        dispose() {
            this._disposables.dispose();
            this._sessionDisposables.dispose();
        }
        _update() {
            // clean up
            this._sessionDisposables.clear();
            // we are disabled
            if (!this._editor.getOption(56 /* EditorOption.formatOnType */)) {
                return;
            }
            // no model
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            // no support
            const [support] = this._languageFeaturesService.onTypeFormattingEditProvider.ordered(model);
            if (!support || !support.autoFormatTriggerCharacters) {
                return;
            }
            // register typing listeners that will trigger the format
            const triggerChars = new characterClassifier_1.CharacterSet();
            for (const ch of support.autoFormatTriggerCharacters) {
                triggerChars.add(ch.charCodeAt(0));
            }
            this._sessionDisposables.add(this._editor.onDidType((text) => {
                const lastCharCode = text.charCodeAt(text.length - 1);
                if (triggerChars.has(lastCharCode)) {
                    this._trigger(String.fromCharCode(lastCharCode));
                }
            }));
        }
        _trigger(ch) {
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._editor.getSelections().length > 1 || !this._editor.getSelection().isEmpty()) {
                return;
            }
            const model = this._editor.getModel();
            const position = this._editor.getPosition();
            const cts = new cancellation_1.CancellationTokenSource();
            // install a listener that checks if edits happens before the
            // position on which we format right now. If so, we won't
            // apply the format edits
            const unbind = this._editor.onDidChangeModelContent((e) => {
                if (e.isFlush) {
                    // a model.setValue() was called
                    // cancel only once
                    cts.cancel();
                    unbind.dispose();
                    return;
                }
                for (let i = 0, len = e.changes.length; i < len; i++) {
                    const change = e.changes[i];
                    if (change.range.endLineNumber <= position.lineNumber) {
                        // cancel only once
                        cts.cancel();
                        unbind.dispose();
                        return;
                    }
                }
            });
            (0, format_1.getOnTypeFormattingEdits)(this._workerService, this._languageFeaturesService, model, position, ch, model.getFormattingOptions(), cts.token).then(edits => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                if ((0, arrays_1.isNonEmptyArray)(edits)) {
                    this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.format, { userGesture: false });
                    formattingEdit_1.FormattingEdit.execute(this._editor, edits, true);
                }
            }).finally(() => {
                unbind.dispose();
            });
        }
    };
    exports.FormatOnType = FormatOnType;
    exports.FormatOnType = FormatOnType = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, editorWorker_1.IEditorWorkerService),
        __param(3, accessibilitySignalService_1.IAccessibilitySignalService)
    ], FormatOnType);
    let FormatOnPaste = class FormatOnPaste {
        static { this.ID = 'editor.contrib.formatOnPaste'; }
        constructor(editor, _languageFeaturesService, _instantiationService) {
            this.editor = editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._instantiationService = _instantiationService;
            this._callOnDispose = new lifecycle_1.DisposableStore();
            this._callOnModel = new lifecycle_1.DisposableStore();
            this._callOnDispose.add(editor.onDidChangeConfiguration(() => this._update()));
            this._callOnDispose.add(editor.onDidChangeModel(() => this._update()));
            this._callOnDispose.add(editor.onDidChangeModelLanguage(() => this._update()));
            this._callOnDispose.add(_languageFeaturesService.documentRangeFormattingEditProvider.onDidChange(this._update, this));
        }
        dispose() {
            this._callOnDispose.dispose();
            this._callOnModel.dispose();
        }
        _update() {
            // clean up
            this._callOnModel.clear();
            // we are disabled
            if (!this.editor.getOption(55 /* EditorOption.formatOnPaste */)) {
                return;
            }
            // no model
            if (!this.editor.hasModel()) {
                return;
            }
            // no formatter
            if (!this._languageFeaturesService.documentRangeFormattingEditProvider.has(this.editor.getModel())) {
                return;
            }
            this._callOnModel.add(this.editor.onDidPaste(({ range }) => this._trigger(range)));
        }
        _trigger(range) {
            if (!this.editor.hasModel()) {
                return;
            }
            if (this.editor.getSelections().length > 1) {
                return;
            }
            this._instantiationService.invokeFunction(format_1.formatDocumentRangesWithSelectedProvider, this.editor, range, 2 /* FormattingMode.Silent */, progress_1.Progress.None, cancellation_1.CancellationToken.None, false).catch(errors_1.onUnexpectedError);
        }
    };
    FormatOnPaste = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, instantiation_1.IInstantiationService)
    ], FormatOnPaste);
    class FormatDocumentAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument',
                label: nls.localize('formatDocument.label', "Format Document"),
                alias: 'Format Document',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.notInCompositeEditor, editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 36 /* KeyCode.KeyF */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor, editor) {
            if (editor.hasModel()) {
                const instaService = accessor.get(instantiation_1.IInstantiationService);
                const progressService = accessor.get(progress_1.IEditorProgressService);
                await progressService.showWhile(instaService.invokeFunction(format_1.formatDocumentWithSelectedProvider, editor, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None, true), 250);
            }
        }
    }
    class FormatSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatSelection',
                label: nls.localize('formatSelection.label', "Format Selection"),
                alias: 'Format Selection',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    when: editorContextKeys_1.EditorContextKeys.hasNonEmptySelection,
                    group: '1_modification',
                    order: 1.31
                }
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const model = editor.getModel();
            const ranges = editor.getSelections().map(range => {
                return range.isEmpty()
                    ? new range_1.Range(range.startLineNumber, 1, range.startLineNumber, model.getLineMaxColumn(range.startLineNumber))
                    : range;
            });
            const progressService = accessor.get(progress_1.IEditorProgressService);
            await progressService.showWhile(instaService.invokeFunction(format_1.formatDocumentRangesWithSelectedProvider, editor, ranges, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None, true), 250);
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(FormatOnType.ID, FormatOnType, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorContribution)(FormatOnPaste.ID, FormatOnPaste, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
    (0, editorExtensions_1.registerEditorAction)(FormatDocumentAction);
    (0, editorExtensions_1.registerEditorAction)(FormatSelectionAction);
    // this is the old format action that does both (format document OR format selection)
    // and we keep it here such that existing keybinding configurations etc will still work
    commands_1.CommandsRegistry.registerCommand('editor.action.format', async (accessor) => {
        const editor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
        if (!editor || !editor.hasModel()) {
            return;
        }
        const commandService = accessor.get(commands_1.ICommandService);
        if (editor.getSelection().isEmpty()) {
            await commandService.executeCommand('editor.action.formatDocument');
        }
        else {
            await commandService.executeCommand('editor.action.formatSelection');
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9ybWF0L2Jyb3dzZXIvZm9ybWF0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQnpGLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQVk7aUJBRUQsT0FBRSxHQUFHLDJCQUEyQixBQUE5QixDQUErQjtRQU14RCxZQUNrQixPQUFvQixFQUNYLHdCQUFtRSxFQUN2RSxjQUFxRCxFQUM5QywyQkFBeUU7WUFIckYsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNNLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDdEQsbUJBQWMsR0FBZCxjQUFjLENBQXNCO1lBQzdCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFQdEYsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNyQyx3QkFBbUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVE1RCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsQ0FBQyw0QkFBNEIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzdHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxD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