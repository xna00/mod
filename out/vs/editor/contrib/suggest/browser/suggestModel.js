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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/selection", "vs/editor/common/services/editorWorker", "vs/editor/contrib/suggest/browser/wordDistance", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "./completionModel", "./suggest", "vs/editor/common/services/languageFeatures", "vs/base/common/filters", "vs/base/common/types", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/environment/common/environment"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, strings_1, selection_1, editorWorker_1, wordDistance_1, clipboardService_1, configuration_1, contextkey_1, log_1, telemetry_1, completionModel_1, suggest_1, languageFeatures_1, filters_1, types_1, inlineCompletionContextKeys_1, snippetController2_1, environment_1) {
    "use strict";
    var SuggestModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestModel = exports.State = exports.LineContext = void 0;
    class LineContext {
        static shouldAutoTrigger(editor) {
            if (!editor.hasModel()) {
                return false;
            }
            const model = editor.getModel();
            const pos = editor.getPosition();
            model.tokenization.tokenizeIfCheap(pos.lineNumber);
            const word = model.getWordAtPosition(pos);
            if (!word) {
                return false;
            }
            if (word.endColumn !== pos.column &&
                word.startColumn + 1 !== pos.column /* after typing a single character before a word */) {
                return false;
            }
            if (!isNaN(Number(word.word))) {
                return false;
            }
            return true;
        }
        constructor(model, position, triggerOptions) {
            this.leadingLineContent = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
            this.leadingWord = model.getWordUntilPosition(position);
            this.lineNumber = position.lineNumber;
            this.column = position.column;
            this.triggerOptions = triggerOptions;
        }
    }
    exports.LineContext = LineContext;
    var State;
    (function (State) {
        State[State["Idle"] = 0] = "Idle";
        State[State["Manual"] = 1] = "Manual";
        State[State["Auto"] = 2] = "Auto";
    })(State || (exports.State = State = {}));
    function canShowQuickSuggest(editor, contextKeyService, configurationService) {
        if (!Boolean(contextKeyService.getContextKeyValue(inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible.key))) {
            // Allow if there is no inline suggestion.
            return true;
        }
        const suppressSuggestions = contextKeyService.getContextKeyValue(inlineCompletionContextKeys_1.InlineCompletionContextKeys.suppressSuggestions.key);
        if (suppressSuggestions !== undefined) {
            return !suppressSuggestions;
        }
        return !editor.getOption(62 /* EditorOption.inlineSuggest */).suppressSuggestions;
    }
    function canShowSuggestOnTriggerCharacters(editor, contextKeyService, configurationService) {
        if (!Boolean(contextKeyService.getContextKeyValue('inlineSuggestionVisible'))) {
            // Allow if there is no inline suggestion.
            return true;
        }
        const suppressSuggestions = contextKeyService.getContextKeyValue(inlineCompletionContextKeys_1.InlineCompletionContextKeys.suppressSuggestions.key);
        if (suppressSuggestions !== undefined) {
            return !suppressSuggestions;
        }
        return !editor.getOption(62 /* EditorOption.inlineSuggest */).suppressSuggestions;
    }
    let SuggestModel = SuggestModel_1 = class SuggestModel {
        constructor(_editor, _editorWorkerService, _clipboardService, _telemetryService, _logService, _contextKeyService, _configurationService, _languageFeaturesService, _envService) {
            this._editor = _editor;
            this._editorWorkerService = _editorWorkerService;
            this._clipboardService = _clipboardService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._envService = _envService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._triggerCharacterListener = new lifecycle_1.DisposableStore();
            this._triggerQuickSuggest = new async_1.TimeoutTimer();
            this._triggerState = undefined;
            this._completionDisposables = new lifecycle_1.DisposableStore();
            this._onDidCancel = new event_1.Emitter();
            this._onDidTrigger = new event_1.Emitter();
            this._onDidSuggest = new event_1.Emitter();
            this.onDidCancel = this._onDidCancel.event;
            this.onDidTrigger = this._onDidTrigger.event;
            this.onDidSuggest = this._onDidSuggest.event;
            this._telemetryGate = 0;
            this._currentSelection = this._editor.getSelection() || new selection_1.Selection(1, 1, 1, 1);
            // wire up various listeners
            this._toDispose.add(this._editor.onDidChangeModel(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeModelLanguage(() => {
                this._updateTriggerCharacters();
                this.cancel();
            }));
            this._toDispose.add(this._editor.onDidChangeConfiguration(() => {
                this._updateTriggerCharacters();
            }));
            this._toDispose.add(this._languageFeaturesService.completionProvider.onDidChange(() => {
                this._updateTriggerCharacters();
                this._updateActiveSuggestSession();
            }));
            let editorIsComposing = false;
            this._toDispose.add(this._editor.onDidCompositionStart(() => {
                editorIsComposing = true;
            }));
            this._toDispose.add(this._editor.onDidCompositionEnd(() => {
                editorIsComposing = false;
                this._onCompositionEnd();
            }));
            this._toDispose.add(this._editor.onDidChangeCursorSelection(e => {
                // only trigger suggest when the editor isn't composing a character
                if (!editorIsComposing) {
                    this._onCursorChange(e);
                }
            }));
            this._toDispose.add(this._editor.onDidChangeModelContent(() => {
                // only filter completions when the editor isn't composing a character
                // allow-any-unicode-next-line
                // e.g. ¨ + u makes ü but just ¨ cannot be used for filtering
                if (!editorIsComposing && this._triggerState !== undefined) {
                    this._refilterCompletionItems();
                }
            }));
            this._updateTriggerCharacters();
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._triggerCharacterListener);
            (0, lifecycle_1.dispose)([this._onDidCancel, this._onDidSuggest, this._onDidTrigger, this._triggerQuickSuggest]);
            this._toDispose.dispose();
            this._completionDisposables.dispose();
            this.cancel();
        }
        _updateTriggerCharacters() {
            this._triggerCharacterListener.clear();
            if (this._editor.getOption(91 /* EditorOption.readOnly */)
                || !this._editor.hasModel()
                || !this._editor.getOption(121 /* EditorOption.suggestOnTriggerCharacters */)) {
                return;
            }
            const supportsByTriggerCharacter = new Map();
            for (const support of this._languageFeaturesService.completionProvider.all(this._editor.getModel())) {
                for (const ch of support.triggerCharacters || []) {
                    let set = supportsByTriggerCharacter.get(ch);
                    if (!set) {
                        set = new Set();
                        set.add((0, suggest_1.getSnippetSuggestSupport)());
                        supportsByTriggerCharacter.set(ch, set);
                    }
                    set.add(support);
                }
            }
            const checkTriggerCharacter = (text) => {
                if (!canShowSuggestOnTriggerCharacters(this._editor, this._contextKeyService, this._configurationService)) {
                    return;
                }
                if (LineContext.shouldAutoTrigger(this._editor)) {
                    // don't trigger by trigger characters when this is a case for quick suggest
                    return;
                }
                if (!text) {
                    // came here from the compositionEnd-event
                    const position = this._editor.getPosition();
                    const model = this._editor.getModel();
                    text = model.getLineContent(position.lineNumber).substr(0, position.column - 1);
                }
                let lastChar = '';
                if ((0, strings_1.isLowSurrogate)(text.charCodeAt(text.length - 1))) {
                    if ((0, strings_1.isHighSurrogate)(text.charCodeAt(text.length - 2))) {
                        lastChar = text.substr(text.length - 2);
                    }
                }
                else {
                    lastChar = text.charAt(text.length - 1);
                }
                const supports = supportsByTriggerCharacter.get(lastChar);
                if (supports) {
                    // keep existing items that where not computed by the
                    // supports/providers that want to trigger now
                    const providerItemsToReuse = new Map();
                    if (this._completionModel) {
                        for (const [provider, items] of this._completionModel.getItemsByProvider()) {
                            if (!supports.has(provider)) {
                                providerItemsToReuse.set(provider, items);
                            }
                        }
                    }
                    this.trigger({
                        auto: true,
                        triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */,
                        triggerCharacter: lastChar,
                        retrigger: Boolean(this._completionModel),
                        clipboardText: this._completionModel?.clipboardText,
                        completionOptions: { providerFilter: supports, providerItemsToReuse }
                    });
                }
            };
            this._triggerCharacterListener.add(this._editor.onDidType(checkTriggerCharacter));
            this._triggerCharacterListener.add(this._editor.onDidCompositionEnd(() => checkTriggerCharacter()));
        }
        // --- trigger/retrigger/cancel suggest
        get state() {
            if (!this._triggerState) {
                return 0 /* State.Idle */;
            }
            else if (!this._triggerState.auto) {
                return 1 /* State.Manual */;
            }
            else {
                return 2 /* State.Auto */;
            }
        }
        cancel(retrigger = false) {
            if (this._triggerState !== undefined) {
                this._triggerQuickSuggest.cancel();
                this._requestToken?.cancel();
                this._requestToken = undefined;
                this._triggerState = undefined;
                this._completionModel = undefined;
                this._context = undefined;
                this._onDidCancel.fire({ retrigger });
            }
        }
        clear() {
            this._completionDisposables.clear();
        }
        _updateActiveSuggestSession() {
            if (this._triggerState !== undefined) {
                if (!this._editor.hasModel() || !this._languageFeaturesService.completionProvider.has(this._editor.getModel())) {
                    this.cancel();
                }
                else {
                    this.trigger({ auto: this._triggerState.auto, retrigger: true });
                }
            }
        }
        _onCursorChange(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            const prevSelection = this._currentSelection;
            this._currentSelection = this._editor.getSelection();
            if (!e.selection.isEmpty()
                || (e.reason !== 0 /* CursorChangeReason.NotSet */ && e.reason !== 3 /* CursorChangeReason.Explicit */)
                || (e.source !== 'keyboard' && e.source !== 'deleteLeft')) {
                // Early exit if nothing needs to be done!
                // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                this.cancel();
                return;
            }
            if (this._triggerState === undefined && e.reason === 0 /* CursorChangeReason.NotSet */) {
                if (prevSelection.containsRange(this._currentSelection) || prevSelection.getEndPosition().isBeforeOrEqual(this._currentSelection.getPosition())) {
                    // cursor did move RIGHT due to typing -> trigger quick suggest
                    this._doTriggerQuickSuggest();
                }
            }
            else if (this._triggerState !== undefined && e.reason === 3 /* CursorChangeReason.Explicit */) {
                // suggest is active and something like cursor keys are used to move
                // the cursor. this means we can refilter at the new position
                this._refilterCompletionItems();
            }
        }
        _onCompositionEnd() {
            // trigger or refilter when composition ends
            if (this._triggerState === undefined) {
                this._doTriggerQuickSuggest();
            }
            else {
                this._refilterCompletionItems();
            }
        }
        _doTriggerQuickSuggest() {
            if (suggest_1.QuickSuggestionsOptions.isAllOff(this._editor.getOption(89 /* EditorOption.quickSuggestions */))) {
                // not enabled
                return;
            }
            if (this._editor.getOption(118 /* EditorOption.suggest */).snippetsPreventQuickSuggestions && snippetController2_1.SnippetController2.get(this._editor)?.isInSnippet()) {
                // no quick suggestion when in snippet mode
                return;
            }
            this.cancel();
            this._triggerQuickSuggest.cancelAndSet(() => {
                if (this._triggerState !== undefined) {
                    return;
                }
                if (!LineContext.shouldAutoTrigger(this._editor)) {
                    return;
                }
                if (!this._editor.hasModel() || !this._editor.hasWidgetFocus()) {
                    return;
                }
                const model = this._editor.getModel();
                const pos = this._editor.getPosition();
                // validate enabled now
                const config = this._editor.getOption(89 /* EditorOption.quickSuggestions */);
                if (suggest_1.QuickSuggestionsOptions.isAllOff(config)) {
                    return;
                }
                if (!suggest_1.QuickSuggestionsOptions.isAllOn(config)) {
                    // Check the type of the token that triggered this
                    model.tokenization.tokenizeIfCheap(pos.lineNumber);
                    const lineTokens = model.tokenization.getLineTokens(pos.lineNumber);
                    const tokenType = lineTokens.getStandardTokenType(lineTokens.findTokenIndexAtOffset(Math.max(pos.column - 1 - 1, 0)));
                    if (suggest_1.QuickSuggestionsOptions.valueFor(config, tokenType) !== 'on') {
                        return;
                    }
                }
                if (!canShowQuickSuggest(this._editor, this._contextKeyService, this._configurationService)) {
                    // do not trigger quick suggestions if inline suggestions are shown
                    return;
                }
                if (!this._languageFeaturesService.completionProvider.has(model)) {
                    return;
                }
                // we made it till here -> trigger now
                this.trigger({ auto: true });
            }, this._editor.getOption(90 /* EditorOption.quickSuggestionsDelay */));
        }
        _refilterCompletionItems() {
            (0, types_1.assertType)(this._editor.hasModel());
            (0, types_1.assertType)(this._triggerState !== undefined);
            const model = this._editor.getModel();
            const position = this._editor.getPosition();
            const ctx = new LineContext(model, position, { ...this._triggerState, refilter: true });
            this._onNewContext(ctx);
        }
        trigger(options) {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const ctx = new LineContext(model, this._editor.getPosition(), options);
            // Cancel previous requests, change state & update UI
            this.cancel(options.retrigger);
            this._triggerState = options;
            this._onDidTrigger.fire({ auto: options.auto, shy: options.shy ?? false, position: this._editor.getPosition() });
            // Capture context when request was sent
            this._context = ctx;
            // Build context for request
            let suggestCtx = { triggerKind: options.triggerKind ?? 0 /* CompletionTriggerKind.Invoke */ };
            if (options.triggerCharacter) {
                suggestCtx = {
                    triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */,
                    triggerCharacter: options.triggerCharacter
                };
            }
            this._requestToken = new cancellation_1.CancellationTokenSource();
            // kind filter and snippet sort rules
            const snippetSuggestions = this._editor.getOption(112 /* EditorOption.snippetSuggestions */);
            let snippetSortOrder = 1 /* SnippetSortOrder.Inline */;
            switch (snippetSuggestions) {
                case 'top':
                    snippetSortOrder = 0 /* SnippetSortOrder.Top */;
                    break;
                // 	↓ that's the default anyways...
                // case 'inline':
                // 	snippetSortOrder = SnippetSortOrder.Inline;
                // 	break;
                case 'bottom':
                    snippetSortOrder = 2 /* SnippetSortOrder.Bottom */;
                    break;
            }
            const { itemKind: itemKindFilter, showDeprecated } = SuggestModel_1.createSuggestFilter(this._editor);
            const completionOptions = new suggest_1.CompletionOptions(snippetSortOrder, options.completionOptions?.kindFilter ?? itemKindFilter, options.completionOptions?.providerFilter, options.completionOptions?.providerItemsToReuse, showDeprecated);
            const wordDistance = wordDistance_1.WordDistance.create(this._editorWorkerService, this._editor);
            const completions = (0, suggest_1.provideSuggestionItems)(this._languageFeaturesService.completionProvider, model, this._editor.getPosition(), completionOptions, suggestCtx, this._requestToken.token);
            Promise.all([completions, wordDistance]).then(async ([completions, wordDistance]) => {
                this._requestToken?.dispose();
                if (!this._editor.hasModel()) {
                    return;
                }
                let clipboardText = options?.clipboardText;
                if (!clipboardText && completions.needsClipboard) {
                    clipboardText = await this._clipboardService.readText();
                }
                if (this._triggerState === undefined) {
                    return;
                }
                const model = this._editor.getModel();
                // const items = completions.items;
                // if (existing) {
                // 	const cmpFn = getSuggestionComparator(snippetSortOrder);
                // 	items = items.concat(existing.items).sort(cmpFn);
                // }
                const ctx = new LineContext(model, this._editor.getPosition(), options);
                const fuzzySearchOptions = {
                    ...filters_1.FuzzyScoreOptions.default,
                    firstMatchCanBeWeak: !this._editor.getOption(118 /* EditorOption.suggest */).matchOnWordStartOnly
                };
                this._completionModel = new completionModel_1.CompletionModel(completions.items, this._context.column, {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                }, wordDistance, this._editor.getOption(118 /* EditorOption.suggest */), this._editor.getOption(112 /* EditorOption.snippetSuggestions */), fuzzySearchOptions, clipboardText);
                // store containers so that they can be disposed later
                this._completionDisposables.add(completions.disposable);
                this._onNewContext(ctx);
                // finally report telemetry about durations
                this._reportDurationsTelemetry(completions.durations);
                // report invalid completions by source
                if (!this._envService.isBuilt || this._envService.isExtensionDevelopment) {
                    for (const item of completions.items) {
                        if (item.isInvalid) {
                            this._logService.warn(`[suggest] did IGNORE invalid completion item from ${item.provider._debugDisplayName}`, item.completion);
                        }
                    }
                }
            }).catch(errors_1.onUnexpectedError);
        }
        _reportDurationsTelemetry(durations) {
            if (this._telemetryGate++ % 230 !== 0) {
                return;
            }
            setTimeout(() => {
                this._telemetryService.publicLog2('suggest.durations.json', { data: JSON.stringify(durations) });
                this._logService.debug('suggest.durations.json', durations);
            });
        }
        static createSuggestFilter(editor) {
            // kind filter and snippet sort rules
            const result = new Set();
            // snippet setting
            const snippetSuggestions = editor.getOption(112 /* EditorOption.snippetSuggestions */);
            if (snippetSuggestions === 'none') {
                result.add(27 /* CompletionItemKind.Snippet */);
            }
            // type setting
            const suggestOptions = editor.getOption(118 /* EditorOption.suggest */);
            if (!suggestOptions.showMethods) {
                result.add(0 /* CompletionItemKind.Method */);
            }
            if (!suggestOptions.showFunctions) {
                result.add(1 /* CompletionItemKind.Function */);
            }
            if (!suggestOptions.showConstructors) {
                result.add(2 /* CompletionItemKind.Constructor */);
            }
            if (!suggestOptions.showFields) {
                result.add(3 /* CompletionItemKind.Field */);
            }
            if (!suggestOptions.showVariables) {
                result.add(4 /* CompletionItemKind.Variable */);
            }
            if (!suggestOptions.showClasses) {
                result.add(5 /* CompletionItemKind.Class */);
            }
            if (!suggestOptions.showStructs) {
                result.add(6 /* CompletionItemKind.Struct */);
            }
            if (!suggestOptions.showInterfaces) {
                result.add(7 /* CompletionItemKind.Interface */);
            }
            if (!suggestOptions.showModules) {
                result.add(8 /* CompletionItemKind.Module */);
            }
            if (!suggestOptions.showProperties) {
                result.add(9 /* CompletionItemKind.Property */);
            }
            if (!suggestOptions.showEvents) {
                result.add(10 /* CompletionItemKind.Event */);
            }
            if (!suggestOptions.showOperators) {
                result.add(11 /* CompletionItemKind.Operator */);
            }
            if (!suggestOptions.showUnits) {
                result.add(12 /* CompletionItemKind.Unit */);
            }
            if (!suggestOptions.showValues) {
                result.add(13 /* CompletionItemKind.Value */);
            }
            if (!suggestOptions.showConstants) {
                result.add(14 /* CompletionItemKind.Constant */);
            }
            if (!suggestOptions.showEnums) {
                result.add(15 /* CompletionItemKind.Enum */);
            }
            if (!suggestOptions.showEnumMembers) {
                result.add(16 /* CompletionItemKind.EnumMember */);
            }
            if (!suggestOptions.showKeywords) {
                result.add(17 /* CompletionItemKind.Keyword */);
            }
            if (!suggestOptions.showWords) {
                result.add(18 /* CompletionItemKind.Text */);
            }
            if (!suggestOptions.showColors) {
                result.add(19 /* CompletionItemKind.Color */);
            }
            if (!suggestOptions.showFiles) {
                result.add(20 /* CompletionItemKind.File */);
            }
            if (!suggestOptions.showReferences) {
                result.add(21 /* CompletionItemKind.Reference */);
            }
            if (!suggestOptions.showColors) {
                result.add(22 /* CompletionItemKind.Customcolor */);
            }
            if (!suggestOptions.showFolders) {
                result.add(23 /* CompletionItemKind.Folder */);
            }
            if (!suggestOptions.showTypeParameters) {
                result.add(24 /* CompletionItemKind.TypeParameter */);
            }
            if (!suggestOptions.showSnippets) {
                result.add(27 /* CompletionItemKind.Snippet */);
            }
            if (!suggestOptions.showUsers) {
                result.add(25 /* CompletionItemKind.User */);
            }
            if (!suggestOptions.showIssues) {
                result.add(26 /* CompletionItemKind.Issue */);
            }
            return { itemKind: result, showDeprecated: suggestOptions.showDeprecated };
        }
        _onNewContext(ctx) {
            if (!this._context) {
                // happens when 24x7 IntelliSense is enabled and still in its delay
                return;
            }
            if (ctx.lineNumber !== this._context.lineNumber) {
                // e.g. happens when pressing Enter while IntelliSense is computed
                this.cancel();
                return;
            }
            if ((0, strings_1.getLeadingWhitespace)(ctx.leadingLineContent) !== (0, strings_1.getLeadingWhitespace)(this._context.leadingLineContent)) {
                // cancel IntelliSense when line start changes
                // happens when the current word gets outdented
                this.cancel();
                return;
            }
            if (ctx.column < this._context.column) {
                // typed -> moved cursor LEFT -> retrigger if still on a word
                if (ctx.leadingWord.word) {
                    this.trigger({ auto: this._context.triggerOptions.auto, retrigger: true });
                }
                else {
                    this.cancel();
                }
                return;
            }
            if (!this._completionModel) {
                // happens when IntelliSense is not yet computed
                return;
            }
            if (ctx.leadingWord.word.length !== 0 && ctx.leadingWord.startColumn > this._context.leadingWord.startColumn) {
                // started a new word while IntelliSense shows -> retrigger but reuse all items that we currently have
                const shouldAutoTrigger = LineContext.shouldAutoTrigger(this._editor);
                if (shouldAutoTrigger && this._context) {
                    // shouldAutoTrigger forces tokenization, which can cause pending cursor change events to be emitted, which can cause
                    // suggestions to be cancelled, which causes `this._context` to be undefined
                    const map = this._completionModel.getItemsByProvider();
                    this.trigger({
                        auto: this._context.triggerOptions.auto,
                        retrigger: true,
                        clipboardText: this._completionModel.clipboardText,
                        completionOptions: { providerItemsToReuse: map }
                    });
                }
                return;
            }
            if (ctx.column > this._context.column && this._completionModel.getIncompleteProvider().size > 0 && ctx.leadingWord.word.length !== 0) {
                // typed -> moved cursor RIGHT & incomple model & still on a word -> retrigger
                const providerItemsToReuse = new Map();
                const providerFilter = new Set();
                for (const [provider, items] of this._completionModel.getItemsByProvider()) {
                    if (items.length > 0 && items[0].container.incomplete) {
                        providerFilter.add(provider);
                    }
                    else {
                        providerItemsToReuse.set(provider, items);
                    }
                }
                this.trigger({
                    auto: this._context.triggerOptions.auto,
                    triggerKind: 2 /* CompletionTriggerKind.TriggerForIncompleteCompletions */,
                    retrigger: true,
                    clipboardText: this._completionModel.clipboardText,
                    completionOptions: { providerFilter, providerItemsToReuse }
                });
            }
            else {
                // typed -> moved cursor RIGHT -> update UI
                const oldLineContext = this._completionModel.lineContext;
                let isFrozen = false;
                this._completionModel.lineContext = {
                    leadingLineContent: ctx.leadingLineContent,
                    characterCountDelta: ctx.column - this._context.column
                };
                if (this._completionModel.items.length === 0) {
                    const shouldAutoTrigger = LineContext.shouldAutoTrigger(this._editor);
                    if (!this._context) {
                        // shouldAutoTrigger forces tokenization, which can cause pending cursor change events to be emitted, which can cause
                        // suggestions to be cancelled, which causes `this._context` to be undefined
                        this.cancel();
                        return;
                    }
                    if (shouldAutoTrigger && this._context.leadingWord.endColumn < ctx.leadingWord.startColumn) {
                        // retrigger when heading into a new word
                        this.trigger({ auto: this._context.triggerOptions.auto, retrigger: true });
                        return;
                    }
                    if (!this._context.triggerOptions.auto) {
                        // freeze when IntelliSense was manually requested
                        this._completionModel.lineContext = oldLineContext;
                        isFrozen = this._completionModel.items.length > 0;
                        if (isFrozen && ctx.leadingWord.word.length === 0) {
                            // there were results before but now there aren't
                            // and also we are not on a word anymore -> cancel
                            this.cancel();
                            return;
                        }
                    }
                    else {
                        // nothing left
                        this.cancel();
                        return;
                    }
                }
                this._onDidSuggest.fire({
                    completionModel: this._completionModel,
                    triggerOptions: ctx.triggerOptions,
                    isFrozen,
                });
            }
        }
    };
    exports.SuggestModel = SuggestModel;
    exports.SuggestModel = SuggestModel = SuggestModel_1 = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, log_1.ILogService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, languageFeatures_1.ILanguageFeaturesService),
        __param(8, environment_1.IEnvironmentService)
    ], SuggestModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvc3VnZ2VzdE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEyRGhHLE1BQWEsV0FBVztRQUV2QixNQUFNLENBQUMsaUJBQWlCLENBQUMsTUFBbUI7WUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pDLEtBQUssQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUVuRCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxHQUFHLENBQUMsTUFBTTtnQkFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxtREFBbUQsRUFBRSxDQUFDO2dCQUMxRixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztR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