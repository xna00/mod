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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "./snippetSession"], function (require, exports, lifecycle_1, types_1, editorExtensions_1, position_1, editorContextKeys_1, languageConfigurationRegistry_1, languageFeatures_1, suggest_1, nls_1, contextkey_1, log_1, snippetSession_1) {
    "use strict";
    var SnippetController2_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetController2 = void 0;
    const _defaultOptions = {
        overwriteBefore: 0,
        overwriteAfter: 0,
        undoStopBefore: true,
        undoStopAfter: true,
        adjustWhitespace: true,
        clipboardText: undefined,
        overtypingCapturer: undefined
    };
    let SnippetController2 = class SnippetController2 {
        static { SnippetController2_1 = this; }
        static { this.ID = 'snippetController2'; }
        static get(editor) {
            return editor.getContribution(SnippetController2_1.ID);
        }
        static { this.InSnippetMode = new contextkey_1.RawContextKey('inSnippetMode', false, (0, nls_1.localize)('inSnippetMode', "Whether the editor in current in snippet mode")); }
        static { this.HasNextTabstop = new contextkey_1.RawContextKey('hasNextTabstop', false, (0, nls_1.localize)('hasNextTabstop', "Whether there is a next tab stop when in snippet mode")); }
        static { this.HasPrevTabstop = new contextkey_1.RawContextKey('hasPrevTabstop', false, (0, nls_1.localize)('hasPrevTabstop', "Whether there is a previous tab stop when in snippet mode")); }
        constructor(_editor, _logService, _languageFeaturesService, contextKeyService, _languageConfigurationService) {
            this._editor = _editor;
            this._logService = _logService;
            this._languageFeaturesService = _languageFeaturesService;
            this._languageConfigurationService = _languageConfigurationService;
            this._snippetListener = new lifecycle_1.DisposableStore();
            this._modelVersionId = -1;
            this._inSnippet = SnippetController2_1.InSnippetMode.bindTo(contextKeyService);
            this._hasNextTabstop = SnippetController2_1.HasNextTabstop.bindTo(contextKeyService);
            this._hasPrevTabstop = SnippetController2_1.HasPrevTabstop.bindTo(contextKeyService);
        }
        dispose() {
            this._inSnippet.reset();
            this._hasPrevTabstop.reset();
            this._hasNextTabstop.reset();
            this._session?.dispose();
            this._snippetListener.dispose();
        }
        apply(edits, opts) {
            try {
                this._doInsert(edits, typeof opts === 'undefined' ? _defaultOptions : { ..._defaultOptions, ...opts });
            }
            catch (e) {
                this.cancel();
                this._logService.error(e);
                this._logService.error('snippet_error');
                this._logService.error('insert_edits=', edits);
                this._logService.error('existing_template=', this._session ? this._session._logInfo() : '<no_session>');
            }
        }
        insert(template, opts) {
            // this is here to find out more about the yet-not-understood
            // error that sometimes happens when we fail to inserted a nested
            // snippet
            try {
                this._doInsert(template, typeof opts === 'undefined' ? _defaultOptions : { ..._defaultOptions, ...opts });
            }
            catch (e) {
                this.cancel();
                this._logService.error(e);
                this._logService.error('snippet_error');
                this._logService.error('insert_template=', template);
                this._logService.error('existing_template=', this._session ? this._session._logInfo() : '<no_session>');
            }
        }
        _doInsert(template, opts) {
            if (!this._editor.hasModel()) {
                return;
            }
            // don't listen while inserting the snippet
            // as that is the inflight state causing cancelation
            this._snippetListener.clear();
            if (opts.undoStopBefore) {
                this._editor.getModel().pushStackElement();
            }
            // don't merge
            if (this._session && typeof template !== 'string') {
                this.cancel();
            }
            if (!this._session) {
                this._modelVersionId = this._editor.getModel().getAlternativeVersionId();
                this._session = new snippetSession_1.SnippetSession(this._editor, template, opts, this._languageConfigurationService);
                this._session.insert();
            }
            else {
                (0, types_1.assertType)(typeof template === 'string');
                this._session.merge(template, opts);
            }
            if (opts.undoStopAfter) {
                this._editor.getModel().pushStackElement();
            }
            // regster completion item provider when there is any choice element
            if (this._session?.hasChoice) {
                const provider = {
                    _debugDisplayName: 'snippetChoiceCompletions',
                    provideCompletionItems: (model, position) => {
                        if (!this._session || model !== this._editor.getModel() || !position_1.Position.equals(this._editor.getPosition(), position)) {
                            return undefined;
                        }
                        const { activeChoice } = this._session;
                        if (!activeChoice || activeChoice.choice.options.length === 0) {
                            return undefined;
                        }
                        const word = model.getValueInRange(activeChoice.range);
                        const isAnyOfOptions = Boolean(activeChoice.choice.options.find(o => o.value === word));
                        const suggestions = [];
                        for (let i = 0; i < activeChoice.choice.options.length; i++) {
                            const option = activeChoice.choice.options[i];
                            suggestions.push({
                                kind: 13 /* CompletionItemKind.Value */,
                                label: option.value,
                                insertText: option.value,
                                sortText: 'a'.repeat(i + 1),
                                range: activeChoice.range,
                                filterText: isAnyOfOptions ? `${word}_${option.value}` : undefined,
                                command: { id: 'jumpToNextSnippetPlaceholder', title: (0, nls_1.localize)('next', 'Go to next placeholder...') }
                            });
                        }
                        return { suggestions };
                    }
                };
                const model = this._editor.getModel();
                let registration;
                let isRegistered = false;
                const disable = () => {
                    registration?.dispose();
                    isRegistered = false;
                };
                const enable = () => {
                    if (!isRegistered) {
                        registration = this._languageFeaturesService.completionProvider.register({
                            language: model.getLanguageId(),
                            pattern: model.uri.fsPath,
                            scheme: model.uri.scheme,
                            exclusive: true
                        }, provider);
                        this._snippetListener.add(registration);
                        isRegistered = true;
                    }
                };
                this._choiceCompletions = { provider, enable, disable };
            }
            this._updateState();
            this._snippetListener.add(this._editor.onDidChangeModelContent(e => e.isFlush && this.cancel()));
            this._snippetListener.add(this._editor.onDidChangeModel(() => this.cancel()));
            this._snippetListener.add(this._editor.onDidChangeCursorSelection(() => this._updateState()));
        }
        _updateState() {
            if (!this._session || !this._editor.hasModel()) {
                // canceled in the meanwhile
                return;
            }
            if (this._modelVersionId === this._editor.getModel().getAlternativeVersionId()) {
                // undo until the 'before' state happened
                // and makes use cancel snippet mode
                return this.cancel();
            }
            if (!this._session.hasPlaceholder) {
                // don't listen for selection changes and don't
                // update context keys when the snippet is plain text
                return this.cancel();
            }
            if (this._session.isAtLastPlaceholder || !this._session.isSelectionWithinPlaceholders()) {
                this._editor.getModel().pushStackElement();
                return this.cancel();
            }
            this._inSnippet.set(true);
            this._hasPrevTabstop.set(!this._session.isAtFirstPlaceholder);
            this._hasNextTabstop.set(!this._session.isAtLastPlaceholder);
            this._handleChoice();
        }
        _handleChoice() {
            if (!this._session || !this._editor.hasModel()) {
                this._currentChoice = undefined;
                return;
            }
            const { activeChoice } = this._session;
            if (!activeChoice || !this._choiceCompletions) {
                this._choiceCompletions?.disable();
                this._currentChoice = undefined;
                return;
            }
            if (this._currentChoice !== activeChoice.choice) {
                this._currentChoice = activeChoice.choice;
                this._choiceCompletions.enable();
                // trigger suggest with the special choice completion provider
                queueMicrotask(() => {
                    (0, suggest_1.showSimpleSuggestions)(this._editor, this._choiceCompletions.provider);
                });
            }
        }
        finish() {
            while (this._inSnippet.get()) {
                this.next();
            }
        }
        cancel(resetSelection = false) {
            this._inSnippet.reset();
            this._hasPrevTabstop.reset();
            this._hasNextTabstop.reset();
            this._snippetListener.clear();
            this._currentChoice = undefined;
            this._session?.dispose();
            this._session = undefined;
            this._modelVersionId = -1;
            if (resetSelection) {
                // reset selection to the primary cursor when being asked
                // for. this happens when explicitly cancelling snippet mode,
                // e.g. when pressing ESC
                this._editor.setSelections([this._editor.getSelection()]);
            }
        }
        prev() {
            this._session?.prev();
            this._updateState();
        }
        next() {
            this._session?.next();
            this._updateState();
        }
        isInSnippet() {
            return Boolean(this._inSnippet.get());
        }
        getSessionEnclosingRange() {
            if (this._session) {
                return this._session.getEnclosingRange();
            }
            return undefined;
        }
    };
    exports.SnippetController2 = SnippetController2;
    exports.SnippetController2 = SnippetController2 = SnippetController2_1 = __decorate([
        __param(1, log_1.ILogService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetController2);
    (0, editorExtensions_1.registerEditorContribution)(SnippetController2.ID, SnippetController2, 4 /* EditorContributionInstantiation.Lazy */);
    const CommandCtor = editorExtensions_1.EditorCommand.bindToContribution(SnippetController2.get);
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'jumpToNextSnippetPlaceholder',
        precondition: contextkey_1.ContextKeyExpr.and(SnippetController2.InSnippetMode, SnippetController2.HasNextTabstop),
        handler: ctrl => ctrl.next(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'jumpToPrevSnippetPlaceholder',
        precondition: contextkey_1.ContextKeyExpr.and(SnippetController2.InSnippetMode, SnippetController2.HasPrevTabstop),
        handler: ctrl => ctrl.prev(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'leaveSnippet',
        precondition: SnippetController2.InSnippetMode,
        handler: ctrl => ctrl.cancel(true),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'acceptSnippet',
        precondition: SnippetController2.InSnippetMode,
        handler: ctrl => ctrl.finish(),
        // kbOpts: {
        // 	weight: KeybindingWeight.EditorContrib + 30,
        // 	kbExpr: EditorContextKeys.textFocus,
        // 	primary: KeyCode.Enter,
        // }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldENvbnRyb2xsZXIyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zbmlwcGV0L2Jyb3dzZXIvc25pcHBldENvbnRyb2xsZXIyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQ2hHLE1BQU0sZUFBZSxHQUEwQjtRQUM5QyxlQUFlLEVBQUUsQ0FBQztRQUNsQixjQUFjLEVBQUUsQ0FBQztRQUNqQixjQUFjLEVBQUUsSUFBSTtRQUNwQixhQUFhLEVBQUUsSUFBSTtRQUNuQixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLGFBQWEsRUFBRSxTQUFTO1FBQ3hCLGtCQUFrQixFQUFFLFNBQVM7S0FDN0IsQ0FBQztJQUVLLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCOztpQkFFUCxPQUFFLEdBQUcsb0JBQW9CLEFBQXZCLENBQXdCO1FBRWpELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDN0IsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUFxQixvQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxRSxDQUFDO2lCQUVlLGtCQUFhLEdBQUcsSUFBSSwwQkFBYSxDQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLCtDQUErQyxDQUFDLENBQUMsQUFBeEgsQ0FBeUg7aUJBQ3RJLG1CQUFjLEdBQUcsSUFBSSwwQkFBYSxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSx1REFBdUQsQ0FBQyxDQUFDLEFBQWxJLENBQW1JO2lCQUNqSixtQkFBYyxHQUFHLElBQUksMEJBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsMkRB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