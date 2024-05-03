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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/async", "vs/workbench/contrib/search/common/search", "vs/editor/common/languages", "vs/platform/label/common/label", "vs/base/common/network", "vs/platform/opener/common/opener", "vs/workbench/services/editor/common/editorService", "vs/editor/common/core/range", "vs/platform/configuration/common/configuration", "vs/editor/browser/services/codeEditorService", "vs/editor/contrib/find/browser/findController", "vs/base/common/fuzzyScorer", "vs/base/common/codicons", "vs/base/common/themables"], function (require, exports, nls_1, pickerQuickAccess_1, async_1, search_1, languages_1, label_1, network_1, opener_1, editorService_1, range_1, configuration_1, codeEditorService_1, findController_1, fuzzyScorer_1, codicons_1, themables_1) {
    "use strict";
    var SymbolsQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SymbolsQuickAccessProvider = void 0;
    let SymbolsQuickAccessProvider = class SymbolsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { SymbolsQuickAccessProvider_1 = this; }
        static { this.PREFIX = '#'; }
        static { this.TYPING_SEARCH_DELAY = 200; } // this delay accommodates for the user typing a word and then stops typing to start searching
        static { this.TREAT_AS_GLOBAL_SYMBOL_TYPES = new Set([
            4 /* SymbolKind.Class */,
            9 /* SymbolKind.Enum */,
            0 /* SymbolKind.File */,
            10 /* SymbolKind.Interface */,
            2 /* SymbolKind.Namespace */,
            3 /* SymbolKind.Package */,
            1 /* SymbolKind.Module */
        ]); }
        get defaultFilterValue() {
            // Prefer the word under the cursor in the active editor as default filter
            const editor = this.codeEditorService.getFocusedCodeEditor();
            if (editor) {
                return (0, findController_1.getSelectionSearchString)(editor) ?? undefined;
            }
            return undefined;
        }
        constructor(labelService, openerService, editorService, configurationService, codeEditorService) {
            super(SymbolsQuickAccessProvider_1.PREFIX, {
                canAcceptInBackground: true,
                noResultsPick: {
                    label: (0, nls_1.localize)('noSymbolResults', "No matching workspace symbols")
                }
            });
            this.labelService = labelService;
            this.openerService = openerService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.codeEditorService = codeEditorService;
            this.delayer = this._register(new async_1.ThrottledDelayer(SymbolsQuickAccessProvider_1.TYPING_SEARCH_DELAY));
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench?.editor;
            return {
                openEditorPinned: !editorConfig?.enablePreviewFromQuickOpen || !editorConfig?.enablePreview,
                openSideBySideDirection: editorConfig?.openSideBySideDirection
            };
        }
        _getPicks(filter, disposables, token) {
            return this.getSymbolPicks(filter, undefined, token);
        }
        async getSymbolPicks(filter, options, token) {
            return this.delayer.trigger(async () => {
                if (token.isCancellationRequested) {
                    return [];
                }
                return this.doGetSymbolPicks((0, fuzzyScorer_1.prepareQuery)(filter), options, token);
            }, options?.delay);
        }
        async doGetSymbolPicks(query, options, token) {
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
            // Run the workspace symbol query
            const workspaceSymbols = await (0, search_1.getWorkspaceSymbols)(symbolQuery.original, token);
            if (token.isCancellationRequested) {
                return [];
            }
            const symbolPicks = [];
            // Convert to symbol picks and apply filtering
            const openSideBySideDirection = this.configuration.openSideBySideDirection;
            for (const { symbol, provider } of workspaceSymbols) {
                // Depending on the workspace symbols filter setting, skip over symbols that:
                // - do not have a container
                // - and are not treated explicitly as global symbols (e.g. classes)
                if (options?.skipLocal && !SymbolsQuickAccessProvider_1.TREAT_AS_GLOBAL_SYMBOL_TYPES.has(symbol.kind) && !!symbol.containerName) {
                    continue;
                }
                const symbolLabel = symbol.name;
                const symbolLabelWithIcon = `$(${languages_1.SymbolKinds.toIcon(symbol.kind).id}) ${symbolLabel}`;
                const symbolLabelIconOffset = symbolLabelWithIcon.length - symbolLabel.length;
                // Score by symbol label if searching
                let symbolScore = undefined;
                let symbolMatches = undefined;
                let skipContainerQuery = false;
                if (symbolQuery.original.length > 0) {
                    // First: try to score on the entire query, it is possible that
                    // the symbol matches perfectly (e.g. searching for "change log"
                    // can be a match on a markdown symbol "change log"). In that
                    // case we want to skip the container query altogether.
                    if (symbolQuery !== query) {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, { ...query, values: undefined /* disable multi-query support */ }, 0, symbolLabelIconOffset);
                        if (typeof symbolScore === 'number') {
                            skipContainerQuery = true; // since we consumed the query, skip any container matching
                        }
                    }
                    // Otherwise: score on the symbol query and match on the container later
                    if (typeof symbolScore !== 'number') {
                        [symbolScore, symbolMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(symbolLabelWithIcon, symbolQuery, 0, symbolLabelIconOffset);
                        if (typeof symbolScore !== 'number') {
                            continue;
                        }
                    }
                }
                const symbolUri = symbol.location.uri;
                let containerLabel = undefined;
                if (symbolUri) {
                    const containerPath = this.labelService.getUriLabel(symbolUri, { relative: true });
                    if (symbol.containerName) {
                        containerLabel = `${symbol.containerName} • ${containerPath}`;
                    }
                    else {
                        containerLabel = containerPath;
                    }
                }
                // Score by container if specified and searching
                let containerScore = undefined;
                let containerMatches = undefined;
                if (!skipContainerQuery && containerQuery && containerQuery.original.length > 0) {
                    if (containerLabel) {
                        [containerScore, containerMatches] = (0, fuzzyScorer_1.scoreFuzzy2)(containerLabel, containerQuery);
                    }
                    if (typeof containerScore !== 'number') {
                        continue;
                    }
                    if (typeof symbolScore === 'number') {
                        symbolScore += containerScore; // boost symbolScore by containerScore
                    }
                }
                const deprecated = symbol.tags ? symbol.tags.indexOf(1 /* SymbolTag.Deprecated */) >= 0 : false;
                symbolPicks.push({
                    symbol,
                    resource: symbolUri,
                    score: symbolScore,
                    label: symbolLabelWithIcon,
                    ariaLabel: symbolLabel,
                    highlights: deprecated ? undefined : {
                        label: symbolMatches,
                        description: containerMatches
                    },
                    description: containerLabel,
                    strikethrough: deprecated,
                    buttons: [
                        {
                            iconClass: openSideBySideDirection === 'right' ? themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitHorizontal) : themables_1.ThemeIcon.asClassName(codicons_1.Codicon.splitVertical),
                            tooltip: openSideBySideDirection === 'right' ? (0, nls_1.localize)('openToSide', "Open to the Side") : (0, nls_1.localize)('openToBottom', "Open to the Bottom")
                        }
                    ],
                    trigger: (buttonIndex, keyMods) => {
                        this.openSymbol(provider, symbol, token, { keyMods, forceOpenSideBySide: true });
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    },
                    accept: async (keyMods, event) => this.openSymbol(provider, symbol, token, { keyMods, preserveFocus: event.inBackground, forcePinned: event.inBackground }),
                });
            }
            // Sort picks (unless disabled)
            if (!options?.skipSorting) {
                symbolPicks.sort((symbolA, symbolB) => this.compareSymbols(symbolA, symbolB));
            }
            return symbolPicks;
        }
        async openSymbol(provider, symbol, token, options) {
            // Resolve actual symbol to open for providers that can resolve
            let symbolToOpen = symbol;
            if (typeof provider.resolveWorkspaceSymbol === 'function') {
                symbolToOpen = await provider.resolveWorkspaceSymbol(symbol, token) || symbol;
                if (token.isCancellationRequested) {
                    return;
                }
            }
            // Open HTTP(s) links with opener service
            if (symbolToOpen.location.uri.scheme === network_1.Schemas.http || symbolToOpen.location.uri.scheme === network_1.Schemas.https) {
                await this.openerService.open(symbolToOpen.location.uri, { fromUserGesture: true, allowContributedOpeners: true });
            }
            // Otherwise open as editor
            else {
                await this.editorService.openEditor({
                    resource: symbolToOpen.location.uri,
                    options: {
                        preserveFocus: options?.preserveFocus,
                        pinned: options.keyMods.ctrlCmd || options.forcePinned || this.configuration.openEditorPinned,
                        selection: symbolToOpen.location.range ? range_1.Range.collapseToStart(symbolToOpen.location.range) : undefined
                    }
                }, options.keyMods.alt || (this.configuration.openEditorPinned && options.keyMods.ctrlCmd) || options?.forceOpenSideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            }
        }
        compareSymbols(symbolA, symbolB) {
            // By score
            if (typeof symbolA.score === 'number' && typeof symbolB.score === 'number') {
                if (symbolA.score > symbolB.score) {
                    return -1;
                }
                if (symbolA.score < symbolB.score) {
                    return 1;
                }
            }
            // By name
            if (symbolA.symbol && symbolB.symbol) {
                const symbolAName = symbolA.symbol.name.toLowerCase();
                const symbolBName = symbolB.symbol.name.toLowerCase();
                const res = symbolAName.localeCompare(symbolBName);
                if (res !== 0) {
                    return res;
                }
            }
            // By kind
            if (symbolA.symbol && symbolB.symbol) {
                const symbolAKind = languages_1.SymbolKinds.toIcon(symbolA.symbol.kind).id;
                const symbolBKind = languages_1.SymbolKinds.toIcon(symbolB.symbol.kind).id;
                return symbolAKind.localeCompare(symbolBKind);
            }
            return 0;
        }
    };
    exports.SymbolsQuickAccessProvider = SymbolsQuickAccessProvider;
    exports.SymbolsQuickAccessProvider = SymbolsQuickAccessProvider = SymbolsQuickAccessProvider_1 = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, opener_1.IOpenerService),
        __param(2, editorService_1.IEditorService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, codeEditorService_1.ICodeEditorService)
    ], SymbolsQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ltYm9sc1F1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9zeW1ib2xzUXVpY2tBY2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZCekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSw2Q0FBK0M7O2lCQUV2RixXQUFNLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBRUksd0JBQW1CLEdBQUcsR0FBRyxBQUFOLENBQU8sR0FBQyw4RkFBOEY7aUJBRWxJLGlDQUE0QixHQUFHLElBQUksR0FBRyxDQUFhOzs7Ozs7OztTQVFqRSxDQUFDLEFBUnlDLENBUXhDO1FBSUgsSUFBSSxrQkFBa0I7WUFFckIsMEVBQTBFO1lBQzFFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzdELElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osT0FBTyxJQUFBLHlDQUF3QixFQUFDLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQztZQUN0RCxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELFlBQ2dCLFlBQTRDLEVBQzNDLGFBQThDLEVBQzlDLGFBQThDLEVBQ3ZDLG9CQUE0RCxFQUMvRCxpQkFBc0Q7WUFFMUUsS0FBSyxDQUFDLDRCQUEwQixDQUFDLE1BQU0sRUFBRTtnQkFDeEMscUJBQXFCLEVBQUUsSUFBSTtnQkFDM0IsYUFBYSxFQUFFO29CQUNkLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSwrQkFBK0IsQ0FBQztpQkFDbkU7YUFDRCxDQUFDLENBQUM7WUFYNkIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDMUIsa0JB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