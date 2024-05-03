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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "./snippets", "./snippetsService", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/common/editorContextKeys", "./snippetCompletionProvider", "vs/platform/clipboard/common/clipboardService", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/common/services/languageFeatures"], function (require, exports, contextkey_1, snippets_1, snippetsService_1, range_1, editorExtensions_1, snippetController2_1, suggest_1, editorContextKeys_1, snippetCompletionProvider_1, clipboardService_1, editorState_1, languageFeatures_1) {
    "use strict";
    var TabCompletionController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabCompletionController = void 0;
    let TabCompletionController = class TabCompletionController {
        static { TabCompletionController_1 = this; }
        static { this.ID = 'editor.tabCompletionController'; }
        static { this.ContextKey = new contextkey_1.RawContextKey('hasSnippetCompletions', undefined); }
        static get(editor) {
            return editor.getContribution(TabCompletionController_1.ID);
        }
        constructor(_editor, _snippetService, _clipboardService, _languageFeaturesService, contextKeyService) {
            this._editor = _editor;
            this._snippetService = _snippetService;
            this._clipboardService = _clipboardService;
            this._languageFeaturesService = _languageFeaturesService;
            this._activeSnippets = [];
            this._hasSnippets = TabCompletionController_1.ContextKey.bindTo(contextKeyService);
            this._configListener = this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(123 /* EditorOption.tabCompletion */)) {
                    this._update();
                }
            });
            this._update();
        }
        dispose() {
            this._configListener.dispose();
            this._selectionListener?.dispose();
        }
        _update() {
            const enabled = this._editor.getOption(123 /* EditorOption.tabCompletion */) === 'onlySnippets';
            if (this._enabled !== enabled) {
                this._enabled = enabled;
                if (!this._enabled) {
                    this._selectionListener?.dispose();
                }
                else {
                    this._selectionListener = this._editor.onDidChangeCursorSelection(e => this._updateSnippets());
                    if (this._editor.getModel()) {
                        this._updateSnippets();
                    }
                }
            }
        }
        _updateSnippets() {
            // reset first
            this._activeSnippets = [];
            this._completionProvider?.dispose();
            if (!this._editor.hasModel()) {
                return;
            }
            // lots of dance for getting the
            const selection = this._editor.getSelection();
            const model = this._editor.getModel();
            model.tokenization.tokenizeIfCheap(selection.positionLineNumber);
            const id = model.getLanguageIdAtPosition(selection.positionLineNumber, selection.positionColumn);
            const snippets = this._snippetService.getSnippetsSync(id);
            if (!snippets) {
                // nothing for this language
                this._hasSnippets.set(false);
                return;
            }
            if (range_1.Range.isEmpty(selection)) {
                // empty selection -> real text (no whitespace) left of cursor
                const prefix = (0, snippetsService_1.getNonWhitespacePrefix)(model, selection.getPosition());
                if (prefix) {
                    for (const snippet of snippets) {
                        if (prefix.endsWith(snippet.prefix)) {
                            this._activeSnippets.push(snippet);
                        }
                    }
                }
            }
            else if (!range_1.Range.spansMultipleLines(selection) && model.getValueLengthInRange(selection) <= 100) {
                // actual selection -> snippet must be a full match
                const selected = model.getValueInRange(selection);
                if (selected) {
                    for (const snippet of snippets) {
                        if (selected === snippet.prefix) {
                            this._activeSnippets.push(snippet);
                        }
                    }
                }
            }
            const len = this._activeSnippets.length;
            if (len === 0) {
                this._hasSnippets.set(false);
            }
            else if (len === 1) {
                this._hasSnippets.set(true);
            }
            else {
                this._hasSnippets.set(true);
                this._completionProvider = {
                    _debugDisplayName: 'tabCompletion',
                    dispose: () => {
                        registration.dispose();
                    },
                    provideCompletionItems: (_model, position) => {
                        if (_model !== model || !selection.containsPosition(position)) {
                            return;
                        }
                        const suggestions = this._activeSnippets.map(snippet => {
                            const range = range_1.Range.fromPositions(position.delta(0, -snippet.prefix.length), position);
                            return new snippetCompletionProvider_1.SnippetCompletion(snippet, range);
                        });
                        return { suggestions };
                    }
                };
                const registration = this._languageFeaturesService.completionProvider.register({ language: model.getLanguageId(), pattern: model.uri.fsPath, scheme: model.uri.scheme }, this._completionProvider);
            }
        }
        async performSnippetCompletions() {
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._activeSnippets.length === 1) {
                // one -> just insert
                const [snippet] = this._activeSnippets;
                // async clipboard access might be required and in that case
                // we need to check if the editor has changed in flight and then
                // bail out (or be smarter than that)
                let clipboardText;
                if (snippet.needsClipboard) {
                    const state = new editorState_1.EditorState(this._editor, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */);
                    clipboardText = await this._clipboardService.readText();
                    if (!state.validate(this._editor)) {
                        return;
                    }
                }
                snippetController2_1.SnippetController2.get(this._editor)?.insert(snippet.codeSnippet, {
                    overwriteBefore: snippet.prefix.length, overwriteAfter: 0,
                    clipboardText
                });
            }
            else if (this._activeSnippets.length > 1) {
                // two or more -> show IntelliSense box
                if (this._completionProvider) {
                    (0, suggest_1.showSimpleSuggestions)(this._editor, this._completionProvider);
                }
            }
        }
    };
    exports.TabCompletionController = TabCompletionController;
    exports.TabCompletionController = TabCompletionController = TabCompletionController_1 = __decorate([
        __param(1, snippets_1.ISnippetsService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, contextkey_1.IContextKeyService)
    ], TabCompletionController);
    (0, editorExtensions_1.registerEditorContribution)(TabCompletionController.ID, TabCompletionController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to define a context key
    const TabCompletionCommand = editorExtensions_1.EditorCommand.bindToContribution(TabCompletionController.get);
    (0, editorExtensions_1.registerEditorCommand)(new TabCompletionCommand({
        id: 'insertSnippet',
        precondition: TabCompletionController.ContextKey,
        handler: x => x.performSnippetCompletions(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus, snippetController2_1.SnippetController2.InSnippetMode.toNegated()),
            primary: 2 /* KeyCode.Tab */
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiQ29tcGxldGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvYnJvd3Nlci90YWJDb21wbGV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXVCOztpQkFFbkIsT0FBRSxHQUFHLGdDQUFnQyxBQUFuQyxDQUFvQztpQkFFdEMsZUFBVSxHQUFHLElBQUksMEJBQWEsQ0FBVSx1QkFBdUIsRUFBRSxTQUFTLENBQUMsQUFBakUsQ0FBa0U7UUFFNUYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTBCLHlCQUF1QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFVRCxZQUNrQixPQUFvQixFQUNuQixlQUFrRCxFQUNqRCxpQkFBcUQsRUFDOUMsd0JBQW1FLEVBQ3pFLGlCQUFxQztZQUp4QyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0Ysb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ2hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDN0IsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQVB0RixvQkFBZSxHQUFjLEVBQUUsQ0FBQztZQVV2QyxJQUFJLENBQUMsWUFBWSxHQUFHLHlCQUF1QixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2hFLElBQUksQ0FBQyxDQUFDLFVBQVUsc0NBQTRCLEVBQUUsQ0FBQztvQkFDOUMsSUFBSSxDQUFDLE9BQU8s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