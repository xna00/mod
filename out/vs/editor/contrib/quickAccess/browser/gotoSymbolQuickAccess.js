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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/fuzzyScorer", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/contrib/quickAccess/browser/editorNavigationQuickAccess", "vs/nls", "vs/editor/common/services/languageFeatures", "vs/base/common/arraysFind"], function (require, exports, async_1, cancellation_1, codicons_1, themables_1, fuzzyScorer_1, lifecycle_1, strings_1, range_1, languages_1, outlineModel_1, editorNavigationQuickAccess_1, nls_1, languageFeatures_1, arraysFind_1) {
    "use strict";
    var AbstractGotoSymbolQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractGotoSymbolQuickAccessProvider = void 0;
    let AbstractGotoSymbolQuickAccessProvider = class AbstractGotoSymbolQuickAccessProvider extends editorNavigationQuickAccess_1.AbstractEditorNavigationQuickAccessProvider {
        static { AbstractGotoSymbolQuickAccessProvider_1 = this; }
        static { this.PREFIX = '@'; }
        static { this.SCOPE_PREFIX = ':'; }
        static { this.PREFIX_BY_CATEGORY = `${AbstractGotoSymbolQuickAccessProvider_1.PREFIX}${AbstractGotoSymbolQuickAccessProvider_1.SCOPE_PREFIX}`; }
        constructor(_languageFeaturesService, _outlineModelService, options = Object.create(null)) {
            super(options);
            this._languageFeaturesService = _languageFeaturesService;
            this._outlineModelService = _outlineModelService;
            this.options = options;
            this.options.canAcceptInBackground = true;
        }
        provideWithoutTextEditor(picker) {
            this.provideLabelPick(picker, (0, nls_1.localize)('cannotRunGotoSymbolWithoutEditor', "To go to a symbol, first open a text editor with symbol information."));
            return lifecycle_1.Disposable.None;
        }
        provideWithTextEditor(context, picker, token) {
            const editor = context.editor;
            const model = this.getModel(editor);
            if (!model) {
                return lifecycle_1.Disposable.None;
            }
            // Provide symbols from model if available in registry
            if (this._languageFeaturesService.documentSymbolProvider.has(model)) {
                return this.doProvideWithEditorSymbols(context, model, picker, token);
            }
            // Otherwise show an entry for a model without registry
            // But give a chance to resolve the symbols at a later
            // point if possible
            return this.doProvideWithoutEditorSymbols(context, model, picker, token);
        }
        doProvideWithoutEditorSymbols(context, model, picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // Generic pick for not having any symbol information
            this.provideLabelPick(picker, (0, nls_1.localize)('cannotRunGotoSymbolWithoutSymbolProvider', "The active text editor does not provide symbol information."));
            // Wait for changes to the registry and see if eventually
            // we do get symbols. This can happen if the picker is opened
            // very early after the model has loaded but before the
            // language registry is ready.
            // https://github.com/microsoft/vscode/issues/70607
            (async () => {
                const result = await this.waitForLanguageSymbolRegistry(model, disposables);
                if (!result || token.isCancellationRequested) {
                    return;
                }
                disposables.add(this.doProvideWithEditorSymbols(context, model, picker, token));
            })();
            return disposables;
        }
        provideLabelPick(picker, label) {
            picker.items = [{ label, index: 0, kind: 14 /* SymbolKind.String */ }];
            picker.ariaLabel = label;
        }
        async waitForLanguageSymbolRegistry(model, disposables) {
            if (this._languageFeaturesService.documentSymbolProvider.has(model)) {
                return true;
            }
            const symbolProviderRegistryPromise = new async_1.DeferredPromise();
            // Resolve promise when registry knows model
            const symbolProviderListener = disposables.add(this._languageFeaturesService.documentSymbolProvider.onDidChange(() => {
                if (this._languageFeaturesService.documentSymbolProvider.has(model)) {
                    symbolProviderListener.dispose();
                    symbolProviderRegistryPromise.complete(true);
                }
            }));
            // Resolve promise when we get disposed too
            disposables.add((0, lifecycle_1.toDisposable)(() => symbolProviderRegistryPromise.complete(false)));
            return symbolProviderRegistryPromise.p;
        }
        doProvideWithEditorSymbols(context, model, picker, token) {
            const editor = context.editor;
            const disposables = new lifecycle_1.DisposableStore();
            // Goto symbol once picked
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (item && item.range) {
                    this.gotoLocation(context, { range: item.range.selection, keyMods: picker.keyMods, preserveFocus: event.inBackground });
                    if (!event.inBackground) {
                        picker.hide();
                    }
                }
            }));
            // Goto symbol side by side if enabled
            disposables.add(picker.onDidTriggerItemButton(({ item }) => {
                if (item && item.range) {
                    this.gotoLocation(context, { range: item.range.selection, keyMods: picker.keyMods, forceSideBySide: true });
                    picker.hide();
                }
            }));
            // Resolve symbols from document once and reuse this
            // request for all filtering and typing then on
            const symbolsPromise = this.getDocumentSymbols(model, token);
            // Set initial picks and update on type
            let picksCts = undefined;
            const updatePickerItems = async (positionToEnclose) => {
                // Cancel any previous ask for picks and busy
                picksCts?.dispose(true);
                picker.busy = false;
                // Create new cancellation source for this run
                picksCts = new cancellation_1.CancellationTokenSource(token);
                // Collect symbol picks
                picker.busy = true;
                try {
                    const query = (0, fuzzyScorer_1.prepareQuery)(picker.value.substr(AbstractGotoSymbolQuickAccessProvider_1.PREFIX.length).trim());
                    const items = await this.doGetSymbolPicks(symbolsPromise, query, undefined, picksCts.token);
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (items.length > 0) {
                        picker.items = items;
                        if (positionToEnclose && query.original.length === 0) {
                            const candidate = (0, arraysFind_1.findLast)(items, item => Boolean(item.type !== 'separator' && item.range && range_1.Range.containsPosition(item.range.decoration, positionToEnclose)));
                            if (candidate) {
                                picker.activeItems = [candidate];
                            }
                        }
                    }
                    else {
                        if (query.original.length > 0) {
                            this.provideLabelPick(picker, (0, nls_1.localize)('noMatchingSymbolResults', "No matching editor symbols"));
                        }
                        else {
                            this.provideLabelPick(picker, (0, nls_1.localize)('noSymbolResults', "No editor symbols"));
                        }
                    }
                }
                finally {
                    if (!token.isCancellationRequested) {
                        picker.busy = false;
                    }
                }
            };
            disposables.add(picker.onDidChangeValue(() => updatePickerItems(undefined)));
            updatePickerItems(editor.getSelection()?.getPosition());
            // Reveal and decorate when active item changes
            disposables.add(picker.onDidChangeActive(() => {
                const [item] = picker.activeItems;
                if (item && item.range) {
                    // Reveal
                    editor.revealRangeInCenter(item.range.selection, 0 /* ScrollType.Smooth */);
                    // Decorate
                    this.addDecorations(editor, item.range.decoration);
                }
            }));
            return disposables;
        }
        async doGetSymbolPicks(symbolsPromise, query, options, token) {
            const symbols = await symbolsPromise;
            if (token.isCancellationRequested) {
                return [];
            }
            const filterBySymbolKind = query.original.indexOf(AbstractGotoSymbolQuickAccessProvider_1.SCOPE_PREFIX) === 0;
            const filterPos = filterBySymbolKind ? 1 : 0;
            // Split between symbol and container query
            let symbolQuery;
            let containerQuery;
            if (query.values && query.values.length > 1) {
                symbolQuery = (0, fuzzyScorer_1.pieceToQuery)(query.values[0]); // symbol: only match on first part
                containerQuery = (0, fuzzyScorer_1.pieceToQuery)(query.values.slice(1)); // container: match on all but first parts
            }
            else {
                symbolQuery = query;
            }
            // Convert to symbol picks and apply filtering
            let buttons;
            const openSideBySideDirection = this.options?.openSideBySideDirection?.();
            if (openSideBySideDirection) {
                buttons = [{
                        iconClass: openSideBySideDirection === 'right' ? themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitHorizontal) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitVertical),
                        tooltip: openSideBySideDirection === 'right' ? (0, nls_1.localize)('openToSide', "Open to the Side") : (0, nls_1.localize)('openToBottom', "Open to the Bottom")
                    }];
            }
            const filteredSymbolPicks = [];
            for (let index = 0; index < symbols.length; index++) {
                const symbol = symbols[index];
                const symbolLabel = (0, strings_1.trim)(symbol.name);
                const symbolLabelWithIcon = `$(${languages_1.SymbolKinds.toIcon(symbol.kind).id}) ${symbolLabel}`;
                const symbolLabelIconOffset = symbolLabelWithIcon.length - symbolLabel.length;
                let containerLabel = symbol.containerName;
                if (options?.extraContainerLabel) {
                    if (containerLabel) {
                        containerLabel = `${options.extraContainerLabel} • ${containerLabel}`;
                    }
                    else {
                        containerLabel = options.extraContainerLabel;
                    }
                }
                let symbolScore = undefined;
                let symbolMatches = undefined;
                let containerScore = undefined;
                let containerMatches = undefined;
                if (query.original.length > filterPos) {
                    // First: try to score on the entire query, it is possible that
                    // the symbol matches perfectly (e.g. searching for "change log"
                    // can be a match on a markdown symbol "change log"). In that
                    // case we want to skip the container query altogether.
                    let skipContainerQuery = false;
                    if (symbolQuery !== query) {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, { ...query, values: undefined /* disable multi-query support */ }, filterPos, symbolLabelIconOffset);
                        if (typeof symbolScore === 'number') {
                            skipContainerQuery = true; // since we consumed the query, skip any container matching
                        }
                    }
                    // Otherwise: score on the symbol query and match on the container later
                    if (typeof symbolScore !== 'number') {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, symbolQuery, filterPos, symbolLabelIconOffset);
                        if (typeof symbolScore !== 'number') {
                            continue;
                        }
                    }
                    // Score by container if specified
                    if (!skipContainerQuery && containerQuery) {
                        if (containerLabel && containerQuery.original.length > 0) {
                            [containerScore, containerMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(containerLabel, containerQuery);
                        }
                        if (typeof containerScore !== 'number') {
                            continue;
                        }
                        if (typeof symbolScore === 'number') {
                            symbolScore += containerScore; // boost symbolScore by containerScore
                        }
                    }
                }
                const deprecated = symbol.tags && symbol.tags.indexOf(1 /* SymbolTag.Deprecated */) >= 0;
                filteredSymbolPicks.push({
                    index,
                    kind: symbol.kind,
                    score: symbolScore,
                    label: symbolLabelWithIcon,
                    ariaLabel: (0, languages_1.getAriaLabelForSymbol)(symbol.name, symbol.kind),
                    description: containerLabel,
                    highlights: deprecated ? undefined : {
                        label: symbolMatches,
                        description: containerMatches
                    },
                    range: {
                        selection: range_1.Range.collapseToStart(symbol.selectionRange),
                        decoration: symbol.range
                    },
                    strikethrough: deprecated,
                    buttons
                });
            }
            // Sort by score
            const sortedFilteredSymbolPicks = filteredSymbolPicks.sort((symbolA, symbolB) => filterBySymbolKind ?
                this.compareByKindAndScore(symbolA, symbolB) :
                this.compareByScore(symbolA, symbolB));
            // Add separator for types
            // - @  only total number of symbols
            // - @: grouped by symbol kind
            let symbolPicks = [];
            if (filterBySymbolKind) {
                let lastSymbolKind = undefined;
                let lastSeparator = undefined;
                let lastSymbolKindCounter = 0;
                function updateLastSeparatorLabel() {
                    if (lastSeparator && typeof lastSymbolKind === 'number' && lastSymbolKindCounter > 0) {
                        lastSeparator.label = (0, strings_1.format)(NLS_SYMBOL_KIND_CACHE[lastSymbolKind] || FALLBACK_NLS_SYMBOL_KIND, lastSymbolKindCounter);
                    }
                }
                for (const symbolPick of sortedFilteredSymbolPicks) {
                    // Found new kind
                    if (lastSymbolKind !== symbolPick.kind) {
                        // Update last separator with number of symbols we found for kind
                        updateLastSeparatorLabel();
                        lastSymbolKind = symbolPick.kind;
                        lastSymbolKindCounter = 1;
                        // Add new separator for new kind
                        lastSeparator = { type: 'separator' };
                        symbolPicks.push(lastSeparator);
                    }
                    // Existing kind, keep counting
                    else {
                        lastSymbolKindCounter++;
                    }
                    // Add to final result
                    symbolPicks.push(symbolPick);
                }
                // Update last separator with number of symbols we found for kind
                updateLastSeparatorLabel();
            }
            else if (sortedFilteredSymbolPicks.length > 0) {
                symbolPicks = [
                    { label: (0, nls_1.localize)('symbols', "symbols ({0})", filteredSymbolPicks.length), type: 'separator' },
                    ...sortedFilteredSymbolPicks
                ];
            }
            return symbolPicks;
        }
        compareByScore(symbolA, symbolB) {
            if (typeof symbolA.score !== 'number' && typeof symbolB.score === 'number') {
                return 1;
            }
            else if (typeof symbolA.score === 'number' && typeof symbolB.score !== 'number') {
                return -1;
            }
            if (typeof symbolA.score === 'number' && typeof symbolB.score === 'number') {
                if (symbolA.score > symbolB.score) {
                    return -1;
                }
                else if (symbolA.score < symbolB.score) {
                    return 1;
                }
            }
            if (symbolA.index < symbolB.index) {
                return -1;
            }
            else if (symbolA.index > symbolB.index) {
                return 1;
            }
            return 0;
        }
        compareByKindAndScore(symbolA, symbolB) {
            const kindA = NLS_SYMBOL_KIND_CACHE[symbolA.kind] || FALLBACK_NLS_SYMBOL_KIND;
            const kindB = NLS_SYMBOL_KIND_CACHE[symbolB.kind] || FALLBACK_NLS_SYMBOL_KIND;
            // Sort by type first if scoped search
            const result = kindA.localeCompare(kindB);
            if (result === 0) {
                return this.compareByScore(symbolA, symbolB);
            }
            return result;
        }
        async getDocumentSymbols(document, token) {
            const model = await this._outlineModelService.getOrCreate(document, token);
            return token.isCancellationRequested ? [] : model.asListOfDocumentSymbols();
        }
    };
    exports.AbstractGotoSymbolQuickAccessProvider = AbstractGotoSymbolQuickAccessProvider;
    exports.AbstractGotoSymbolQuickAccessProvider = AbstractGotoSymbolQuickAccessProvider = AbstractGotoSymbolQuickAccessProvider_1 = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, outlineModel_1.IOutlineModelService)
    ], AbstractGotoSymbolQuickAccessProvider);
    // #region NLS Helpers
    const FALLBACK_NLS_SYMBOL_KIND = (0, nls_1.localize)('property', "properties ({0})");
    const NLS_SYMBOL_KIND_CACHE = {
        [5 /* SymbolKind.Method */]: (0, nls_1.localize)('method', "methods ({0})"),
        [11 /* SymbolKind.Function */]: (0, nls_1.localize)('function', "functions ({0})"),
        [8 /* SymbolKind.Constructor */]: (0, nls_1.localize)('_constructor', "constructors ({0})"),
        [12 /* SymbolKind.Variable */]: (0, nls_1.localize)('variable', "variables ({0})"),
        [4 /* SymbolKind.Class */]: (0, nls_1.localize)('class', "classes ({0})"),
        [22 /* SymbolKind.Struct */]: (0, nls_1.localize)('struct', "structs ({0})"),
        [23 /* SymbolKind.Event */]: (0, nls_1.localize)('event', "events ({0})"),
        [24 /* SymbolKind.Operator */]: (0, nls_1.localize)('operator', "operators ({0})"),
        [10 /* SymbolKind.Interface */]: (0, nls_1.localize)('interface', "interfaces ({0})"),
        [2 /* SymbolKind.Namespace */]: (0, nls_1.localize)('namespace', "namespaces ({0})"),
        [3 /* SymbolKind.Package */]: (0, nls_1.localize)('package', "packages ({0})"),
        [25 /* SymbolKind.TypeParameter */]: (0, nls_1.localize)('typeParameter', "type parameters ({0})"),
        [1 /* SymbolKind.Module */]: (0, nls_1.localize)('modules', "modules ({0})"),
        [6 /* SymbolKind.Property */]: (0, nls_1.localize)('property', "properties ({0})"),
        [9 /* SymbolKind.Enum */]: (0, nls_1.localize)('enum', "enumerations ({0})"),
        [21 /* SymbolKind.EnumMember */]: (0, nls_1.localize)('enumMember', "enumeration members ({0})"),
        [14 /* SymbolKind.String */]: (0, nls_1.localize)('string', "strings ({0})"),
        [0 /* SymbolKind.File */]: (0, nls_1.localize)('file', "files ({0})"),
        [17 /* SymbolKind.Array */]: (0, nls_1.localize)('array', "arrays ({0})"),
        [15 /* SymbolKind.Number */]: (0, nls_1.localize)('number', "numbers ({0})"),
        [16 /* SymbolKind.Boolean */]: (0, nls_1.localize)('boolean', "booleans ({0})"),
        [18 /* SymbolKind.Object */]: (0, nls_1.localize)('object', "objects ({0})"),
        [19 /* SymbolKind.Key */]: (0, nls_1.localize)('key', "keys ({0})"),
        [7 /* SymbolKind.Field */]: (0, nls_1.localize)('field', "fields ({0})"),
        [13 /* SymbolKind.Constant */]: (0, nls_1.localize)('constant', "constants ({0})")
    };
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b1N5bWJvbFF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9xdWlja0FjY2Vzcy9icm93c2VyL2dvdG9TeW1ib2xRdWlja0FjY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaUN6RixJQUFlLHFDQUFxQyxHQUFwRCxNQUFlLHFDQUFzQyxTQUFRLHlFQUEyQzs7aUJBRXZHLFdBQU0sR0FBRyxHQUFHLEFBQU4sQ0FBTztpQkFDYixpQkFBWSxHQUFHLEdBQUcsQUFBTixDQUFPO2lCQUNuQix1QkFBa0IsR0FBRyxHQUFHLHVDQUFxQyxDQUFDLE1BQU0sR0FBRyx1Q0FBcUMsQ0FBQyxZQUFZLEVBQUUsQUFBekcsQ0FBMEc7UUFJbkksWUFDNEMsd0JBQWtELEVBQ3RELG9CQUEwQyxFQUNqRixVQUFpRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUVwRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFKNEIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUN0RCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBS2pGLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1FBQzNDLENBQUM7UUFFUyx3QkFBd0IsQ0FBQyxNQUE0QztZQUM5RSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLHNFQUFzRSxDQUFDLENBQUMsQ0FBQztZQUVwSixPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDO1FBQ3hCLENBQUM7UUFFUyxxQkFBcUIsQ0FBQyxPQUFzQyxFQUFFLE1BQTRDLEVBQUUsS0FBd0I7WUFDN0ksTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLHNCQUFVLENBQUMsSUFBSSxDQUFDO1lBQ3hCLENBQUM7WUFFRCxzREFBc0Q7WUFDdEQsSUFBSSxJQUFJLENBQUMsd0JBQXdCLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3JFLE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCx1REFBdUQ7WUFDdkQsc0RBQXNEO1lBQ3RELG9CQUFvQjtZQUNwQixPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBRU8sNkJBQTZCLENBQUMsT0FBc0MsRUFBRSxLQUFpQixFQUFFLE1BQTRDLEVBQUUsS0FBd0I7WUFDdEssTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFMUMscURBQXFEO1lBQ3JELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsMENBQTBDLEVBQUUsNkRBQTZELENBQUMsQ0FBQyxDQUFDO1lBRW5KLHlEQUF5RDtZQUN6RCw2REFBNkQ7WUFDN0QsdURBQXVEO1lBQ3ZELDhCQUE4QjtZQUM5QixtREFBbUQ7WUFDbkQsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDWCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQzVFLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JBQzlDLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFFTCxPQUFPLFdBQVcsQ0FBQztRQUNwQixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsTUFBNEMsRUFBRSxLQUFhO1lBQ25GLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksNEJBQW1CLEVBQUUsQ0FBQyxDQUFDO1lBQzlELE1BQU0sQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQzFCLENBQUM7UUFFUyxLQUFLLENBQUMsNkJBQTZCLENBQUMsS0FBaUIsRUFBRSxXQUE0QjtZQUM1RixJQUFJLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDckUsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSw2QkFBNkIsR0FBRyxJQUFJLHVCQUFlLEVBQVcsQ0FBQztZQUVyRSw0Q0FBNEM7WUFDNUMsTUFBTSxzQkFBc0IsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO2dCQUNwSCxJQUFJLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDckUsc0JBQXNCLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBRWpDLDZCQUE2QixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiwyQ0FBMkM7WUFDM0MsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsNkJBQTZCLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVuRixPQUFPLDZCQUE2QixDQUFDLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU8sMEJBQTBCLENBQUMsT0FBc0MsRUFBRSxLQUFpQixFQUFFLE1BQTRDLEVBQUUsS0FBd0I7WUFDbkssTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztZQUM5QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUUxQywwQkFBMEI7WUFDMUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMxQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQztnQkFDcEMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN4QixJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7b0JBRXhILElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ3pCLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDZixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosc0NBQXNDO1lBQ3RDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFO2dCQUMxRCxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUU1RyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixvREFBb0Q7WUFDcEQsK0NBQStDO1lBQy9DLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFN0QsdUNBQXVDO1lBQ3ZDLElBQUksUUFBUSxHQUF3QyxTQUFTLENBQUM7WUFDOUQsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLEVBQUUsaUJBQXVDLEVBQUUsRUFBRTtnQkFFM0UsNkNBQTZDO2dCQUM3QyxRQUFRLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN4QixNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztnQkFFcEIsOENBQThDO2dCQUM5QyxRQUFRLEdBQUcsSUFBSSxzQ0FBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFOUMsdUJBQXVCO2dCQUN2QixNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDbkIsSUFBSSxDQUFDO29CQUNKLE1BQU0sS0FBSyxHQUFHLElBQUEsMEJBQVksRUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyx1Q0FBcUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDNUcsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUM1RixJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNuQyxPQUFPO29CQUNSLENBQUM7b0JBRUQsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUN0QixNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzt3QkFDckIsSUFBSSxpQkFBaUIsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQzs0QkFDdEQsTUFBTSxTQUFTLEdBQTZCLElBQUEscUJBQVEsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxhQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQzFMLElBQUksU0FBUyxFQUFFLENBQUM7Z0NBQ2YsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzRCQUNsQyxDQUFDO3dCQUNGLENBQUM7b0JBRUYsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQy9CLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO3dCQUNsRyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7d0JBQ2pGLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO3dCQUFTLENBQUM7b0JBQ1YsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNwQyxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztvQkFDckIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0YsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdFLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBR3hELCtDQUErQztZQUMvQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUU7Z0JBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO2dCQUNsQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBRXhCLFNBQVM7b0JBQ1QsTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyw0QkFBb0IsQ0FBQztvQkFFcEUsV0FBVztvQkFDWCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFUyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsY0FBeUMsRUFBRSxLQUFxQixFQUFFLE9BQXFELEVBQUUsS0FBd0I7WUFDakwsTUFBTSxPQUFPLEdBQUcsTUFBTSxjQUFjLENBQUM7WUFDckMsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyx1Q0FBcUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUcsTUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdDLDJDQUEyQztZQUMzQyxJQUFJLFdBQTJCLENBQUM7WUFDaEMsSUFBSSxjQUEwQyxDQUFDO1lBQy9DLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0MsV0FBVyxHQUFHLElBQUEsMEJBQVksRUFBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBSyxtQ0FBbUM7Z0JBQ3BGLGNBQWMsR0FBRyxJQUFBLDBCQUFZLEVBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDBDQUEwQztZQUNqRyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUNyQixDQUFDO1lBRUQsOENBQThDO1lBRTlDLElBQUksT0FBd0MsQ0FBQztZQUM3QyxNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsRUFBRSxDQUFDO1lBQzFFLElBQUksdUJBQXVCLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxHQUFHLENBQUM7d0JBQ1YsU0FBUyxFQUFFLHVCQUF1QixLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxhQUFhLENBQUM7d0JBQzlJLE9BQU8sRUFBRSx1QkFBdUIsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsb0JBQW9CLENBQUM7cUJBQzFJLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUErQixFQUFFLENBQUM7WUFDM0QsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztnQkFDckQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUU5QixNQUFNLFdBQVcsR0FBRyxJQUFBLGNBQUksRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyx1QkFBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUN0RixNQUFNLHFCQUFxQixHQUFHLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO2dCQUU5RSxJQUFJLGNBQWMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO2dCQUMxQyxJQUFJLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxDQUFDO29CQUNsQyxJQUFJLGNBQWMsRUFBRSxDQUFDO3dCQUNwQixjQUFjLEdBQUcsR0FBRyxPQUFPLENBQUMsbUJBQW1CLE1BQU0sY0FBYyxFQUFFLENBQUM7b0JBQ3ZFLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxjQUFjLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDO29CQUM5QyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxXQUFXLEdBQXVCLFNBQVMsQ0FBQztnQkFDaEQsSUFBSSxhQUFhLEdBQXlCLFNBQVMsQ0FBQztnQkFFcEQsSUFBSSxjQUFjLEdBQXVCLFNBQVMsQ0FBQztnQkFDbkQsSUFBSSxnQkFBZ0IsR0FBeUIsU0FBUyxDQUFDO2dCQUV2RCxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLFNBQVMsRUFBRSxDQUFDO29CQUV2QywrREFBK0Q7b0JBQy9ELGdFQUFnRTtvQkFDaEUsNkRBQTZEO29CQUM3RCx1REFBdUQ7b0JBQ3ZELElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO29CQUMvQixJQUFJLFdBQVcsS0FBSyxLQUFLLEVBQUUsQ0FBQzt3QkFDM0IsQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLEdBQUcsSUFBQSx5QkFBVyxFQUFDLG1CQUFtQixFQUFFLEVBQUUsR0FBRyxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxpQ0FBaUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO3dCQUNySyxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDOzRCQUNyQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsQ0FBQywyREFBMkQ7d0JBQ3ZGLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCx3RUFBd0U7b0JBQ3hFLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7d0JBQ3JDLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUEseUJBQVcsRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLHFCQUFxQixDQUFDLENBQUM7d0JBQy9HLElBQUksT0FBTyxXQUFXLEtBQUssUUFBUSxFQUFFLENBQUM7NEJBQ3JDLFNBQVM7d0JBQ1YsQ0FBQztvQkFDRixDQUFDO29CQUVELGtDQUFrQztvQkFDbEMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLGNBQWMsRUFBRSxDQUFDO3dCQUMzQyxJQUFJLGNBQWMsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDMUQsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxJQUFBLHlCQUFXLEVBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO3dCQUNsRixDQUFDO3dCQUVELElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxFQUFFLENBQUM7NEJBQ3hDLFNBQVM7d0JBQ1YsQ0FBQzt3QkFFRCxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDOzRCQUNyQyxXQUFXLElBQUksY0FBYyxDQUFDLENBQUMsc0NBQXNDO3dCQUN0RSxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyw4QkFBc0IsSUFBSSxDQUFDLENBQUM7Z0JBRWpGLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDeEIsS0FBSztvQkFDTCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7b0JBQ2pCLEtBQUssRUFBRSxXQUFXO29CQUNsQixLQUFLLEVBQUUsbUJBQW1CO29CQUMxQixTQUFTLEVBQUUsSUFBQSxpQ0FBcUIsRUFBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUM7b0JBQzFELFdBQVcsRUFBRSxjQUFjO29CQUMzQixVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO3dCQUNwQyxLQUFLLEVBQUUsYUFBYTt3QkFDcEIsV0FBVyxFQUFFLGdCQUFnQjtxQkFDN0I7b0JBQ0QsS0FBSyxFQUFFO3dCQUNOLFNBQVMsRUFBRSxhQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7d0JBQ3ZELFVBQVUsRUFBRSxNQUFNLENBQUMsS0FBSztxQkFDeEI7b0JBQ0QsYUFBYSxFQUFFLFVBQVU7b0JBQ3pCLE9BQU87aUJBQ1AsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELGdCQUFnQjtZQUNoQixNQUFNLHlCQUF5QixHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3BHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQ3JDLENBQUM7WUFFRiwwQkFBMEI7WUFDMUIsb0NBQW9DO1lBQ3BDLDhCQUE4QjtZQUM5QixJQUFJLFdBQVcsR0FBMEQsRUFBRSxDQUFDO1lBQzVFLElBQUksa0JBQWtCLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxjQUFjLEdBQTJCLFNBQVMsQ0FBQztnQkFDdkQsSUFBSSxhQUFhLEdBQW9DLFNBQVMsQ0FBQztnQkFDL0QsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7Z0JBRTlCLFNBQVMsd0JBQXdCO29CQUNoQyxJQUFJLGFBQWEsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLElBQUkscUJBQXFCLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3RGLGFBQWEsQ0FBQyxLQUFLLEdBQUcsSUFBQSxnQkFBTSxFQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxJQUFJLHdCQUF3QixFQUFFLHFCQUFxQixDQUFDLENBQUM7b0JBQ3hILENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxLQUFLLE1BQU0sVUFBVSxJQUFJLHlCQUF5QixFQUFFLENBQUM7b0JBRXBELGlCQUFpQjtvQkFDakIsSUFBSSxjQUFjLEtBQUssVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUV4QyxpRUFBaUU7d0JBQ2pFLHdCQUF3QixFQUFFLENBQUM7d0JBRTNCLGNBQWMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO3dCQUNqQyxxQkFBcUIsR0FBRyxDQUFDLENBQUM7d0JBRTFCLGlDQUFpQzt3QkFDakMsYUFBYSxHQUFHLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDO3dCQUN0QyxXQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUNqQyxDQUFDO29CQUVELCtCQUErQjt5QkFDMUIsQ0FBQzt3QkFDTCxxQkFBcUIsRUFBRSxDQUFDO29CQUN6QixDQUFDO29CQUVELHNCQUFzQjtvQkFDdEIsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFFRCxpRUFBaUU7Z0JBQ2pFLHdCQUF3QixFQUFFLENBQUM7WUFDNUIsQ0FBQztpQkFBTSxJQUFJLHlCQUF5QixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDakQsV0FBVyxHQUFHO29CQUNiLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRTtvQkFDOUYsR0FBRyx5QkFBeUI7aUJBQzVCLENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxXQUFXLENBQUM7UUFDcEIsQ0FBQztRQUVPLGNBQWMsQ0FBQyxPQUFpQyxFQUFFLE9BQWlDO1lBQzFGLElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzVFLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztpQkFBTSxJQUFJLE9BQU8sT0FBTyxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNuRixPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUVELElBQUksT0FBTyxPQUFPLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzVFLElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ25DLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQztxQkFBTSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUMxQyxPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzFDLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUVELE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQztRQUVPLHFCQUFxQixDQUFDLE9BQWlDLEVBQUUsT0FBaUM7WUFDakcsTUFBTSxLQUFLLEdBQUcscUJBQXFCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLHdCQUF3QixDQUFDO1lBQzlFLE1BQU0sS0FBSyxHQUFHLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSx3QkFBd0IsQ0FBQztZQUU5RSxzQ0FBc0M7WUFDdEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRVMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQW9CLEVBQUUsS0FBd0I7WUFDaEYsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzRSxPQUFPLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUM3RSxDQUFDOztJQTNZb0Isc0ZBQXFDO29EQUFyQyxxQ0FBcUM7UUFTeEQsV0FBQSwyQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLG1DQUFvQixDQUFBO09BVkQscUNBQXFDLENBNFkxRDtJQUVELHNCQUFzQjtJQUV0QixNQUFNLHdCQUF3QixHQUFHLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQzFFLE1BQU0scUJBQXFCLEdBQStCO1FBQ3pELDJCQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxlQUFlLENBQUM7UUFDeEQsOEJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDO1FBQzlELGdDQUF3QixFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQztRQUN4RSw4QkFBcUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUM7UUFDOUQsMEJBQWtCLEVBQUUsSUFBQSxjQUFRLEVBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQztRQUN0RCw0QkFBbUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsZUFBZSxDQUFDO1FBQ3hELDJCQUFrQixFQUFFLElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxjQUFjLENBQUM7UUFDckQsOEJBQXFCLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDO1FBQzlELCtCQUFzQixFQUFFLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQztRQUNqRSw4QkFBc0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsa0JBQWtCLENBQUM7UUFDakUsNEJBQW9CLEVBQUUsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDO1FBQzNELG1DQUEwQixFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQztRQUM5RSwyQkFBbUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsZUFBZSxDQUFDO1FBQ3pELDZCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQztRQUMvRCx5QkFBaUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxNQUFNLEVBQUUsb0JBQW9CLENBQUM7UUFDekQsZ0NBQXVCLEVBQUUsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLDJCQUEyQixDQUFDO1FBQzVFLDRCQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxlQUFlLENBQUM7UUFDeEQseUJBQWlCLEVBQUUsSUFBQSxjQUFRLEVBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQztRQUNsRCwyQkFBa0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDO1FBQ3JELDRCQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxlQUFlLENBQUM7UUFDeEQsNkJBQW9CLEVBQUUsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDO1FBQzNELDRCQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxlQUFlLENBQUM7UUFDeEQseUJBQWdCLEVBQUUsSUFBQSxjQUFRLEVBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQztRQUMvQywwQkFBa0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxPQUFPLEVBQUUsY0FBYyxDQUFDO1FBQ3JELDhCQUFxQixFQUFFLElBQUEsY0FBUSxFQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQztLQUM5RCxDQUFDOztBQUVGLFlBQVkifQ==