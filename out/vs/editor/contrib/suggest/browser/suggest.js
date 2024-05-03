/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/contrib/snippet/browser/snippetParser", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/languageFeatures", "vs/platform/history/browser/contextScopedHistoryWidget"], function (require, exports, cancellation_1, errors_1, filters_1, lifecycle_1, stopwatch_1, types_1, uri_1, position_1, range_1, resolverService_1, snippetParser_1, nls_1, actions_1, commands_1, contextkey_1, languageFeatures_1, contextScopedHistoryWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickSuggestionsOptions = exports.CompletionItemModel = exports.CompletionOptions = exports.SnippetSortOrder = exports.CompletionItem = exports.suggestWidgetStatusbarMenu = exports.Context = void 0;
    exports.getSnippetSuggestSupport = getSnippetSuggestSupport;
    exports.setSnippetSuggestSupport = setSnippetSuggestSupport;
    exports.provideSuggestionItems = provideSuggestionItems;
    exports.getSuggestionComparator = getSuggestionComparator;
    exports.showSimpleSuggestions = showSimpleSuggestions;
    exports.Context = {
        Visible: contextScopedHistoryWidget_1.historyNavigationVisible,
        HasFocusedSuggestion: new contextkey_1.RawContextKey('suggestWidgetHasFocusedSuggestion', false, (0, nls_1.localize)('suggestWidgetHasSelection', "Whether any suggestion is focused")),
        DetailsVisible: new contextkey_1.RawContextKey('suggestWidgetDetailsVisible', false, (0, nls_1.localize)('suggestWidgetDetailsVisible', "Whether suggestion details are visible")),
        MultipleSuggestions: new contextkey_1.RawContextKey('suggestWidgetMultipleSuggestions', false, (0, nls_1.localize)('suggestWidgetMultipleSuggestions', "Whether there are multiple suggestions to pick from")),
        MakesTextEdit: new contextkey_1.RawContextKey('suggestionMakesTextEdit', true, (0, nls_1.localize)('suggestionMakesTextEdit', "Whether inserting the current suggestion yields in a change or has everything already been typed")),
        AcceptSuggestionsOnEnter: new contextkey_1.RawContextKey('acceptSuggestionOnEnter', true, (0, nls_1.localize)('acceptSuggestionOnEnter', "Whether suggestions are inserted when pressing Enter")),
        HasInsertAndReplaceRange: new contextkey_1.RawContextKey('suggestionHasInsertAndReplaceRange', false, (0, nls_1.localize)('suggestionHasInsertAndReplaceRange', "Whether the current suggestion has insert and replace behaviour")),
        InsertMode: new contextkey_1.RawContextKey('suggestionInsertMode', undefined, { type: 'string', description: (0, nls_1.localize)('suggestionInsertMode', "Whether the default behaviour is to insert or replace") }),
        CanResolve: new contextkey_1.RawContextKey('suggestionCanResolve', false, (0, nls_1.localize)('suggestionCanResolve', "Whether the current suggestion supports to resolve further details")),
    };
    exports.suggestWidgetStatusbarMenu = new actions_1.MenuId('suggestWidgetStatusBar');
    class CompletionItem {
        constructor(position, completion, container, provider) {
            this.position = position;
            this.completion = completion;
            this.container = container;
            this.provider = provider;
            // validation
            this.isInvalid = false;
            // sorting, filtering
            this.score = filters_1.FuzzyScore.Default;
            this.distance = 0;
            this.textLabel = typeof completion.label === 'string'
                ? completion.label
                : completion.label?.label;
            // ensure lower-variants (perf)
            this.labelLow = this.textLabel.toLowerCase();
            // validate label
            this.isInvalid = !this.textLabel;
            this.sortTextLow = completion.sortText && completion.sortText.toLowerCase();
            this.filterTextLow = completion.filterText && completion.filterText.toLowerCase();
            this.extensionId = completion.extensionId;
            // normalize ranges
            if (range_1.Range.isIRange(completion.range)) {
                this.editStart = new position_1.Position(completion.range.startLineNumber, completion.range.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
                // validate range
                this.isInvalid = this.isInvalid
                    || range_1.Range.spansMultipleLines(completion.range) || completion.range.startLineNumber !== position.lineNumber;
            }
            else {
                this.editStart = new position_1.Position(completion.range.insert.startLineNumber, completion.range.insert.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.insert.endLineNumber, completion.range.insert.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.replace.endLineNumber, completion.range.replace.endColumn);
                // validate ranges
                this.isInvalid = this.isInvalid
                    || range_1.Range.spansMultipleLines(completion.range.insert) || range_1.Range.spansMultipleLines(completion.range.replace)
                    || completion.range.insert.startLineNumber !== position.lineNumber || completion.range.replace.startLineNumber !== position.lineNumber
                    || completion.range.insert.startColumn !== completion.range.replace.startColumn;
            }
            // create the suggestion resolver
            if (typeof provider.resolveCompletionItem !== 'function') {
                this._resolveCache = Promise.resolve();
                this._resolveDuration = 0;
            }
        }
        // ---- resolving
        get isResolved() {
            return this._resolveDuration !== undefined;
        }
        get resolveDuration() {
            return this._resolveDuration !== undefined ? this._resolveDuration : -1;
        }
        async resolve(token) {
            if (!this._resolveCache) {
                const sub = token.onCancellationRequested(() => {
                    this._resolveCache = undefined;
                    this._resolveDuration = undefined;
                });
                const sw = new stopwatch_1.StopWatch(true);
                this._resolveCache = Promise.resolve(this.provider.resolveCompletionItem(this.completion, token)).then(value => {
                    Object.assign(this.completion, value);
                    this._resolveDuration = sw.elapsed();
                }, err => {
                    if ((0, errors_1.isCancellationError)(err)) {
                        // the IPC queue will reject the request with the
                        // cancellation error -> reset cached
                        this._resolveCache = undefined;
                        this._resolveDuration = undefined;
                    }
                }).finally(() => {
                    sub.dispose();
                });
            }
            return this._resolveCache;
        }
    }
    exports.CompletionItem = CompletionItem;
    var SnippetSortOrder;
    (function (SnippetSortOrder) {
        SnippetSortOrder[SnippetSortOrder["Top"] = 0] = "Top";
        SnippetSortOrder[SnippetSortOrder["Inline"] = 1] = "Inline";
        SnippetSortOrder[SnippetSortOrder["Bottom"] = 2] = "Bottom";
    })(SnippetSortOrder || (exports.SnippetSortOrder = SnippetSortOrder = {}));
    class CompletionOptions {
        static { this.default = new CompletionOptions(); }
        constructor(snippetSortOrder = 2 /* SnippetSortOrder.Bottom */, kindFilter = new Set(), providerFilter = new Set(), providerItemsToReuse = new Map(), showDeprecated = true) {
            this.snippetSortOrder = snippetSortOrder;
            this.kindFilter = kindFilter;
            this.providerFilter = providerFilter;
            this.providerItemsToReuse = providerItemsToReuse;
            this.showDeprecated = showDeprecated;
        }
    }
    exports.CompletionOptions = CompletionOptions;
    let _snippetSuggestSupport;
    function getSnippetSuggestSupport() {
        return _snippetSuggestSupport;
    }
    function setSnippetSuggestSupport(support) {
        const old = _snippetSuggestSupport;
        _snippetSuggestSupport = support;
        return old;
    }
    class CompletionItemModel {
        constructor(items, needsClipboard, durations, disposable) {
            this.items = items;
            this.needsClipboard = needsClipboard;
            this.durations = durations;
            this.disposable = disposable;
        }
    }
    exports.CompletionItemModel = CompletionItemModel;
    async function provideSuggestionItems(registry, model, position, options = CompletionOptions.default, context = { triggerKind: 0 /* languages.CompletionTriggerKind.Invoke */ }, token = cancellation_1.CancellationToken.None) {
        const sw = new stopwatch_1.StopWatch();
        position = position.clone();
        const word = model.getWordAtPosition(position);
        const defaultReplaceRange = word ? new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn) : range_1.Range.fromPositions(position);
        const defaultRange = { replace: defaultReplaceRange, insert: defaultReplaceRange.setEndPosition(position.lineNumber, position.column) };
        const result = [];
        const disposables = new lifecycle_1.DisposableStore();
        const durations = [];
        let needsClipboard = false;
        const onCompletionList = (provider, container, sw) => {
            let didAddResult = false;
            if (!container) {
                return didAddResult;
            }
            for (const suggestion of container.suggestions) {
                if (!options.kindFilter.has(suggestion.kind)) {
                    // skip if not showing deprecated suggestions
                    if (!options.showDeprecated && suggestion?.tags?.includes(1 /* languages.CompletionItemTag.Deprecated */)) {
                        continue;
                    }
                    // fill in default range when missing
                    if (!suggestion.range) {
                        suggestion.range = defaultRange;
                    }
                    // fill in default sortText when missing
                    if (!suggestion.sortText) {
                        suggestion.sortText = typeof suggestion.label === 'string' ? suggestion.label : suggestion.label.label;
                    }
                    if (!needsClipboard && suggestion.insertTextRules && suggestion.insertTextRules & 4 /* languages.CompletionItemInsertTextRule.InsertAsSnippet */) {
                        needsClipboard = snippetParser_1.SnippetParser.guessNeedsClipboard(suggestion.insertText);
                    }
                    result.push(new CompletionItem(position, suggestion, container, provider));
                    didAddResult = true;
                }
            }
            if ((0, lifecycle_1.isDisposable)(container)) {
                disposables.add(container);
            }
            durations.push({
                providerName: provider._debugDisplayName ?? 'unknown_provider', elapsedProvider: container.duration ?? -1, elapsedOverall: sw.elapsed()
            });
            return didAddResult;
        };
        // ask for snippets in parallel to asking "real" providers. Only do something if configured to
        // do so - no snippet filter, no special-providers-only request
        const snippetCompletions = (async () => {
            if (!_snippetSuggestSupport || options.kindFilter.has(27 /* languages.CompletionItemKind.Snippet */)) {
                return;
            }
            // we have items from a previous session that we can reuse
            const reuseItems = options.providerItemsToReuse.get(_snippetSuggestSupport);
            if (reuseItems) {
                reuseItems.forEach(item => result.push(item));
                return;
            }
            if (options.providerFilter.size > 0 && !options.providerFilter.has(_snippetSuggestSupport)) {
                return;
            }
            const sw = new stopwatch_1.StopWatch();
            const list = await _snippetSuggestSupport.provideCompletionItems(model, position, context, token);
            onCompletionList(_snippetSuggestSupport, list, sw);
        })();
        // add suggestions from contributed providers - providers are ordered in groups of
        // equal score and once a group produces a result the process stops
        // get provider groups, always add snippet suggestion provider
        for (const providerGroup of registry.orderedGroups(model)) {
            // for each support in the group ask for suggestions
            let didAddResult = false;
            await Promise.all(providerGroup.map(async (provider) => {
                // we have items from a previous session that we can reuse
                if (options.providerItemsToReuse.has(provider)) {
                    const items = options.providerItemsToReuse.get(provider);
                    items.forEach(item => result.push(item));
                    didAddResult = didAddResult || items.length > 0;
                    return;
                }
                // check if this provider is filtered out
                if (options.providerFilter.size > 0 && !options.providerFilter.has(provider)) {
                    return;
                }
                try {
                    const sw = new stopwatch_1.StopWatch();
                    const list = await provider.provideCompletionItems(model, position, context, token);
                    didAddResult = onCompletionList(provider, list, sw) || didAddResult;
                }
                catch (err) {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }
            }));
            if (didAddResult || token.isCancellationRequested) {
                break;
            }
        }
        await snippetCompletions;
        if (token.isCancellationRequested) {
            disposables.dispose();
            return Promise.reject(new errors_1.CancellationError());
        }
        return new CompletionItemModel(result.sort(getSuggestionComparator(options.snippetSortOrder)), needsClipboard, { entries: durations, elapsed: sw.elapsed() }, disposables);
    }
    function defaultComparator(a, b) {
        // check with 'sortText'
        if (a.sortTextLow && b.sortTextLow) {
            if (a.sortTextLow < b.sortTextLow) {
                return -1;
            }
            else if (a.sortTextLow > b.sortTextLow) {
                return 1;
            }
        }
        // check with 'label'
        if (a.textLabel < b.textLabel) {
            return -1;
        }
        else if (a.textLabel > b.textLabel) {
            return 1;
        }
        // check with 'type'
        return a.completion.kind - b.completion.kind;
    }
    function snippetUpComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return -1;
            }
            else if (b.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return 1;
            }
        }
        return defaultComparator(a, b);
    }
    function snippetDownComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return 1;
            }
            else if (b.completion.kind === 27 /* languages.CompletionItemKind.Snippet */) {
                return -1;
            }
        }
        return defaultComparator(a, b);
    }
    const _snippetComparators = new Map();
    _snippetComparators.set(0 /* SnippetSortOrder.Top */, snippetUpComparator);
    _snippetComparators.set(2 /* SnippetSortOrder.Bottom */, snippetDownComparator);
    _snippetComparators.set(1 /* SnippetSortOrder.Inline */, defaultComparator);
    function getSuggestionComparator(snippetConfig) {
        return _snippetComparators.get(snippetConfig);
    }
    commands_1.CommandsRegistry.registerCommand('_executeCompletionItemProvider', async (accessor, ...args) => {
        const [uri, position, triggerCharacter, maxItemsToResolve] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(position_1.Position.isIPosition(position));
        (0, types_1.assertType)(typeof triggerCharacter === 'string' || !triggerCharacter);
        (0, types_1.assertType)(typeof maxItemsToResolve === 'number' || !maxItemsToResolve);
        const { completionProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const ref = await accessor.get(resolverService_1.ITextModelService).createModelReference(uri);
        try {
            const result = {
                incomplete: false,
                suggestions: []
            };
            const resolving = [];
            const actualPosition = ref.object.textEditorModel.validatePosition(position);
            const completions = await provideSuggestionItems(completionProvider, ref.object.textEditorModel, actualPosition, undefined, { triggerCharacter: triggerCharacter ?? undefined, triggerKind: triggerCharacter ? 1 /* languages.CompletionTriggerKind.TriggerCharacter */ : 0 /* languages.CompletionTriggerKind.Invoke */ });
            for (const item of completions.items) {
                if (resolving.length < (maxItemsToResolve ?? 0)) {
                    resolving.push(item.resolve(cancellation_1.CancellationToken.None));
                }
                result.incomplete = result.incomplete || item.container.incomplete;
                result.suggestions.push(item.completion);
            }
            try {
                await Promise.all(resolving);
                return result;
            }
            finally {
                setTimeout(() => completions.disposable.dispose(), 100);
            }
        }
        finally {
            ref.dispose();
        }
    });
    function showSimpleSuggestions(editor, provider) {
        editor.getContribution('editor.contrib.suggestController')?.triggerSuggest(new Set().add(provider), undefined, true);
    }
    class QuickSuggestionsOptions {
        static isAllOff(config) {
            return config.other === 'off' && config.comments === 'off' && config.strings === 'off';
        }
        static isAllOn(config) {
            return config.other === 'on' && config.comments === 'on' && config.strings === 'on';
        }
        static valueFor(config, tokenType) {
            switch (tokenType) {
                case 1 /* StandardTokenType.Comment */: return config.comments;
                case 2 /* StandardTokenType.String */: return config.strings;
                default: return config.other;
            }
        }
    }
    exports.QuickSuggestionsOptions = QuickSuggestionsOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUxoRyw0REFFQztJQUVELDREQUlDO0lBc0JELHdEQTBIQztJQWtERCwwREFFQztJQThDRCxzREFJQztJQXJaWSxRQUFBLE9BQU8sR0FBRztRQUN0QixPQUFPLEVBQUUscURBQXdCO1FBQ2pDLG9CQUFvQixFQUFFLElBQUksMEJBQWEsQ0FBVSxtQ0FBbUMsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsMkJBQTJCLEVBQUUsbUNBQW1DLENBQUMsQ0FBQztRQUN4SyxjQUFjLEVBQUUsSUFBSSwwQkFBYSxDQUFVLDZCQUE2QixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDO1FBQ25LLG1CQUFtQixFQUFFLElBQUksMEJBQWEsQ0FBVSxrQ0FBa0MsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0NBQWtDLEVBQUUscURBQXFELENBQUMsQ0FBQztRQUMvTCxhQUFhLEVBQUUsSUFBSSwwQkFBYSxDQUFVLHlCQUF5QixFQUFFLElBQUksRUFBRSxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxrR0FBa0csQ0FBQyxDQUFDO1FBQ25OLHdCQUF3QixFQUFFLElBQUksMEJBQWEsQ0FBVSx5QkFBeUIsRUFBRSxJQUFJLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsc0RBQXNELENBQUMsQ0FBQztRQUNsTCx3QkFBd0IsRUFBRSxJQUFJLDBCQUFhLENBQVUsb0NBQW9DLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLG9DQUFvQyxFQUFFLGlFQUFpRSxDQUFD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