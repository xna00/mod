var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/themables", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/quickinput/common/quickAccess", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/search/browser/searchView", "vs/workbench/contrib/search/common/search", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search", "vs/base/common/event", "vs/workbench/browser/quickaccess", "vs/workbench/services/views/common/viewsService", "vs/base/common/async"], function (require, exports, cancellation_1, lifecycle_1, map_1, resources_1, themables_1, nls_1, configuration_1, instantiation_1, label_1, listService_1, pickerQuickAccess_1, quickAccess_1, quickInput_1, workspace_1, searchIcons_1, searchModel_1, searchView_1, search_1, editorService_1, queryBuilder_1, search_2, event_1, quickaccess_1, viewsService_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextSearchQuickAccess = exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX = void 0;
    exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX = '%';
    const DEFAULT_TEXT_QUERY_BUILDER_OPTIONS = {
        _reason: 'quickAccessSearch',
        disregardIgnoreFiles: false,
        disregardExcludeSettings: false,
        onlyOpenEditors: false,
        expandPatterns: true
    };
    const MAX_FILES_SHOWN = 30;
    const MAX_RESULTS_PER_FILE = 10;
    const DEBOUNCE_DELAY = 75;
    let TextSearchQuickAccess = class TextSearchQuickAccess extends pickerQuickAccess_1.PickerQuickAccessProvider {
        _getTextQueryBuilderOptions(charsPerLine) {
            return {
                ...DEFAULT_TEXT_QUERY_BUILDER_OPTIONS,
                ...{
                    extraFileResources: this._instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                    maxResults: this.configuration.maxResults ?? undefined,
                    isSmartCase: this.configuration.smartCase,
                },
                previewOptions: {
                    matchLines: 1,
                    charsPerLine
                }
            };
        }
        constructor(_instantiationService, _contextService, _editorService, _labelService, _viewsService, _configurationService) {
            super(exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX, { canAcceptInBackground: true, shouldSkipTrimPickFilter: true });
            this._instantiationService = _instantiationService;
            this._contextService = _contextService;
            this._editorService = _editorService;
            this._labelService = _labelService;
            this._viewsService = _viewsService;
            this._configurationService = _configurationService;
            this.currentAsyncSearch = Promise.resolve({
                results: [],
                messages: []
            });
            this.queryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            this.searchModel = this._register(this._instantiationService.createInstance(searchModel_1.SearchModel));
            this.editorViewState = this._register(this._instantiationService.createInstance(quickaccess_1.PickerEditorState));
            this.searchModel.location = searchModel_1.SearchModelLocation.QUICK_ACCESS;
            this.editorSequencer = new async_1.Sequencer();
        }
        dispose() {
            this.searchModel.dispose();
            super.dispose();
        }
        provide(picker, token, runOptions) {
            const disposables = new lifecycle_1.DisposableStore();
            if (exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX.length < picker.value.length) {
                picker.valueSelection = [exports.TEXT_SEARCH_QUICK_ACCESS_PREFIX.length, picker.value.length];
            }
            picker.customButton = true;
            picker.customLabel = '$(link-external)';
            this.editorViewState.reset();
            disposables.add(picker.onDidCustom(() => {
                if (this.searchModel.searchResult.count() > 0) {
                    this.moveToSearchViewlet(undefined);
                }
                else {
                    this._viewsService.openView(search_2.VIEW_ID, true);
                }
                picker.hide();
            }));
            const onDidChangeActive = () => {
                const [item] = picker.activeItems;
                if (item?.match) {
                    // we must remember our curret view state to be able to restore (will automatically track if there is already stored state)
                    this.editorViewState.set();
                    const itemMatch = item.match;
                    this.editorSequencer.queue(async () => {
                        await this.editorViewState.openTransientEditor({
                            resource: itemMatch.parent().resource,
                            options: { preserveFocus: true, revealIfOpened: true, ignoreError: true, selection: itemMatch.range() }
                        });
                    });
                }
            };
            disposables.add(event_1.Event.debounce(picker.onDidChangeActive, (last, event) => event, DEBOUNCE_DELAY, true)(onDidChangeActive));
            disposables.add(event_1.Event.once(picker.onWillHide)(({ reason }) => {
                // Restore view state upon cancellation if we changed it
                // but only when the picker was closed via explicit user
                // gesture and not e.g. when focus was lost because that
                // could mean the user clicked into the editor directly.
                if (reason === quickInput_1.QuickInputHideReason.Gesture) {
                    this.editorViewState.restore();
                }
            }));
            disposables.add(event_1.Event.once(picker.onDidHide)(({ reason }) => {
                this.searchModel.searchResult.toggleHighlights(false);
            }));
            disposables.add(super.provide(picker, token, runOptions));
            disposables.add(picker.onDidAccept(() => this.searchModel.searchResult.toggleHighlights(false)));
            return disposables;
        }
        get configuration() {
            const editorConfig = this._configurationService.getValue().workbench?.editor;
            const searchConfig = this._configurationService.getValue().search;
            return {
                openEditorPinned: !editorConfig?.enablePreviewFromQuickOpen || !editorConfig?.enablePreview,
                preserveInput: searchConfig.experimental.quickAccess.preserveInput,
                maxResults: searchConfig.maxResults,
                smartCase: searchConfig.smartCase,
            };
        }
        get defaultFilterValue() {
            if (this.configuration.preserveInput) {
                return quickAccess_1.DefaultQuickAccessFilterValue.LAST;
            }
            return undefined;
        }
        doSearch(contentPattern, token) {
            if (contentPattern === '') {
                return undefined;
            }
            const folderResources = this._contextService.getWorkspace().folders;
            const content = {
                pattern: contentPattern,
            };
            this.searchModel.searchResult.toggleHighlights(false);
            const charsPerLine = content.isRegExp ? 10000 : 1000; // from https://github.com/microsoft/vscode/blob/e7ad5651ac26fa00a40aa1e4010e81b92f655569/src/vs/workbench/contrib/search/browser/searchView.ts#L1508
            const query = this.queryBuilder.text(content, folderResources.map(folder => folder.uri), this._getTextQueryBuilderOptions(charsPerLine));
            const result = this.searchModel.search(query, undefined, token);
            const getAsyncResults = async () => {
                this.currentAsyncSearch = result.asyncResults;
                await result.asyncResults;
                const syncResultURIs = new map_1.ResourceSet(result.syncResults.map(e => e.resource));
                return this.searchModel.searchResult.matches().filter(e => !syncResultURIs.has(e.resource));
            };
            return {
                syncResults: this.searchModel.searchResult.matches(),
                asyncResults: getAsyncResults()
            };
        }
        moveToSearchViewlet(currentElem) {
            // this function takes this._searchModel and moves it to the search viewlet's search model.
            // then, this._searchModel will construct a new (empty) SearchModel.
            this._viewsService.openView(search_2.VIEW_ID, false);
            const viewlet = this._viewsService.getActiveViewWithId(search_2.VIEW_ID);
            viewlet.replaceSearchModel(this.searchModel, this.currentAsyncSearch);
            this.searchModel = this._instantiationService.createInstance(searchModel_1.SearchModel);
            this.searchModel.location = searchModel_1.SearchModelLocation.QUICK_ACCESS;
            const viewer = viewlet?.getControl();
            if (currentElem) {
                viewer.setFocus([currentElem], (0, listService_1.getSelectionKeyboardEvent)());
                viewer.setSelection([currentElem], (0, listService_1.getSelectionKeyboardEvent)());
                viewer.reveal(currentElem);
            }
            else {
                viewlet.searchAndReplaceWidget.focus();
            }
        }
        _getPicksFromMatches(matches, limit) {
            matches = matches.sort(searchModel_1.searchComparer);
            const files = matches.length > limit ? matches.slice(0, limit) : matches;
            const picks = [];
            for (let fileIndex = 0; fileIndex < matches.length; fileIndex++) {
                if (fileIndex === limit) {
                    picks.push({
                        type: 'separator',
                    });
                    picks.push({
                        label: (0, nls_1.localize)('QuickSearchSeeMoreFiles', "See More Files"),
                        iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchDetailsIcon),
                        accept: async () => {
                            this.moveToSearchViewlet(matches[limit]);
                        }
                    });
                    break;
                }
                const fileMatch = files[fileIndex];
                const label = (0, resources_1.basenameOrAuthority)(fileMatch.resource);
                const description = this._labelService.getUriLabel((0, resources_1.dirname)(fileMatch.resource), { relative: true });
                picks.push({
                    label,
                    type: 'separator',
                    description,
                    buttons: [{
                            iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchOpenInFileIcon),
                            tooltip: (0, nls_1.localize)('QuickSearchOpenInFile', "Open File")
                        }],
                    trigger: async () => {
                        await this.handleAccept(fileMatch, {});
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    },
                });
                const results = fileMatch.matches() ?? [];
                for (let matchIndex = 0; matchIndex < results.length; matchIndex++) {
                    const element = results[matchIndex];
                    if (matchIndex === MAX_RESULTS_PER_FILE) {
                        picks.push({
                            label: (0, nls_1.localize)('QuickSearchMore', "More"),
                            iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchDetailsIcon),
                            accept: async () => {
                                this.moveToSearchViewlet(element);
                            }
                        });
                        break;
                    }
                    const preview = element.preview();
                    const previewText = (preview.before + preview.inside + preview.after).trim().substring(0, 999);
                    const match = [{
                            start: preview.before.length,
                            end: preview.before.length + preview.inside.length
                        }];
                    picks.push({
                        label: `${previewText}`,
                        highlights: {
                            label: match
                        },
                        buttons: [{
                                iconClass: themables_1.ThemeIcon.asClassName(searchIcons_1.searchActivityBarIcon),
                                tooltip: (0, nls_1.localize)('showMore', "See in Search Panel"),
                            }],
                        ariaLabel: `Match at location ${element.range().startLineNumber}:${element.range().startColumn} - ${previewText}`,
                        accept: async (keyMods, event) => {
                            await this.handleAccept(fileMatch, {
                                keyMods,
                                selection: (0, searchView_1.getEditorSelectionFromMatch)(element, this.searchModel),
                                preserveFocus: event.inBackground,
                                forcePinned: event.inBackground
                            });
                        },
                        trigger: () => {
                            this.moveToSearchViewlet(element);
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        match: element
                    });
                }
            }
            return picks;
        }
        async handleAccept(fileMatch, options) {
            const editorOptions = {
                preserveFocus: options.preserveFocus,
                pinned: options.keyMods?.ctrlCmd || options.forcePinned || this.configuration.openEditorPinned,
                selection: options.selection
            };
            // from https://github.com/microsoft/vscode/blob/f40dabca07a1622b2a0ae3ee741cfc94ab964bef/src/vs/workbench/contrib/search/browser/anythingQuickAccess.ts#L1037
            const targetGroup = options.keyMods?.alt || (this.configuration.openEditorPinned && options.keyMods?.ctrlCmd) || options.forceOpenSideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP;
            await this._editorService.openEditor({
                resource: fileMatch.resource,
                options: editorOptions
            }, targetGroup);
        }
        _getPicks(contentPattern, disposables, token) {
            const searchModelAtTimeOfSearch = this.searchModel;
            if (contentPattern === '') {
                this.searchModel.searchResult.clear();
                return [{
                        label: (0, nls_1.localize)('enterSearchTerm', "Enter a term to search for across your files.")
                    }];
            }
            const conditionalTokenCts = disposables.add(new cancellation_1.CancellationTokenSource());
            disposables.add(token.onCancellationRequested(() => {
                if (searchModelAtTimeOfSearch.location === searchModel_1.SearchModelLocation.QUICK_ACCESS) {
                    // if the search model has not been imported to the panel, you can cancel
                    conditionalTokenCts.cancel();
                }
            }));
            const allMatches = this.doSearch(contentPattern, conditionalTokenCts.token);
            if (!allMatches) {
                return null;
            }
            const matches = allMatches.syncResults;
            const syncResult = this._getPicksFromMatches(matches, MAX_FILES_SHOWN);
            if (syncResult.length > 0) {
                this.searchModel.searchResult.toggleHighlights(true);
            }
            if (matches.length >= MAX_FILES_SHOWN) {
                return syncResult;
            }
            return {
                picks: syncResult,
                additionalPicks: allMatches.asyncResults
                    .then(asyncResults => (asyncResults.length + syncResult.length === 0) ? [{
                        label: (0, nls_1.localize)('noAnythingResults', "No matching results")
                    }] : this._getPicksFromMatches(asyncResults, MAX_FILES_SHOWN - matches.length))
                    .then(picks => {
                    if (picks.length > 0) {
                        this.searchModel.searchResult.toggleHighlights(true);
                    }
                    return picks;
                })
            };
        }
    };
    exports.TextSearchQuickAccess = TextSearchQuickAccess;
    exports.TextSearchQuickAccess = TextSearchQuickAccess = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, editorService_1.IEditorService),
        __param(3, label_1.ILabelService),
        __param(4, viewsService_1.IViewsService),
        __param(5, configuration_1.IConfigurationService)
    ], TextSearchQuickAccess);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaFF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9xdWlja1RleHRTZWFyY2gvdGV4dFNlYXJjaFF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFrQ2EsUUFBQSwrQkFBK0IsR0FBRyxHQUFHLENBQUM7SUFFbkQsTUFBTSxrQ0FBa0MsR0FBNkI7UUFDcEUsT0FBTyxFQUFFLG1CQUFtQjtRQUM1QixvQkFBb0IsRUFBRSxLQUFLO1FBQzNCLHdCQUF3QixFQUFFLEtBQUs7UUFDL0IsZUFBZSxFQUFFLEtBQUs7UUFDdEIsY0FBYyxFQUFFLElBQUk7S0FDcEIsQ0FBQztJQUVGLE1BQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUMzQixNQUFNLG9CQUFvQixHQUFHLEVBQUUsQ0FBQztJQUNoQyxNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUM7SUFLbkIsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSw2Q0FBcUQ7UUFXdkYsMkJBQTJCLENBQUMsWUFBb0I7WUFDdkQsT0FBTztnQkFDTixHQUFHLGtDQUFrQztnQkFDckMsR0FBSTtvQkFDSCxrQkFBa0IsRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLHlDQUFnQyxDQUFDO29CQUMvRixVQUFVLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLElBQUksU0FBUztvQkFDdEQsV0FBVyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUztpQkFDekM7Z0JBRUQsY0FBYyxFQUFFO29CQUNmLFVBQVUsRUFBRSxDQUFDO29CQUNiLFlBQVk7aUJBQ1o7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELFlBQ3dCLHFCQUE2RCxFQUMxRCxlQUEwRCxF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