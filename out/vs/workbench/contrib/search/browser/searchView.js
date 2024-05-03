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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/tree/tree", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/network", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/core/selection", "vs/editor/contrib/find/browser/findController", "vs/editor/contrib/multicursor/browser/multicursor", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/browser/dnd", "vs/workbench/browser/labels", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/memento", "vs/workbench/common/views", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/search/browser/patternInputWidget", "vs/workbench/contrib/search/browser/searchActionsBase", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/browser/searchMessage", "vs/workbench/contrib/search/browser/searchResultsView", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/browser/replace", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/searchEditor/browser/searchEditorActions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/notebook/common/notebookService", "vs/platform/log/common/log", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/searchview"], function (require, exports, dom, keyboardEvent_1, aria, tree_1, async_1, errors, event_1, iterator_1, lifecycle_1, env, strings, uri_1, network, editorBrowser_1, codeEditorService_1, embeddedCodeEditorWidget_1, selection_1, findController_1, multicursor_1, nls, accessibility_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, dialogs_1, files_1, instantiation_1, serviceCollection_1, keybinding_1, listService_1, notification_1, opener_1, progress_1, storage_1, telemetry_1, defaultStyles_1, themeService_1, themables_1, workspace_1, workspaceActions_1, dnd_1, labels_1, viewPane_1, memento_1, views_1, notebookEditor_1, patternInputWidget_1, searchActionsBase_1, searchIcons_1, searchMessage_1, searchResultsView_1, searchWidget_1, Constants, replace_1, search_1, searchHistoryService_1, searchModel_1, searchEditorActions_1, editorService_1, preferences_1, queryBuilder_1, search_2, textfiles_1, notebookService_1, log_1, accessibilitySignalService_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var SearchView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchView = exports.SearchViewPosition = void 0;
    exports.getEditorSelectionFromMatch = getEditorSelectionFromMatch;
    exports.getSelectionTextFromEditor = getSelectionTextFromEditor;
    const $ = dom.$;
    var SearchViewPosition;
    (function (SearchViewPosition) {
        SearchViewPosition[SearchViewPosition["SideBar"] = 0] = "SideBar";
        SearchViewPosition[SearchViewPosition["Panel"] = 1] = "Panel";
    })(SearchViewPosition || (exports.SearchViewPosition = SearchViewPosition = {}));
    const SEARCH_CANCELLED_MESSAGE = nls.localize('searchCanceled', "Search was canceled before any results could be found - ");
    const DEBOUNCE_DELAY = 75;
    let SearchView = class SearchView extends viewPane_1.ViewPane {
        static { SearchView_1 = this; }
        static { this.ACTIONS_RIGHT_CLASS_NAME = 'actions-right'; }
        constructor(options, fileService, editorService, codeEditorService, progressService, notificationService, dialogService, commandService, contextViewService, instantiationService, viewDescriptorService, configurationService, contextService, searchViewModelWorkbenchService, contextKeyService, replaceService, textFileService, preferencesService, themeService, searchHistoryService, contextMenuService, accessibilityService, keybindingService, storageService, openerService, telemetryService, notebookService, logService, accessibilitySignalService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.fileService = fileService;
            this.editorService = editorService;
            this.codeEditorService = codeEditorService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.contextViewService = contextViewService;
            this.contextService = contextService;
            this.searchViewModelWorkbenchService = searchViewModelWorkbenchService;
            this.replaceService = replaceService;
            this.textFileService = textFileService;
            this.preferencesService = preferencesService;
            this.searchHistoryService = searchHistoryService;
            this.accessibilityService = accessibilityService;
            this.storageService = storageService;
            this.notebookService = notebookService;
            this.logService = logService;
            this.accessibilitySignalService = accessibilitySignalService;
            this.isDisposed = false;
            this.lastFocusState = 'input';
            this.messageDisposables = new lifecycle_1.DisposableStore();
            this.changedWhileHidden = false;
            this.currentSearchQ = Promise.resolve();
            this.pauseSearching = false;
            this._visibleMatches = 0;
            this.container = dom.$('.search-view');
            // globals
            this.viewletVisible = Constants.SearchContext.SearchViewVisibleKey.bindTo(this.contextKeyService);
            this.firstMatchFocused = Constants.SearchContext.FirstMatchFocusKey.bindTo(this.contextKeyService);
            this.fileMatchOrMatchFocused = Constants.SearchContext.FileMatchOrMatchFocusKey.bindTo(this.contextKeyService);
            this.fileMatchOrFolderMatchFocus = Constants.SearchContext.FileMatchOrFolderMatchFocusKey.bindTo(this.contextKeyService);
            this.fileMatchOrFolderMatchWithResourceFocus = Constants.SearchContext.FileMatchOrFolderMatchWithResourceFocusKey.bindTo(this.contextKeyService);
            this.fileMatchFocused = Constants.SearchContext.FileFocusKey.bindTo(this.contextKeyService);
            this.folderMatchFocused = Constants.SearchContext.FolderFocusKey.bindTo(this.contextKeyService);
            this.folderMatchWithResourceFocused = Constants.SearchContext.ResourceFolderFocusKey.bindTo(this.contextKeyService);
            this.hasSearchResultsKey = Constants.SearchContext.HasSearchResults.bindTo(this.contextKeyService);
            this.matchFocused = Constants.SearchContext.MatchFocusKey.bindTo(this.contextKeyService);
            this.searchStateKey = search_1.SearchStateKey.bindTo(this.contextKeyService);
            this.hasSearchPatternKey = Constants.SearchContext.ViewHasSearchPatternKey.bindTo(this.contextKeyService);
            this.hasReplacePatternKey = Constants.SearchContext.ViewHasReplacePatternKey.bindTo(this.contextKeyService);
            this.hasFilePatternKey = Constants.SearchContext.ViewHasFilePatternKey.bindTo(this.contextKeyService);
            this.hasSomeCollapsibleResultKey = Constants.SearchContext.ViewHasSomeCollapsibleKey.bindTo(this.contextKeyService);
            this.treeViewKey = Constants.SearchContext.InTreeViewKey.bindTo(this.contextKeyService);
            this.aiResultsVisibleKey = Constants.SearchContext.AIResultsVisibleKey.bindTo(this.contextKeyService);
            this._register(this.contextKeyService.onDidChangeContext(e => {
                const keys = Constants.SearchContext.hasAIResultProvider.keys();
                if (e.affectsSome(new Set(keys))) {
                    this.refreshHasAISetting();
                }
            }));
            // scoped
            this.contextKeyService = this._register(this.contextKeyService.createScoped(this.container));
            Constants.SearchContext.SearchViewFocusedKey.bindTo(this.contextKeyService).set(true);
            this.inputBoxFocused = Constants.SearchContext.InputBoxFocusedKey.bindTo(this.contextKeyService);
            this.inputPatternIncludesFocused = Constants.SearchContext.PatternIncludesFocusedKey.bindTo(this.contextKeyService);
            this.inputPatternExclusionsFocused = Constants.SearchContext.PatternExcludesFocusedKey.bindTo(this.contextKeyService);
            this.isEditableItem = Constants.SearchContext.IsEditableItemKey.bindTo(this.contextKeyService);
            this.instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('search.sortOrder')) {
                    if (this.searchConfig.sortOrder === "modified" /* SearchSortOrder.Modified */) {
                        // If changing away from modified, remove all fileStats
                        // so that updated files are re-retrieved next time.
                        this.removeFileStats();
                    }
                    this.refreshTree();
                }
                else if (e.affectsConfiguration('search.aiResults')) {
                    this.refreshHasAISetting();
                }
            }));
            this.viewModel = this._register(this.searchViewModelWorkbenchService.searchModel);
            this.queryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            this.memento = new memento_1.Memento(this.id, storageService);
            this.viewletState = this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this._register(this.fileService.onDidFilesChange(e => this.onFilesChanged(e)));
            this._register(this.textFileService.untitled.onWillDispose(model => this.onUntitledDidDispose(model.resource)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.onDidChangeWorkbenchState()));
            this._register(this.searchHistoryService.onDidClearHistory(() => this.clearHistory()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            this.delayedRefresh = this._register(new async_1.Delayer(250));
            this.addToSearchHistoryDelayer = this._register(new async_1.Delayer(2000));
            this.toggleCollapseStateDelayer = this._register(new async_1.Delayer(100));
            this.triggerQueryDelayer = this._register(new async_1.Delayer(0));
            this.treeAccessibilityProvider = this.instantiationService.createInstance(searchResultsView_1.SearchAccessibilityProvider, this);
            this.isTreeLayoutViewVisible = this.viewletState['view.treeLayout'] ?? (this.searchConfig.defaultViewMode === "tree" /* ViewMode.Tree */);
            this._refreshResultsScheduler = this._register(new async_1.RunOnceScheduler(this._updateResults.bind(this), 80));
            // storage service listener for for roaming changes
            this._register(this.storageService.onWillSaveState(() => {
                this._saveSearchHistoryService();
            }));
            this._register(this.storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, searchHistoryService_1.SearchHistoryService.SEARCH_HISTORY_KEY, this._register(new lifecycle_1.DisposableStore()))(() => {
                const restoredHistory = this.searchHistoryService.load();
                if (restoredHistory.include) {
                    this.inputPatternIncludes.prependHistory(restoredHistory.include);
                }
                if (restoredHistory.exclude) {
                    this.inputPatternExcludes.prependHistory(restoredHistory.exclude);
                }
                if (restoredHistory.search) {
                    this.searchWidget.prependSearchHistory(restoredHistory.search);
                }
                if (restoredHistory.replace) {
                    this.searchWidget.prependReplaceHistory(restoredHistory.replace);
                }
            }));
        }
        get isTreeLayoutViewVisible() {
            return this.treeViewKey.get() ?? false;
        }
        set isTreeLayoutViewVisible(visible) {
            this.treeViewKey.set(visible);
        }
        get aiResultsVisible() {
            return this.aiResultsVisibleKey.get() ?? false;
        }
        set aiResultsVisible(visible) {
            this.aiResultsVisibleKey.set(visible);
        }
        setTreeView(visible) {
            if (visible === this.isTreeLayoutViewVisible) {
                return;
            }
            this.isTreeLayoutViewVisible = visible;
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            this.refreshTree();
        }
        async setAIResultsVisible(visible) {
            if (visible === this.aiResultsVisible) {
                return;
            }
            this.aiResultsVisible = visible;
            if (this.viewModel.searchResult.isEmpty()) {
                return;
            }
            // in each case, we want to cancel our current AI search because it is no longer valid
            this.model.cancelAISearch();
            if (visible) {
                await this.model.addAIResults();
            }
            else {
                this.searchWidget.toggleReplace(false);
            }
            this.onSearchResultsChanged();
            this.onSearchComplete(() => { }, undefined, undefined, this.viewModel.searchResult.getCachedSearchComplete(visible));
        }
        get state() {
            return this.searchStateKey.get() ?? search_1.SearchUIState.Idle;
        }
        set state(v) {
            this.searchStateKey.set(v);
        }
        getContainer() {
            return this.container;
        }
        get searchResult() {
            return this.viewModel && this.viewModel.searchResult;
        }
        get model() {
            return this.viewModel;
        }
        refreshHasAISetting() {
            const val = this.shouldShowAIButton();
            if (val && this.searchWidget.searchInput) {
                this.searchWidget.searchInput.shouldShowAIButton = val;
            }
        }
        onDidChangeWorkbenchState() {
            if (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ && this.searchWithoutFolderMessageElement) {
                dom.hide(this.searchWithoutFolderMessageElement);
            }
        }
        refreshInputs() {
            this.pauseSearching = true;
            this.searchWidget.setValue(this.viewModel.searchResult.query?.contentPattern.pattern ?? '');
            this.searchWidget.setReplaceAllActionState(false);
            this.searchWidget.toggleReplace(true);
            this.inputPatternIncludes.setOnlySearchInOpenEditors(this.viewModel.searchResult.query?.onlyOpenEditors || false);
            this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(!this.viewModel.searchResult.query?.userDisabledExcludesAndIgnoreFiles || true);
            this.searchIncludePattern.setValue('');
            this.searchExcludePattern.setValue('');
            this.pauseSearching = false;
        }
        async replaceSearchModel(searchModel, asyncResults) {
            let progressComplete;
            this.progressService.withProgress({ location: this.getProgressLocation(), delay: 0 }, _progress => {
                return new Promise(resolve => progressComplete = resolve);
            });
            const slowTimer = setTimeout(() => {
                this.state = search_1.SearchUIState.SlowSearch;
            }, 2000);
            this._refreshResultsScheduler.schedule();
            // remove old model and use the new searchModel
            searchModel.location = searchModel_1.SearchModelLocation.PANEL;
            searchModel.replaceActive = this.viewModel.isReplaceActive();
            searchModel.replaceString = this.searchWidget.getReplaceValue();
            this._onSearchResultChangedDisposable?.dispose();
            this._onSearchResultChangedDisposable = this._register(searchModel.onSearchResultChanged((event) => this.onSearchResultsChanged(event)));
            // this call will also dispose of the old model
            this.searchViewModelWorkbenchService.searchModel = searchModel;
            this.viewModel = searchModel;
            this.onSearchResultsChanged();
            this.refreshInputs();
            asyncResults.then((complete) => {
                clearTimeout(slowTimer);
                this.onSearchComplete(progressComplete, undefined, undefined, complete);
            }, (e) => {
                clearTimeout(slowTimer);
                this.onSearchError(e, progressComplete, undefined, undefined);
            });
            const collapseResults = this.searchConfig.collapseResults;
            if (collapseResults !== 'alwaysCollapse' && this.viewModel.searchResult.matches(this.aiResultsVisible).length === 1) {
                const onlyMatch = this.viewModel.searchResult.matches(this.aiResultsVisible)[0];
                if (onlyMatch.count() < 50) {
                    this.tree.expand(onlyMatch);
                }
            }
        }
        renderBody(parent) {
            super.renderBody(parent);
            this.container = dom.append(parent, dom.$('.search-view'));
            this.searchWidgetsContainerElement = dom.append(this.container, $('.search-widgets-container'));
            this.createSearchWidget(this.searchWidgetsContainerElement);
            this.refreshHasAISetting();
            const history = this.searchHistoryService.load();
            const filePatterns = this.viewletState['query.filePatterns'] || '';
            const patternExclusions = this.viewletState['query.folderExclusions'] || '';
            const patternExclusionsHistory = history.exclude || [];
            const patternIncludes = this.viewletState['query.folderIncludes'] || '';
            const patternIncludesHistory = history.include || [];
            const onlyOpenEditors = this.viewletState['query.onlyOpenEditors'] || false;
            const queryDetailsExpanded = this.viewletState['query.queryDetailsExpanded'] || '';
            const useExcludesAndIgnoreFiles = typeof this.viewletState['query.useExcludesAndIgnoreFiles'] === 'boolean' ?
                this.viewletState['query.useExcludesAndIgnoreFiles'] : true;
            this.queryDetails = dom.append(this.searchWidgetsContainerElement, $('.query-details'));
            // Toggle query details button
            this.toggleQueryDetailsButton = dom.append(this.queryDetails, $('.more' + themables_1.ThemeIcon.asCSSSelector(searchIcons_1.searchDetailsIcon), { tabindex: 0, role: 'button' }));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), this.toggleQueryDetailsButton, nls.localize('moreSearch', "Toggle Search Details")));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.CLICK, e => {
                dom.EventHelper.stop(e);
                this.toggleQueryDetails(!this.accessibilityService.isScreenReaderOptimized());
            }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    dom.EventHelper.stop(e);
                    this.toggleQueryDetails(false);
                }
            }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                    if (this.searchWidget.isReplaceActive()) {
                        this.searchWidget.focusReplaceAllAction();
                    }
                    else {
                        this.searchWidget.isReplaceShown() ? this.searchWidget.replaceInput?.focusOnPreserve() : this.searchWidget.focusRegexAction();
                    }
                    dom.EventHelper.stop(e);
                }
            }));
            // folder includes list
            const folderIncludesList = dom.append(this.queryDetails, $('.file-types.includes'));
            const filesToIncludeTitle = nls.localize('searchScope.includes', "files to include");
            dom.append(folderIncludesList, $('h4', undefined, filesToIncludeTitle));
            this.inputPatternIncludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.IncludePatternInputWidget, folderIncludesList, this.contextViewService, {
                ariaLabel: filesToIncludeTitle,
                placeholder: nls.localize('placeholder.includes', "e.g. *.ts, src/**/include"),
                showPlaceholderOnFocus: true,
                history: patternIncludesHistory,
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            }));
            this.inputPatternIncludes.setValue(patternIncludes);
            this.inputPatternIncludes.setOnlySearchInOpenEditors(onlyOpenEditors);
            this._register(this.inputPatternIncludes.onCancel(() => this.cancelSearch(false)));
            this._register(this.inputPatternIncludes.onChangeSearchInEditorsBox(() => this.triggerQueryChange()));
            this.trackInputBox(this.inputPatternIncludes.inputFocusTracker, this.inputPatternIncludesFocused);
            // excludes list
            const excludesList = dom.append(this.queryDetails, $('.file-types.excludes'));
            const excludesTitle = nls.localize('searchScope.excludes', "files to exclude");
            dom.append(excludesList, $('h4', undefined, excludesTitle));
            this.inputPatternExcludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.ExcludePatternInputWidget, excludesList, this.contextViewService, {
                ariaLabel: excludesTitle,
                placeholder: nls.localize('placeholder.excludes', "e.g. *.ts, src/**/exclude"),
                showPlaceholderOnFocus: true,
                history: patternExclusionsHistory,
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            }));
            this.inputPatternExcludes.setValue(patternExclusions);
            this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(useExcludesAndIgnoreFiles);
            this._register(this.inputPatternExcludes.onCancel(() => this.cancelSearch(false)));
            this._register(this.inputPatternExcludes.onChangeIgnoreBox(() => this.triggerQueryChange()));
            this.trackInputBox(this.inputPatternExcludes.inputFocusTracker, this.inputPatternExclusionsFocused);
            const updateHasFilePatternKey = () => this.hasFilePatternKey.set(this.inputPatternIncludes.getValue().length > 0 || this.inputPatternExcludes.getValue().length > 0);
            updateHasFilePatternKey();
            const onFilePatternSubmit = (triggeredOnType) => {
                this.triggerQueryChange({ triggeredOnType, delay: this.searchConfig.searchOnTypeDebouncePeriod });
                if (triggeredOnType) {
                    updateHasFilePatternKey();
                }
            };
            this._register(this.inputPatternIncludes.onSubmit(onFilePatternSubmit));
            this._register(this.inputPatternExcludes.onSubmit(onFilePatternSubmit));
            this.messagesElement = dom.append(this.container, $('.messages.text-search-provider-messages'));
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                this.showSearchWithoutFolderMessage();
            }
            this.createSearchResultsView(this.container);
            if (filePatterns !== '' || patternExclusions !== '' || patternIncludes !== '' || queryDetailsExpanded !== '' || !useExcludesAndIgnoreFiles) {
                this.toggleQueryDetails(true, true, true);
            }
            this._onSearchResultChangedDisposable = this._register(this.viewModel.onSearchResultChanged((event) => this.onSearchResultsChanged(event)));
            this._register(this.onDidChangeBodyVisibility(visible => this.onVisibilityChanged(visible)));
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            this._register(this.themeService.onDidFileIconThemeChange(this.updateIndentStyles, this));
        }
        updateIndentStyles(theme) {
            this.resultsElement.classList.toggle('hide-arrows', this.isTreeLayoutViewVisible && theme.hidesExplorerArrows);
        }
        onVisibilityChanged(visible) {
            this.viewletVisible.set(visible);
            if (visible) {
                if (this.changedWhileHidden) {
                    // Render if results changed while viewlet was hidden - #37818
                    this.refreshAndUpdateCount();
                    this.changedWhileHidden = false;
                }
            }
            else {
                // Reset last focus to input to preserve opening the viewlet always focusing the query editor.
                this.lastFocusState = 'input';
            }
            // Enable highlights if there are searchresults
            this.viewModel?.searchResult.toggleHighlights(visible);
        }
        get searchAndReplaceWidget() {
            return this.searchWidget;
        }
        get searchIncludePattern() {
            return this.inputPatternIncludes;
        }
        get searchExcludePattern() {
            return this.inputPatternExcludes;
        }
        createSearchWidget(container) {
            const contentPattern = this.viewletState['query.contentPattern'] || '';
            const replaceText = this.viewletState['query.replaceText'] || '';
            const isRegex = this.viewletState['query.regex'] === true;
            const isWholeWords = this.viewletState['query.wholeWords'] === true;
            const isCaseSensitive = this.viewletState['query.caseSensitive'] === true;
            const history = this.searchHistoryService.load();
            const searchHistory = history.search || this.viewletState['query.searchHistory'] || [];
            const replaceHistory = history.replace || this.viewletState['query.replaceHistory'] || [];
            const showReplace = typeof this.viewletState['view.showReplace'] === 'boolean' ? this.viewletState['view.showReplace'] : true;
            const preserveCase = this.viewletState['query.preserveCase'] === true;
            const isInNotebookMarkdownInput = this.viewletState['query.isInNotebookMarkdownInput'] ?? true;
            const isInNotebookMarkdownPreview = this.viewletState['query.isInNotebookMarkdownPreview'] ?? true;
            const isInNotebookCellInput = this.viewletState['query.isInNotebookCellInput'] ?? true;
            const isInNotebookCellOutput = this.viewletState['query.isInNotebookCellOutput'] ?? true;
            this.searchWidget = this._register(this.instantiationService.createInstance(searchWidget_1.SearchWidget, container, {
                value: contentPattern,
                replaceValue: replaceText,
                isRegex: isRegex,
                isCaseSensitive: isCaseSensitive,
                isWholeWords: isWholeWords,
                searchHistory: searchHistory,
                replaceHistory: replaceHistory,
                preserveCase: preserveCase,
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                toggleStyles: defaultStyles_1.defaultToggleStyles,
                notebookOptions: {
                    isInNotebookMarkdownInput,
                    isInNotebookMarkdownPreview,
                    isInNotebookCellInput,
                    isInNotebookCellOutput,
                },
                initialAIButtonVisibility: this.shouldShowAIButton()
            }));
            if (!this.searchWidget.searchInput || !this.searchWidget.replaceInput) {
                this.logService.warn(`Cannot fully create search widget. Search or replace input undefined. SearchInput: ${this.searchWidget.searchInput}, ReplaceInput: ${this.searchWidget.replaceInput}`);
                return;
            }
            if (showReplace) {
                this.searchWidget.toggleReplace(true);
            }
            this._register(this.searchWidget.onSearchSubmit(options => this.triggerQueryChange(options)));
            this._register(this.searchWidget.onSearchCancel(({ focus }) => this.cancelSearch(focus)));
            this._register(this.searchWidget.searchInput.onDidOptionChange(() => {
                if (this.searchWidget.searchInput && this.searchWidget.searchInput.isAIEnabled !== this.aiResultsVisible) {
                    this.setAIResultsVisible(this.searchWidget.searchInput.isAIEnabled);
                }
                else {
                    this.triggerQueryChange();
                }
            }));
            this._register(this.searchWidget.getNotebookFilters().onDidChange(() => this.triggerQueryChange()));
            const updateHasPatternKey = () => this.hasSearchPatternKey.set(this.searchWidget.searchInput ? (this.searchWidget.searchInput.getValue().length > 0) : false);
            updateHasPatternKey();
            this._register(this.searchWidget.searchInput.onDidChange(() => updateHasPatternKey()));
            const updateHasReplacePatternKey = () => this.hasReplacePatternKey.set(this.searchWidget.getReplaceValue().length > 0);
            updateHasReplacePatternKey();
            this._register(this.searchWidget.replaceInput.inputBox.onDidChange(() => updateHasReplacePatternKey()));
            this._register(this.searchWidget.onDidHeightChange(() => this.reLayout()));
            this._register(this.searchWidget.onReplaceToggled(() => this.reLayout()));
            this._register(this.searchWidget.onReplaceStateChange((state) => {
                this.viewModel.replaceActive = state;
                this.refreshTree();
            }));
            this._register(this.searchWidget.onPreserveCaseChange((state) => {
                this.viewModel.preserveCase = state;
                this.refreshTree();
            }));
            this._register(this.searchWidget.onReplaceValueChanged(() => {
                this.viewModel.replaceString = this.searchWidget.getReplaceValue();
                this.delayedRefresh.trigger(() => this.refreshTree());
            }));
            this._register(this.searchWidget.onBlur(() => {
                this.toggleQueryDetailsButton.focus();
            }));
            this._register(this.searchWidget.onReplaceAll(() => this.replaceAll()));
            this.trackInputBox(this.searchWidget.searchInputFocusTracker);
            this.trackInputBox(this.searchWidget.replaceInputFocusTracker);
        }
        shouldShowAIButton() {
            const hasProvider = Constants.SearchContext.hasAIResultProvider.getValue(this.contextKeyService);
            return !!(this.configurationService.getValue('search.aiResults') && hasProvider);
        }
        onConfigurationUpdated(event) {
            if (event && (event.affectsConfiguration('search.decorations.colors') || event.affectsConfiguration('search.decorations.badges'))) {
                this.refreshTree();
            }
        }
        trackInputBox(inputFocusTracker, contextKey) {
            if (!inputFocusTracker) {
                return;
            }
            this._register(inputFocusTracker.onDidFocus(() => {
                this.lastFocusState = 'input';
                this.inputBoxFocused.set(true);
                contextKey?.set(true);
            }));
            this._register(inputFocusTracker.onDidBlur(() => {
                this.inputBoxFocused.set(this.searchWidget.searchInputHasFocus()
                    || this.searchWidget.replaceInputHasFocus()
                    || this.inputPatternIncludes.inputHasFocus()
                    || this.inputPatternExcludes.inputHasFocus());
                contextKey?.set(false);
            }));
        }
        onSearchResultsChanged(event) {
            if (this.isVisible()) {
                return this.refreshAndUpdateCount(event);
            }
            else {
                this.changedWhileHidden = true;
            }
        }
        refreshAndUpdateCount(event) {
            this.searchWidget.setReplaceAllActionState(!this.viewModel.searchResult.isEmpty(this.aiResultsVisible));
            this.updateSearchResultCount(this.viewModel.searchResult.query.userDisabledExcludesAndIgnoreFiles, this.viewModel.searchResult.query?.onlyOpenEditors, event?.clearingAll);
            return this.refreshTree(event);
        }
        refreshTree(event) {
            const collapseResults = this.searchConfig.collapseResults;
            if (!event || event.added || event.removed) {
                // Refresh whole tree
                if (this.searchConfig.sortOrder === "modified" /* SearchSortOrder.Modified */) {
                    // Ensure all matches have retrieved their file stat
                    this.retrieveFileStats()
                        .then(() => this.tree.setChildren(null, this.createResultIterator(collapseResults)));
                }
                else {
                    this.tree.setChildren(null, this.createResultIterator(collapseResults));
                }
            }
            else {
                // If updated counts affect our search order, re-sort the view.
                if (this.searchConfig.sortOrder === "countAscending" /* SearchSortOrder.CountAscending */ ||
                    this.searchConfig.sortOrder === "countDescending" /* SearchSortOrder.CountDescending */) {
                    this.tree.setChildren(null, this.createResultIterator(collapseResults));
                }
                else {
                    // FileMatch modified, refresh those elements
                    event.elements.forEach(element => {
                        this.tree.setChildren(element, this.createIterator(element, collapseResults));
                        this.tree.rerender(element);
                    });
                }
            }
        }
        createResultIterator(collapseResults) {
            const folderMatches = this.searchResult.folderMatches(this.aiResultsVisible)
                .filter(fm => !fm.isEmpty())
                .sort(searchModel_1.searchMatchComparer);
            if (folderMatches.length === 1) {
                return this.createFolderIterator(folderMatches[0], collapseResults, true);
            }
            return iterator_1.Iterable.map(folderMatches, folderMatch => {
                const children = this.createFolderIterator(folderMatch, collapseResults, true);
                return { element: folderMatch, children, incompressible: true }; // roots should always be incompressible
            });
        }
        createFolderIterator(folderMatch, collapseResults, childFolderIncompressible) {
            const sortOrder = this.searchConfig.sortOrder;
            const matchArray = this.isTreeLayoutViewVisible ? folderMatch.matches() : folderMatch.allDownstreamFileMatches();
            const matches = matchArray.sort((a, b) => (0, searchModel_1.searchMatchComparer)(a, b, sortOrder));
            return iterator_1.Iterable.map(matches, match => {
                let children;
                if (match instanceof searchModel_1.FileMatch) {
                    children = this.createFileIterator(match);
                }
                else {
                    children = this.createFolderIterator(match, collapseResults, false);
                }
                const collapsed = (collapseResults === 'alwaysCollapse' || (match.count() > 10 && collapseResults !== 'alwaysExpand')) ? tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed : tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded;
                return { element: match, children, collapsed, incompressible: (match instanceof searchModel_1.FileMatch) ? true : childFolderIncompressible };
            });
        }
        createFileIterator(fileMatch) {
            let matches = fileMatch.matches().sort(searchModel_1.searchMatchComparer);
            if (!this.aiResultsVisible) {
                matches = matches.filter(e => !e.aiContributed);
            }
            return iterator_1.Iterable.map(matches, r => ({ element: r, incompressible: true }));
        }
        createIterator(match, collapseResults) {
            return match instanceof searchModel_1.SearchResult ? this.createResultIterator(collapseResults) :
                match instanceof searchModel_1.FolderMatch ? this.createFolderIterator(match, collapseResults, false) :
                    this.createFileIterator(match);
        }
        replaceAll() {
            if (this.viewModel.searchResult.count() === 0) {
                return;
            }
            const occurrences = this.viewModel.searchResult.count();
            const fileCount = this.viewModel.searchResult.fileCount();
            const replaceValue = this.searchWidget.getReplaceValue() || '';
            const afterReplaceAllMessage = this.buildAfterReplaceAllMessage(occurrences, fileCount, replaceValue);
            let progressComplete;
            let progressReporter;
            this.progressService.withProgress({ location: this.getProgressLocation(), delay: 100, total: occurrences }, p => {
                progressReporter = p;
                return new Promise(resolve => progressComplete = resolve);
            });
            const confirmation = {
                title: nls.localize('replaceAll.confirmation.title', "Replace All"),
                message: this.buildReplaceAllConfirmationMessage(occurrences, fileCount, replaceValue),
                primaryButton: nls.localize({ key: 'replaceAll.confirm.button', comment: ['&& denotes a mnemonic'] }, "&&Replace")
            };
            this.dialogService.confirm(confirmation).then(res => {
                if (res.confirmed) {
                    this.searchWidget.setReplaceAllActionState(false);
                    this.viewModel.searchResult.replaceAll(progressReporter).then(() => {
                        progressComplete();
                        const messageEl = this.clearMessage();
                        dom.append(messageEl, afterReplaceAllMessage);
                        this.reLayout();
                    }, (error) => {
                        progressComplete();
                        errors.isCancellationError(error);
                        this.notificationService.error(error);
                    });
                }
                else {
                    progressComplete();
                }
            });
        }
        buildAfterReplaceAllMessage(occurrences, fileCount, replaceValue) {
            if (occurrences === 1) {
                if (fileCount === 1) {
                    if (replaceValue) {
                        return nls.localize('replaceAll.occurrence.file.message', "Replaced {0} occurrence across {1} file with '{2}'.", occurrences, fileCount, replaceValue);
                    }
                    return nls.localize('removeAll.occurrence.file.message', "Replaced {0} occurrence across {1} file.", occurrences, fileCount);
                }
                if (replaceValue) {
                    return nls.localize('replaceAll.occurrence.files.message', "Replaced {0} occurrence across {1} files with '{2}'.", occurrences, fileCount, replaceValue);
                }
                return nls.localize('removeAll.occurrence.files.message', "Replaced {0} occurrence across {1} files.", occurrences, fileCount);
            }
            if (fileCount === 1) {
                if (replaceValue) {
                    return nls.localize('replaceAll.occurrences.file.message', "Replaced {0} occurrences across {1} file with '{2}'.", occurrences, fileCount, replaceValue);
                }
                return nls.localize('removeAll.occurrences.file.message', "Replaced {0} occurrences across {1} file.", occurrences, fileCount);
            }
            if (replaceValue) {
                return nls.localize('replaceAll.occurrences.files.message', "Replaced {0} occurrences across {1} files with '{2}'.", occurrences, fileCount, replaceValue);
            }
            return nls.localize('removeAll.occurrences.files.message', "Replaced {0} occurrences across {1} files.", occurrences, fileCount);
        }
        buildReplaceAllConfirmationMessage(occurrences, fileCount, replaceValue) {
            if (occurrences === 1) {
                if (fileCount === 1) {
                    if (replaceValue) {
                        return nls.localize('removeAll.occurrence.file.confirmation.message', "Replace {0} occurrence across {1} file with '{2}'?", occurrences, fileCount, replaceValue);
                    }
                    return nls.localize('replaceAll.occurrence.file.confirmation.message', "Replace {0} occurrence across {1} file?", occurrences, fileCount);
                }
                if (replaceValue) {
                    return nls.localize('removeAll.occurrence.files.confirmation.message', "Replace {0} occurrence across {1} files with '{2}'?", occurrences, fileCount, replaceValue);
                }
                return nls.localize('replaceAll.occurrence.files.confirmation.message', "Replace {0} occurrence across {1} files?", occurrences, fileCount);
            }
            if (fileCount === 1) {
                if (replaceValue) {
                    return nls.localize('removeAll.occurrences.file.confirmation.message', "Replace {0} occurrences across {1} file with '{2}'?", occurrences, fileCount, replaceValue);
                }
                return nls.localize('replaceAll.occurrences.file.confirmation.message', "Replace {0} occurrences across {1} file?", occurrences, fileCount);
            }
            if (replaceValue) {
                return nls.localize('removeAll.occurrences.files.confirmation.message', "Replace {0} occurrences across {1} files with '{2}'?", occurrences, fileCount, replaceValue);
            }
            return nls.localize('replaceAll.occurrences.files.confirmation.message', "Replace {0} occurrences across {1} files?", occurrences, fileCount);
        }
        clearMessage() {
            this.searchWithoutFolderMessageElement = undefined;
            const wasHidden = this.messagesElement.style.display === 'none';
            dom.clearNode(this.messagesElement);
            dom.show(this.messagesElement);
            this.messageDisposables.clear();
            const newMessage = dom.append(this.messagesElement, $('.message'));
            if (wasHidden) {
                this.reLayout();
            }
            return newMessage;
        }
        createSearchResultsView(container) {
            this.resultsElement = dom.append(container, $('.results.show-file-icons.file-icon-themable-tree'));
            const delegate = this.instantiationService.createInstance(searchResultsView_1.SearchDelegate);
            const identityProvider = {
                getId(element) {
                    return element.id();
                }
            };
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility }));
            this.tree = this._register(this.instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'SearchView', this.resultsElement, delegate, [
                this._register(this.instantiationService.createInstance(searchResultsView_1.FolderMatchRenderer, this, this.treeLabels)),
                this._register(this.instantiationService.createInstance(searchResultsView_1.FileMatchRenderer, this, this.treeLabels)),
                this._register(this.instantiationService.createInstance(searchResultsView_1.MatchRenderer, this)),
            ], {
                identityProvider,
                accessibilityProvider: this.treeAccessibilityProvider,
                dnd: this.instantiationService.createInstance(dnd_1.ResourceListDnDHandler, element => {
                    if (element instanceof searchModel_1.FileMatch) {
                        return element.resource;
                    }
                    if (element instanceof searchModel_1.Match) {
                        return (0, opener_1.withSelection)(element.parent().resource, element.range());
                    }
                    return null;
                }),
                multipleSelectionSupport: true,
                selectionNavigation: true,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                },
                paddingBottom: searchResultsView_1.SearchDelegate.ITEM_HEIGHT
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            const updateHasSomeCollapsible = () => this.toggleCollapseStateDelayer.trigger(() => this.hasSomeCollapsibleResultKey.set(this.hasSomeCollapsible()));
            updateHasSomeCollapsible();
            this._register(this.tree.onDidChangeCollapseState(() => updateHasSomeCollapsible()));
            this._register(this.tree.onDidChangeModel(() => updateHasSomeCollapsible()));
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, DEBOUNCE_DELAY, true)(options => {
                if (options.element instanceof searchModel_1.Match) {
                    const selectedMatch = options.element;
                    this.currentSelectedFileMatch?.setSelectedMatch(null);
                    this.currentSelectedFileMatch = selectedMatch.parent();
                    this.currentSelectedFileMatch.setSelectedMatch(selectedMatch);
                    this.onFocus(selectedMatch, options.editorOptions.preserveFocus, options.sideBySide, options.editorOptions.pinned);
                }
            }));
            this._register(event_1.Event.debounce(this.tree.onDidChangeFocus, (last, event) => event, DEBOUNCE_DELAY, true)(() => {
                const selection = this.tree.getSelection();
                const focus = this.tree.getFocus()[0];
                if (selection.length > 1 && focus instanceof searchModel_1.Match) {
                    this.onFocus(focus, true);
                }
            }));
            this._register(event_1.Event.any(this.tree.onDidFocus, this.tree.onDidChangeFocus)(() => {
                const focus = this.tree.getFocus()[0];
                if (this.tree.isDOMFocused()) {
                    this.firstMatchFocused.set(this.tree.navigate().first() === focus);
                    this.fileMatchOrMatchFocused.set(!!focus);
                    this.fileMatchFocused.set(focus instanceof searchModel_1.FileMatch);
                    this.folderMatchFocused.set(focus instanceof searchModel_1.FolderMatch);
                    this.matchFocused.set(focus instanceof searchModel_1.Match);
                    this.fileMatchOrFolderMatchFocus.set(focus instanceof searchModel_1.FileMatch || focus instanceof searchModel_1.FolderMatch);
                    this.fileMatchOrFolderMatchWithResourceFocus.set(focus instanceof searchModel_1.FileMatch || focus instanceof searchModel_1.FolderMatchWithResource);
                    this.folderMatchWithResourceFocused.set(focus instanceof searchModel_1.FolderMatchWithResource);
                    this.lastFocusState = 'tree';
                }
                let editable = false;
                if (focus instanceof searchModel_1.Match) {
                    editable = (focus instanceof searchModel_1.MatchInNotebook) ? !focus.isReadonly() : true;
                }
                else if (focus instanceof searchModel_1.FileMatch) {
                    editable = !focus.hasOnlyReadOnlyMatches();
                }
                else if (focus instanceof searchModel_1.FolderMatch) {
                    editable = !focus.hasOnlyReadOnlyMatches();
                }
                this.isEditableItem.set(editable);
            }));
            this._register(this.tree.onDidBlur(() => {
                this.firstMatchFocused.reset();
                this.fileMatchOrMatchFocused.reset();
                this.fileMatchFocused.reset();
                this.folderMatchFocused.reset();
                this.matchFocused.reset();
                this.fileMatchOrFolderMatchFocus.reset();
                this.fileMatchOrFolderMatchWithResourceFocus.reset();
                this.folderMatchWithResourceFocused.reset();
                this.isEditableItem.reset();
            }));
        }
        onContextMenu(e) {
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this.contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.SearchContext,
                menuActionOptions: { shouldForwardArgs: true },
                contextKeyService: this.contextKeyService,
                getAnchor: () => e.anchor,
                getActionsContext: () => e.element,
            });
        }
        hasSomeCollapsible() {
            const viewer = this.getControl();
            const navigator = viewer.navigate();
            let node = navigator.first();
            do {
                if (!viewer.isCollapsed(node)) {
                    return true;
                }
            } while (node = navigator.next());
            return false;
        }
        selectNextMatch() {
            if (!this.hasSearchResults()) {
                return;
            }
            const [selected] = this.tree.getSelection();
            // Expand the initial selected node, if needed
            if (selected && !(selected instanceof searchModel_1.Match)) {
                if (this.tree.isCollapsed(selected)) {
                    this.tree.expand(selected);
                }
            }
            const navigator = this.tree.navigate(selected);
            let next = navigator.next();
            if (!next) {
                next = navigator.first();
            }
            // Expand until first child is a Match
            while (next && !(next instanceof searchModel_1.Match)) {
                if (this.tree.isCollapsed(next)) {
                    this.tree.expand(next);
                }
                // Select the first child
                next = navigator.next();
            }
            // Reveal the newly selected element
            if (next) {
                if (next === selected) {
                    this.tree.setFocus([]);
                }
                const event = (0, listService_1.getSelectionKeyboardEvent)(undefined, false, false);
                this.tree.setFocus([next], event);
                this.tree.setSelection([next], event);
                this.tree.reveal(next);
                const ariaLabel = this.treeAccessibilityProvider.getAriaLabel(next);
                if (ariaLabel) {
                    aria.status(ariaLabel);
                }
            }
        }
        selectPreviousMatch() {
            if (!this.hasSearchResults()) {
                return;
            }
            const [selected] = this.tree.getSelection();
            let navigator = this.tree.navigate(selected);
            let prev = navigator.previous();
            // Select previous until find a Match or a collapsed item
            while (!prev || (!(prev instanceof searchModel_1.Match) && !this.tree.isCollapsed(prev))) {
                const nextPrev = prev ? navigator.previous() : navigator.last();
                if (!prev && !nextPrev) {
                    return;
                }
                prev = nextPrev;
            }
            // Expand until last child is a Match
            while (!(prev instanceof searchModel_1.Match)) {
                const nextItem = navigator.next();
                this.tree.expand(prev);
                navigator = this.tree.navigate(nextItem); // recreate navigator because modifying the tree can invalidate it
                prev = nextItem ? navigator.previous() : navigator.last(); // select last child
            }
            // Reveal the newly selected element
            if (prev) {
                if (prev === selected) {
                    this.tree.setFocus([]);
                }
                const event = (0, listService_1.getSelectionKeyboardEvent)(undefined, false, false);
                this.tree.setFocus([prev], event);
                this.tree.setSelection([prev], event);
                this.tree.reveal(prev);
                const ariaLabel = this.treeAccessibilityProvider.getAriaLabel(prev);
                if (ariaLabel) {
                    aria.status(ariaLabel);
                }
            }
        }
        moveFocusToResults() {
            this.tree.domFocus();
        }
        focus() {
            super.focus();
            if (this.lastFocusState === 'input' || !this.hasSearchResults()) {
                const updatedText = this.searchConfig.seedOnFocus ? this.updateTextFromSelection({ allowSearchOnType: false }) : false;
                this.searchWidget.focus(undefined, undefined, updatedText);
            }
            else {
                this.tree.domFocus();
            }
        }
        updateTextFromFindWidgetOrSelection({ allowUnselectedWord = true, allowSearchOnType = true }) {
            let activeEditor = this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(activeEditor) && !activeEditor?.hasTextFocus()) {
                const controller = findController_1.CommonFindController.get(activeEditor);
                if (controller && controller.isFindInputFocused()) {
                    return this.updateTextFromFindWidget(controller, { allowSearchOnType });
                }
                const editors = this.codeEditorService.listCodeEditors();
                activeEditor = editors.find(editor => editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget && editor.getParentEditor() === activeEditor && editor.hasTextFocus())
                    ?? activeEditor;
            }
            return this.updateTextFromSelection({ allowUnselectedWord, allowSearchOnType }, activeEditor);
        }
        updateTextFromFindWidget(controller, { allowSearchOnType = true }) {
            if (!this.searchConfig.seedWithNearestWord && (dom.getActiveWindow().getSelection()?.toString() ?? '') === '') {
                return false;
            }
            const searchString = controller.getState().searchString;
            if (searchString === '') {
                return false;
            }
            this.searchWidget.searchInput?.setCaseSensitive(controller.getState().matchCase);
            this.searchWidget.searchInput?.setWholeWords(controller.getState().wholeWord);
            this.searchWidget.searchInput?.setRegex(controller.getState().isRegex);
            this.updateText(searchString, allowSearchOnType);
            return true;
        }
        updateTextFromSelection({ allowUnselectedWord = true, allowSearchOnType = true }, editor) {
            const seedSearchStringFromSelection = this.configurationService.getValue('editor').find.seedSearchStringFromSelection;
            if (!seedSearchStringFromSelection || seedSearchStringFromSelection === 'never') {
                return false;
            }
            let selectedText = this.getSearchTextFromEditor(allowUnselectedWord, editor);
            if (selectedText === null) {
                return false;
            }
            if (this.searchWidget.searchInput?.getRegex()) {
                selectedText = strings.escapeRegExpCharacters(selectedText);
            }
            this.updateText(selectedText, allowSearchOnType);
            return true;
        }
        updateText(text, allowSearchOnType = true) {
            if (allowSearchOnType && !this.viewModel.searchResult.isDirty) {
                this.searchWidget.setValue(text);
            }
            else {
                this.pauseSearching = true;
                this.searchWidget.setValue(text);
                this.pauseSearching = false;
            }
        }
        focusNextInputBox() {
            if (this.searchWidget.searchInputHasFocus()) {
                if (this.searchWidget.isReplaceShown()) {
                    this.searchWidget.focus(true, true);
                }
                else {
                    this.moveFocusFromSearchOrReplace();
                }
                return;
            }
            if (this.searchWidget.replaceInputHasFocus()) {
                this.moveFocusFromSearchOrReplace();
                return;
            }
            if (this.inputPatternIncludes.inputHasFocus()) {
                this.inputPatternExcludes.focus();
                this.inputPatternExcludes.select();
                return;
            }
            if (this.inputPatternExcludes.inputHasFocus()) {
                this.selectTreeIfNotSelected();
                return;
            }
        }
        moveFocusFromSearchOrReplace() {
            if (this.showsFileTypes()) {
                this.toggleQueryDetails(true, this.showsFileTypes());
            }
            else {
                this.selectTreeIfNotSelected();
            }
        }
        focusPreviousInputBox() {
            if (this.searchWidget.searchInputHasFocus()) {
                return;
            }
            if (this.searchWidget.replaceInputHasFocus()) {
                this.searchWidget.focus(true);
                return;
            }
            if (this.inputPatternIncludes.inputHasFocus()) {
                this.searchWidget.focus(true, true);
                return;
            }
            if (this.inputPatternExcludes.inputHasFocus()) {
                this.inputPatternIncludes.focus();
                this.inputPatternIncludes.select();
                return;
            }
            if (this.tree.isDOMFocused()) {
                this.moveFocusFromResults();
                return;
            }
        }
        moveFocusFromResults() {
            if (this.showsFileTypes()) {
                this.toggleQueryDetails(true, true, false, true);
            }
            else {
                this.searchWidget.focus(true, true);
            }
        }
        reLayout() {
            if (this.isDisposed || !this.size) {
                return;
            }
            const actionsPosition = this.searchConfig.actionsPosition;
            this.getContainer().classList.toggle(SearchView_1.ACTIONS_RIGHT_CLASS_NAME, actionsPosition === 'right');
            this.searchWidget.setWidth(this.size.width - 28 /* container margin */);
            this.inputPatternExcludes.setWidth(this.size.width - 28 /* container margin */);
            this.inputPatternIncludes.setWidth(this.size.width - 28 /* container margin */);
            const widgetHeight = dom.getTotalHeight(this.searchWidgetsContainerElement);
            const messagesHeight = dom.getTotalHeight(this.messagesElement);
            this.tree.layout(this.size.height - widgetHeight - messagesHeight, this.size.width - 28);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.size = new dom.Dimension(width, height);
            this.reLayout();
        }
        getControl() {
            return this.tree;
        }
        allSearchFieldsClear() {
            return this.searchWidget.getReplaceValue() === '' &&
                (!this.searchWidget.searchInput || this.searchWidget.searchInput.getValue() === '');
        }
        allFilePatternFieldsClear() {
            return this.searchExcludePattern.getValue() === '' &&
                this.searchIncludePattern.getValue() === '';
        }
        hasSearchResults() {
            return !this.viewModel.searchResult.isEmpty(this.aiResultsVisible);
        }
        clearSearchResults(clearInput = true) {
            this.viewModel.searchResult.clear();
            this.showEmptyStage(true);
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                this.showSearchWithoutFolderMessage();
            }
            if (clearInput) {
                if (this.allSearchFieldsClear()) {
                    this.clearFilePatternFields();
                }
                this.searchWidget.clear();
            }
            this.viewModel.cancelSearch();
            this.tree.ariaLabel = nls.localize('emptySearch', "Empty Search");
            this.accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
            this.reLayout();
        }
        clearFilePatternFields() {
            this.searchExcludePattern.clear();
            this.searchIncludePattern.clear();
        }
        cancelSearch(focus = true) {
            if (this.viewModel.cancelSearch()) {
                if (focus) {
                    this.searchWidget.focus();
                }
                return true;
            }
            return false;
        }
        selectTreeIfNotSelected() {
            if (this.tree.getNode(null)) {
                this.tree.domFocus();
                const selection = this.tree.getSelection();
                if (selection.length === 0) {
                    const event = (0, listService_1.getSelectionKeyboardEvent)();
                    this.tree.focusNext(undefined, undefined, event);
                    this.tree.setSelection(this.tree.getFocus(), event);
                }
            }
        }
        getSearchTextFromEditor(allowUnselectedWord, editor) {
            if (dom.isAncestorOfActiveElement(this.getContainer())) {
                return null;
            }
            editor = editor ?? this.editorService.activeTextEditorControl;
            if (!editor) {
                return null;
            }
            const allowUnselected = this.searchConfig.seedWithNearestWord && allowUnselectedWord;
            return getSelectionTextFromEditor(allowUnselected, editor);
        }
        showsFileTypes() {
            return this.queryDetails.classList.contains('more');
        }
        toggleCaseSensitive() {
            this.searchWidget.searchInput?.setCaseSensitive(!this.searchWidget.searchInput.getCaseSensitive());
            this.triggerQueryChange();
        }
        toggleWholeWords() {
            this.searchWidget.searchInput?.setWholeWords(!this.searchWidget.searchInput.getWholeWords());
            this.triggerQueryChange();
        }
        toggleRegex() {
            this.searchWidget.searchInput?.setRegex(!this.searchWidget.searchInput.getRegex());
            this.triggerQueryChange();
        }
        togglePreserveCase() {
            this.searchWidget.replaceInput?.setPreserveCase(!this.searchWidget.replaceInput.getPreserveCase());
            this.triggerQueryChange();
        }
        setSearchParameters(args = {}) {
            if (typeof args.isCaseSensitive === 'boolean') {
                this.searchWidget.searchInput?.setCaseSensitive(args.isCaseSensitive);
            }
            if (typeof args.matchWholeWord === 'boolean') {
                this.searchWidget.searchInput?.setWholeWords(args.matchWholeWord);
            }
            if (typeof args.isRegex === 'boolean') {
                this.searchWidget.searchInput?.setRegex(args.isRegex);
            }
            if (typeof args.filesToInclude === 'string') {
                this.searchIncludePattern.setValue(String(args.filesToInclude));
            }
            if (typeof args.filesToExclude === 'string') {
                this.searchExcludePattern.setValue(String(args.filesToExclude));
            }
            if (typeof args.query === 'string') {
                this.searchWidget.searchInput?.setValue(args.query);
            }
            if (typeof args.replace === 'string') {
                this.searchWidget.replaceInput?.setValue(args.replace);
            }
            else {
                if (this.searchWidget.replaceInput && this.searchWidget.replaceInput.getValue() !== '') {
                    this.searchWidget.replaceInput.setValue('');
                }
            }
            if (typeof args.triggerSearch === 'boolean' && args.triggerSearch) {
                this.triggerQueryChange();
            }
            if (typeof args.preserveCase === 'boolean') {
                this.searchWidget.replaceInput?.setPreserveCase(args.preserveCase);
            }
            if (typeof args.useExcludeSettingsAndIgnoreFiles === 'boolean') {
                this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(args.useExcludeSettingsAndIgnoreFiles);
            }
            if (typeof args.onlyOpenEditors === 'boolean') {
                this.searchIncludePattern.setOnlySearchInOpenEditors(args.onlyOpenEditors);
            }
        }
        toggleQueryDetails(moveFocus = true, show, skipLayout, reverse) {
            const cls = 'more';
            show = typeof show === 'undefined' ? !this.queryDetails.classList.contains(cls) : Boolean(show);
            this.viewletState['query.queryDetailsExpanded'] = show;
            skipLayout = Boolean(skipLayout);
            if (show) {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'true');
                this.queryDetails.classList.add(cls);
                if (moveFocus) {
                    if (reverse) {
                        this.inputPatternExcludes.focus();
                        this.inputPatternExcludes.select();
                    }
                    else {
                        this.inputPatternIncludes.focus();
                        this.inputPatternIncludes.select();
                    }
                }
            }
            else {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'false');
                this.queryDetails.classList.remove(cls);
                if (moveFocus) {
                    this.searchWidget.focus();
                }
            }
            if (!skipLayout && this.size) {
                this.reLayout();
            }
        }
        searchInFolders(folderPaths = []) {
            this._searchWithIncludeOrExclude(true, folderPaths);
        }
        searchOutsideOfFolders(folderPaths = []) {
            this._searchWithIncludeOrExclude(false, folderPaths);
        }
        _searchWithIncludeOrExclude(include, folderPaths) {
            if (!folderPaths.length || folderPaths.some(folderPath => folderPath === '.')) {
                this.inputPatternIncludes.setValue('');
                this.searchWidget.focus();
                return;
            }
            // Show 'files to include' box
            if (!this.showsFileTypes()) {
                this.toggleQueryDetails(true, true);
            }
            (include ? this.inputPatternIncludes : this.inputPatternExcludes).setValue(folderPaths.join(', '));
            this.searchWidget.focus(false);
        }
        triggerQueryChange(_options) {
            const options = { preserveFocus: true, triggeredOnType: false, delay: 0, ..._options };
            if (options.triggeredOnType && !this.searchConfig.searchOnType) {
                return;
            }
            if (!this.pauseSearching) {
                const delay = options.triggeredOnType ? options.delay : 0;
                this.triggerQueryDelayer.trigger(() => {
                    this._onQueryChanged(options.preserveFocus, options.triggeredOnType);
                }, delay);
            }
        }
        _onQueryChanged(preserveFocus, triggeredOnType = false) {
            if (!(this.searchWidget.searchInput?.inputBox.isInputValid())) {
                return;
            }
            const isRegex = this.searchWidget.searchInput.getRegex();
            const isInNotebookMarkdownInput = this.searchWidget.getNotebookFilters().markupInput;
            const isInNotebookMarkdownPreview = this.searchWidget.getNotebookFilters().markupPreview;
            const isInNotebookCellInput = this.searchWidget.getNotebookFilters().codeInput;
            const isInNotebookCellOutput = this.searchWidget.getNotebookFilters().codeOutput;
            const isWholeWords = this.searchWidget.searchInput.getWholeWords();
            const isCaseSensitive = this.searchWidget.searchInput.getCaseSensitive();
            const contentPattern = this.searchWidget.searchInput.getValue();
            const excludePatternText = this.inputPatternExcludes.getValue().trim();
            const includePatternText = this.inputPatternIncludes.getValue().trim();
            const useExcludesAndIgnoreFiles = this.inputPatternExcludes.useExcludesAndIgnoreFiles();
            const onlySearchInOpenEditors = this.inputPatternIncludes.onlySearchInOpenEditors();
            if (contentPattern.length === 0) {
                this.clearSearchResults(false);
                this.clearMessage();
                return;
            }
            const content = {
                pattern: contentPattern,
                isRegExp: isRegex,
                isCaseSensitive: isCaseSensitive,
                isWordMatch: isWholeWords,
                notebookInfo: {
                    isInNotebookMarkdownInput,
                    isInNotebookMarkdownPreview,
                    isInNotebookCellInput,
                    isInNotebookCellOutput
                }
            };
            const excludePattern = this.inputPatternExcludes.getValue();
            const includePattern = this.inputPatternIncludes.getValue();
            // Need the full match line to correctly calculate replace text, if this is a search/replace with regex group references ($1, $2, ...).
            // 10000 chars is enough to avoid sending huge amounts of text around, if you do a replace with a longer match, it may or may not resolve the group refs correctly.
            // https://github.com/microsoft/vscode/issues/58374
            const charsPerLine = content.isRegExp ? 10000 : 1000;
            const options = {
                _reason: 'searchView',
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                maxResults: this.searchConfig.maxResults ?? undefined,
                disregardIgnoreFiles: !useExcludesAndIgnoreFiles || undefined,
                disregardExcludeSettings: !useExcludesAndIgnoreFiles || undefined,
                onlyOpenEditors: onlySearchInOpenEditors,
                excludePattern,
                includePattern,
                previewOptions: {
                    matchLines: 1,
                    charsPerLine
                },
                isSmartCase: this.searchConfig.smartCase,
                expandPatterns: true
            };
            const folderResources = this.contextService.getWorkspace().folders;
            const onQueryValidationError = (err) => {
                this.searchWidget.searchInput?.showMessage({ content: err.message, type: 3 /* MessageType.ERROR */ });
                this.viewModel.searchResult.clear();
            };
            let query;
            try {
                query = this.queryBuilder.text(content, folderResources.map(folder => folder.uri), options);
            }
            catch (err) {
                onQueryValidationError(err);
                return;
            }
            this.validateQuery(query).then(() => {
                this.onQueryTriggered(query, options, excludePatternText, includePatternText, triggeredOnType);
                if (!preserveFocus) {
                    this.searchWidget.focus(false, undefined, true); // focus back to input field
                }
            }, onQueryValidationError);
        }
        validateQuery(query) {
            // Validate folderQueries
            const folderQueriesExistP = query.folderQueries.map(fq => {
                return this.fileService.exists(fq.folder).catch(() => false);
            });
            return Promise.all(folderQueriesExistP).then(existResults => {
                // If no folders exist, show an error message about the first one
                const existingFolderQueries = query.folderQueries.filter((folderQuery, i) => existResults[i]);
                if (!query.folderQueries.length || existingFolderQueries.length) {
                    query.folderQueries = existingFolderQueries;
                }
                else {
                    const nonExistantPath = query.folderQueries[0].folder.fsPath;
                    const searchPathNotFoundError = nls.localize('searchPathNotFoundError', "Search path not found: {0}", nonExistantPath);
                    return Promise.reject(new Error(searchPathNotFoundError));
                }
                return undefined;
            });
        }
        onQueryTriggered(query, options, excludePatternText, includePatternText, triggeredOnType) {
            this.addToSearchHistoryDelayer.trigger(() => {
                this.searchWidget.searchInput?.onSearchSubmit();
                this.inputPatternExcludes.onSearchSubmit();
                this.inputPatternIncludes.onSearchSubmit();
            });
            this.viewModel.cancelSearch(true);
            this.viewModel.cancelAISearch(true);
            this.currentSearchQ = this.currentSearchQ
                .then(() => this.doSearch(query, excludePatternText, includePatternText, triggeredOnType))
                .then(() => undefined, () => undefined);
        }
        _updateResults() {
            if (this.state === search_1.SearchUIState.Idle) {
                return;
            }
            try {
                // Search result tree update
                const fileCount = this.viewModel.searchResult.fileCount(this.aiResultsVisible);
                if (this._visibleMatches !== fileCount) {
                    this._visibleMatches = fileCount;
                    this.refreshAndUpdateCount();
                }
            }
            finally {
                // show frequent progress and results by scheduling updates 80 ms after the last one
                this._refreshResultsScheduler.schedule();
            }
        }
        onSearchComplete(progressComplete, excludePatternText, includePatternText, completed) {
            this.state = search_1.SearchUIState.Idle;
            // Complete up to 100% as needed
            progressComplete();
            // Do final render, then expand if just 1 file with less than 50 matches
            this.onSearchResultsChanged();
            const collapseResults = this.searchConfig.collapseResults;
            if (collapseResults !== 'alwaysCollapse' && this.viewModel.searchResult.matches(this.aiResultsVisible).length === 1) {
                const onlyMatch = this.viewModel.searchResult.matches(this.aiResultsVisible)[0];
                if (onlyMatch.count() < 50) {
                    this.tree.expand(onlyMatch);
                }
            }
            const hasResults = !this.viewModel.searchResult.isEmpty(this.aiResultsVisible);
            if (completed?.exit === 1 /* SearchCompletionExitCode.NewSearchStarted */) {
                return;
            }
            if (!hasResults) {
                const hasExcludes = !!excludePatternText;
                const hasIncludes = !!includePatternText;
                let message;
                if (!completed) {
                    message = SEARCH_CANCELLED_MESSAGE;
                }
                else if (this.inputPatternIncludes.onlySearchInOpenEditors()) {
                    if (hasIncludes && hasExcludes) {
                        message = nls.localize('noOpenEditorResultsIncludesExcludes', "No results found in open editors matching '{0}' excluding '{1}' - ", includePatternText, excludePatternText);
                    }
                    else if (hasIncludes) {
                        message = nls.localize('noOpenEditorResultsIncludes', "No results found in open editors matching '{0}' - ", includePatternText);
                    }
                    else if (hasExcludes) {
                        message = nls.localize('noOpenEditorResultsExcludes', "No results found in open editors excluding '{0}' - ", excludePatternText);
                    }
                    else {
                        message = nls.localize('noOpenEditorResultsFound', "No results found in open editors. Review your settings for configured exclusions and check your gitignore files - ");
                    }
                }
                else {
                    if (hasIncludes && hasExcludes) {
                        message = nls.localize('noResultsIncludesExcludes', "No results found in '{0}' excluding '{1}' - ", includePatternText, excludePatternText);
                    }
                    else if (hasIncludes) {
                        message = nls.localize('noResultsIncludes', "No results found in '{0}' - ", includePatternText);
                    }
                    else if (hasExcludes) {
                        message = nls.localize('noResultsExcludes', "No results found excluding '{0}' - ", excludePatternText);
                    }
                    else {
                        message = nls.localize('noResultsFound', "No results found. Review your settings for configured exclusions and check your gitignore files - ");
                    }
                }
                // Indicate as status to ARIA
                aria.status(message);
                const messageEl = this.clearMessage();
                dom.append(messageEl, message);
                if (!completed) {
                    const searchAgainButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('rerunSearch.message', "Search again"), () => this.triggerQueryChange({ preserveFocus: false })));
                    dom.append(messageEl, searchAgainButton.element);
                }
                else if (hasIncludes || hasExcludes) {
                    const searchAgainButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('rerunSearchInAll.message', "Search again in all files"), this.onSearchAgain.bind(this)));
                    dom.append(messageEl, searchAgainButton.element);
                }
                else {
                    const openSettingsButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openSettings.message', "Open Settings"), this.onOpenSettings.bind(this)));
                    dom.append(messageEl, openSettingsButton.element);
                }
                if (completed) {
                    dom.append(messageEl, $('span', undefined, ' - '));
                    const learnMoreButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openSettings.learnMore', "Learn More"), this.onLearnMore.bind(this)));
                    dom.append(messageEl, learnMoreButton.element);
                }
                if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                    this.showSearchWithoutFolderMessage();
                }
                this.reLayout();
            }
            else {
                this.viewModel.searchResult.toggleHighlights(this.isVisible()); // show highlights
                // Indicate final search result count for ARIA
                aria.status(nls.localize('ariaSearchResultsStatus', "Search returned {0} results in {1} files", this.viewModel.searchResult.count(this.aiResultsVisible), this.viewModel.searchResult.fileCount()));
            }
            if (completed && completed.limitHit) {
                completed.messages.push({ type: search_2.TextSearchCompleteMessageType.Warning, text: nls.localize('searchMaxResultsWarning', "The result set only contains a subset of all matches. Be more specific in your search to narrow down the results.") });
            }
            if (completed && completed.messages) {
                for (const message of completed.messages) {
                    this.addMessage(message);
                }
            }
            this.reLayout();
        }
        onSearchError(e, progressComplete, excludePatternText, includePatternText, completed) {
            this.state = search_1.SearchUIState.Idle;
            if (errors.isCancellationError(e)) {
                return this.onSearchComplete(progressComplete, excludePatternText, includePatternText, completed);
            }
            else {
                progressComplete();
                this.searchWidget.searchInput?.showMessage({ content: e.message, type: 3 /* MessageType.ERROR */ });
                this.viewModel.searchResult.clear();
                return Promise.resolve();
            }
        }
        doSearch(query, excludePatternText, includePatternText, triggeredOnType) {
            let progressComplete;
            this.progressService.withProgress({ location: this.getProgressLocation(), delay: triggeredOnType ? 300 : 0 }, _progress => {
                return new Promise(resolve => progressComplete = resolve);
            });
            this.searchWidget.searchInput?.clearMessage();
            this.state = search_1.SearchUIState.Searching;
            this.showEmptyStage();
            const slowTimer = setTimeout(() => {
                this.state = search_1.SearchUIState.SlowSearch;
            }, 2000);
            this._visibleMatches = 0;
            this._refreshResultsScheduler.schedule();
            this.searchWidget.setReplaceAllActionState(false);
            this.tree.setSelection([]);
            this.tree.setFocus([]);
            this.viewModel.replaceString = this.searchWidget.getReplaceValue();
            const result = this.viewModel.search(query);
            if (this.aiResultsVisible) {
                const aiResult = this.viewModel.aiSearch({ ...query, contentPattern: query.contentPattern.pattern, type: 3 /* QueryType.aiText */ });
                return result.asyncResults.then(() => aiResult.then((complete) => {
                    clearTimeout(slowTimer);
                    this.onSearchComplete(progressComplete, excludePatternText, includePatternText, complete);
                }, (e) => {
                    clearTimeout(slowTimer);
                    this.onSearchError(e, progressComplete, excludePatternText, includePatternText);
                }));
            }
            return result.asyncResults.then((complete) => {
                clearTimeout(slowTimer);
                this.onSearchComplete(progressComplete, excludePatternText, includePatternText, complete);
            }, (e) => {
                clearTimeout(slowTimer);
                this.onSearchError(e, progressComplete, excludePatternText, includePatternText);
            });
        }
        onOpenSettings(e) {
            dom.EventHelper.stop(e, false);
            this.openSettings('@id:files.exclude,search.exclude,search.useParentIgnoreFiles,search.useGlobalIgnoreFiles,search.useIgnoreFiles');
        }
        openSettings(query) {
            const options = { query };
            return this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ?
                this.preferencesService.openWorkspaceSettings(options) :
                this.preferencesService.openUserSettings(options);
        }
        onLearnMore() {
            this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=853977'));
        }
        onSearchAgain() {
            this.inputPatternExcludes.setValue('');
            this.inputPatternIncludes.setValue('');
            this.inputPatternIncludes.setOnlySearchInOpenEditors(false);
            this.triggerQueryChange({ preserveFocus: false });
        }
        onEnableExcludes() {
            this.toggleQueryDetails(false, true);
            this.searchExcludePattern.setUseExcludesAndIgnoreFiles(true);
        }
        onDisableSearchInOpenEditors() {
            this.toggleQueryDetails(false, true);
            this.inputPatternIncludes.setOnlySearchInOpenEditors(false);
        }
        updateSearchResultCount(disregardExcludesAndIgnores, onlyOpenEditors, clear = false) {
            const fileCount = this.viewModel.searchResult.fileCount(this.aiResultsVisible);
            const resultCount = this.viewModel.searchResult.count(this.aiResultsVisible);
            this.hasSearchResultsKey.set(fileCount > 0);
            const msgWasHidden = this.messagesElement.style.display === 'none';
            const messageEl = this.clearMessage();
            const resultMsg = clear ? '' : this.buildResultCountMessage(resultCount, fileCount);
            this.tree.ariaLabel = resultMsg + nls.localize('forTerm', " - Search: {0}", this.searchResult.query?.contentPattern.pattern ?? '');
            dom.append(messageEl, resultMsg);
            if (fileCount > 0) {
                if (disregardExcludesAndIgnores) {
                    const excludesDisabledMessage = ' - ' + nls.localize('useIgnoresAndExcludesDisabled', "exclude settings and ignore files are disabled") + ' ';
                    const enableExcludesButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('excludes.enable', "enable"), this.onEnableExcludes.bind(this), nls.localize('useExcludesAndIgnoreFilesDescription', "Use Exclude Settings and Ignore Files")));
                    dom.append(messageEl, $('span', undefined, excludesDisabledMessage, '(', enableExcludesButton.element, ')'));
                }
                if (onlyOpenEditors) {
                    const searchingInOpenMessage = ' - ' + nls.localize('onlyOpenEditors', "searching only in open files") + ' ';
                    const disableOpenEditorsButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openEditors.disable', "disable"), this.onDisableSearchInOpenEditors.bind(this), nls.localize('disableOpenEditors', "Search in entire workspace")));
                    dom.append(messageEl, $('span', undefined, searchingInOpenMessage, '(', disableOpenEditorsButton.element, ')'));
                }
                dom.append(messageEl, ' - ');
                const openInEditorTooltip = (0, searchActionsBase_1.appendKeyBindingLabel)(nls.localize('openInEditor.tooltip', "Copy current search results to an editor"), this.keybindingService.lookupKeybinding("search.action.openInEditor" /* Constants.SearchCommandIds.OpenInEditorCommandId */));
                const openInEditorButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openInEditor.message', "Open in editor"), () => this.instantiationService.invokeFunction(searchEditorActions_1.createEditorFromSearchResult, this.searchResult, this.searchIncludePattern.getValue(), this.searchExcludePattern.getValue(), this.searchIncludePattern.onlySearchInOpenEditors()), openInEditorTooltip));
                dom.append(messageEl, openInEditorButton.element);
                this.reLayout();
            }
            else if (!msgWasHidden) {
                dom.hide(this.messagesElement);
            }
        }
        addMessage(message) {
            const messageBox = this.messagesElement.firstChild;
            if (!messageBox) {
                return;
            }
            dom.append(messageBox, (0, searchMessage_1.renderSearchMessage)(message, this.instantiationService, this.notificationService, this.openerService, this.commandService, this.messageDisposables, () => this.triggerQueryChange()));
        }
        buildResultCountMessage(resultCount, fileCount) {
            if (resultCount === 1 && fileCount === 1) {
                return nls.localize('search.file.result', "{0} result in {1} file", resultCount, fileCount);
            }
            else if (resultCount === 1) {
                return nls.localize('search.files.result', "{0} result in {1} files", resultCount, fileCount);
            }
            else if (fileCount === 1) {
                return nls.localize('search.file.results', "{0} results in {1} file", resultCount, fileCount);
            }
            else {
                return nls.localize('search.files.results', "{0} results in {1} files", resultCount, fileCount);
            }
        }
        showSearchWithoutFolderMessage() {
            this.searchWithoutFolderMessageElement = this.clearMessage();
            const textEl = dom.append(this.searchWithoutFolderMessageElement, $('p', undefined, nls.localize('searchWithoutFolder', "You have not opened or specified a folder. Only open files are currently searched - ")));
            const openFolderButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openFolder', "Open Folder"), () => {
                this.commandService.executeCommand(env.isMacintosh && env.isNative ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFolderAction.ID).catch(err => errors.onUnexpectedError(err));
            }));
            dom.append(textEl, openFolderButton.element);
        }
        showEmptyStage(forceHideMessages = false) {
            const showingCancelled = (this.messagesElement.firstChild?.textContent?.indexOf(SEARCH_CANCELLED_MESSAGE) ?? -1) > -1;
            // clean up ui
            // this.replaceService.disposeAllReplacePreviews();
            if (showingCancelled || forceHideMessages || !this.configurationService.getValue().search.searchOnType) {
                // when in search to type, don't preemptively hide, as it causes flickering and shifting of the live results
                dom.hide(this.messagesElement);
            }
            dom.show(this.resultsElement);
            this.currentSelectedFileMatch = undefined;
        }
        shouldOpenInNotebookEditor(match, uri) {
            // Untitled files will return a false positive for getContributedNotebookTypes.
            // Since untitled files are already open, then untitled notebooks should return NotebookMatch results.
            return match instanceof searchModel_1.MatchInNotebook || (uri.scheme !== network.Schemas.untitled && this.notebookService.getContributedNotebookTypes(uri).length > 0);
        }
        onFocus(lineMatch, preserveFocus, sideBySide, pinned) {
            const useReplacePreview = this.configurationService.getValue().search.useReplacePreview;
            const resource = lineMatch instanceof searchModel_1.Match ? lineMatch.parent().resource : lineMatch.resource;
            return (useReplacePreview && this.viewModel.isReplaceActive() && !!this.viewModel.replaceString && !(this.shouldOpenInNotebookEditor(lineMatch, resource))) ?
                this.replaceService.openReplacePreview(lineMatch, preserveFocus, sideBySide, pinned) :
                this.open(lineMatch, preserveFocus, sideBySide, pinned, resource);
        }
        async open(element, preserveFocus, sideBySide, pinned, resourceInput) {
            const selection = getEditorSelectionFromMatch(element, this.viewModel);
            const oldParentMatches = element instanceof searchModel_1.Match ? element.parent().matches() : [];
            const resource = resourceInput ?? (element instanceof searchModel_1.Match ? element.parent().resource : element.resource);
            let editor;
            const options = {
                preserveFocus,
                pinned,
                selection,
                revealIfVisible: true,
            };
            try {
                editor = await this.editorService.openEditor({
                    resource: resource,
                    options,
                }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                const editorControl = editor?.getControl();
                if (element instanceof searchModel_1.Match && preserveFocus && (0, editorBrowser_1.isCodeEditor)(editorControl)) {
                    this.viewModel.searchResult.rangeHighlightDecorations.highlightRange(editorControl.getModel(), element.range());
                }
                else {
                    this.viewModel.searchResult.rangeHighlightDecorations.removeHighlightRange();
                }
            }
            catch (err) {
                errors.onUnexpectedError(err);
                return;
            }
            if (editor instanceof notebookEditor_1.NotebookEditor) {
                const elemParent = element.parent();
                if (element instanceof searchModel_1.Match) {
                    if (element instanceof searchModel_1.MatchInNotebook) {
                        element.parent().showMatch(element);
                    }
                    else {
                        const editorWidget = editor.getControl();
                        if (editorWidget) {
                            // Ensure that the editor widget is binded. If if is, then this should return immediately.
                            // Otherwise, it will bind the widget.
                            elemParent.bindNotebookEditorWidget(editorWidget);
                            await elemParent.updateMatchesForEditorWidget();
                            const matchIndex = oldParentMatches.findIndex(e => e.id() === element.id());
                            const matches = elemParent.matches();
                            const match = matchIndex >= matches.length ? matches[matches.length - 1] : matches[matchIndex];
                            if (match instanceof searchModel_1.MatchInNotebook) {
                                elemParent.showMatch(match);
                                if (!this.tree.getFocus().includes(match) || !this.tree.getSelection().includes(match)) {
                                    this.tree.setSelection([match], (0, listService_1.getSelectionKeyboardEvent)());
                                    this.tree.setFocus([match]);
                                }
                            }
                        }
                    }
                }
            }
        }
        openEditorWithMultiCursor(element) {
            const resource = element instanceof searchModel_1.Match ? element.parent().resource : element.resource;
            return this.editorService.openEditor({
                resource: resource,
                options: {
                    preserveFocus: false,
                    pinned: true,
                    revealIfVisible: true
                }
            }).then(editor => {
                if (editor) {
                    let fileMatch = null;
                    if (element instanceof searchModel_1.FileMatch) {
                        fileMatch = element;
                    }
                    else if (element instanceof searchModel_1.Match) {
                        fileMatch = element.parent();
                    }
                    if (fileMatch) {
                        const selections = fileMatch.matches().map(m => new selection_1.Selection(m.range().startLineNumber, m.range().startColumn, m.range().endLineNumber, m.range().endColumn));
                        const codeEditor = (0, editorBrowser_1.getCodeEditor)(editor.getControl());
                        if (codeEditor) {
                            const multiCursorController = multicursor_1.MultiCursorSelectionController.get(codeEditor);
                            multiCursorController?.selectAllUsingSelections(selections);
                        }
                    }
                }
                this.viewModel.searchResult.rangeHighlightDecorations.removeHighlightRange();
            }, errors.onUnexpectedError);
        }
        onUntitledDidDispose(resource) {
            if (!this.viewModel) {
                return;
            }
            // remove search results from this resource as it got disposed
            let matches = this.viewModel.searchResult.matches();
            for (let i = 0, len = matches.length; i < len; i++) {
                if (resource.toString() === matches[i].resource.toString()) {
                    this.viewModel.searchResult.remove(matches[i]);
                }
            }
            matches = this.viewModel.searchResult.matches(true);
            for (let i = 0, len = matches.length; i < len; i++) {
                if (resource.toString() === matches[i].resource.toString()) {
                    this.viewModel.searchResult.remove(matches[i]);
                }
            }
        }
        onFilesChanged(e) {
            if (!this.viewModel || (this.searchConfig.sortOrder !== "modified" /* SearchSortOrder.Modified */ && !e.gotDeleted())) {
                return;
            }
            const matches = this.viewModel.searchResult.matches();
            if (e.gotDeleted()) {
                const deletedMatches = matches.filter(m => e.contains(m.resource, 2 /* FileChangeType.DELETED */));
                this.viewModel.searchResult.remove(deletedMatches);
            }
            else {
                // Check if the changed file contained matches
                const changedMatches = matches.filter(m => e.contains(m.resource));
                if (changedMatches.length && this.searchConfig.sortOrder === "modified" /* SearchSortOrder.Modified */) {
                    // No matches need to be removed, but modified files need to have their file stat updated.
                    this.updateFileStats(changedMatches).then(() => this.refreshTree());
                }
            }
        }
        get searchConfig() {
            return this.configurationService.getValue('search');
        }
        clearHistory() {
            this.searchWidget.clearHistory();
            this.inputPatternExcludes.clearHistory();
            this.inputPatternIncludes.clearHistory();
        }
        saveState() {
            // This can be called before renderBody() method gets called for the first time
            // if we move the searchView inside another viewPaneContainer
            if (!this.searchWidget) {
                return;
            }
            const patternExcludes = this.inputPatternExcludes?.getValue().trim() ?? '';
            const patternIncludes = this.inputPatternIncludes?.getValue().trim() ?? '';
            const onlyOpenEditors = this.inputPatternIncludes?.onlySearchInOpenEditors() ?? false;
            const useExcludesAndIgnoreFiles = this.inputPatternExcludes?.useExcludesAndIgnoreFiles() ?? true;
            const preserveCase = this.viewModel.preserveCase;
            if (this.searchWidget.searchInput) {
                const isRegex = this.searchWidget.searchInput.getRegex();
                const isWholeWords = this.searchWidget.searchInput.getWholeWords();
                const isCaseSensitive = this.searchWidget.searchInput.getCaseSensitive();
                const contentPattern = this.searchWidget.searchInput.getValue();
                const isInNotebookCellInput = this.searchWidget.getNotebookFilters().codeInput;
                const isInNotebookCellOutput = this.searchWidget.getNotebookFilters().codeOutput;
                const isInNotebookMarkdownInput = this.searchWidget.getNotebookFilters().markupInput;
                const isInNotebookMarkdownPreview = this.searchWidget.getNotebookFilters().markupPreview;
                this.viewletState['query.contentPattern'] = contentPattern;
                this.viewletState['query.regex'] = isRegex;
                this.viewletState['query.wholeWords'] = isWholeWords;
                this.viewletState['query.caseSensitive'] = isCaseSensitive;
                this.viewletState['query.isInNotebookMarkdownInput'] = isInNotebookMarkdownInput;
                this.viewletState['query.isInNotebookMarkdownPreview'] = isInNotebookMarkdownPreview;
                this.viewletState['query.isInNotebookCellInput'] = isInNotebookCellInput;
                this.viewletState['query.isInNotebookCellOutput'] = isInNotebookCellOutput;
            }
            this.viewletState['query.folderExclusions'] = patternExcludes;
            this.viewletState['query.folderIncludes'] = patternIncludes;
            this.viewletState['query.useExcludesAndIgnoreFiles'] = useExcludesAndIgnoreFiles;
            this.viewletState['query.preserveCase'] = preserveCase;
            this.viewletState['query.onlyOpenEditors'] = onlyOpenEditors;
            const isReplaceShown = this.searchAndReplaceWidget.isReplaceShown();
            this.viewletState['view.showReplace'] = isReplaceShown;
            this.viewletState['view.treeLayout'] = this.isTreeLayoutViewVisible;
            this.viewletState['query.replaceText'] = isReplaceShown && this.searchWidget.getReplaceValue();
            this._saveSearchHistoryService();
            this.memento.saveMemento();
            super.saveState();
        }
        _saveSearchHistoryService() {
            if (this.searchWidget === undefined) {
                return;
            }
            const history = Object.create(null);
            const searchHistory = this.searchWidget.getSearchHistory();
            if (searchHistory && searchHistory.length) {
                history.search = searchHistory;
            }
            const replaceHistory = this.searchWidget.getReplaceHistory();
            if (replaceHistory && replaceHistory.length) {
                history.replace = replaceHistory;
            }
            const patternExcludesHistory = this.inputPatternExcludes.getHistory();
            if (patternExcludesHistory && patternExcludesHistory.length) {
                history.exclude = patternExcludesHistory;
            }
            const patternIncludesHistory = this.inputPatternIncludes.getHistory();
            if (patternIncludesHistory && patternIncludesHistory.length) {
                history.include = patternIncludesHistory;
            }
            this.searchHistoryService.save(history);
        }
        async retrieveFileStats() {
            const files = this.searchResult.matches(this.aiResultsVisible).filter(f => !f.fileStat).map(f => f.resolveFileStat(this.fileService));
            await Promise.all(files);
        }
        async updateFileStats(elements) {
            const files = elements.map(f => f.resolveFileStat(this.fileService));
            await Promise.all(files);
        }
        removeFileStats() {
            for (const fileMatch of this.searchResult.matches()) {
                fileMatch.fileStat = undefined;
            }
            for (const fileMatch of this.searchResult.matches(true)) {
                fileMatch.fileStat = undefined;
            }
        }
        dispose() {
            this.isDisposed = true;
            this.saveState();
            super.dispose();
        }
    };
    exports.SearchView = SearchView;
    exports.SearchView = SearchView = SearchView_1 = __decorate([
        __param(1, files_1.IFileService),
        __param(2, editorService_1.IEditorService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, progress_1.IProgressService),
        __param(5, notification_1.INotificationService),
        __param(6, dialogs_1.IDialogService),
        __param(7, commands_1.ICommandService),
        __param(8, contextView_1.IContextViewService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, searchModel_1.ISearchViewModelWorkbenchService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, replace_1.IReplaceService),
        __param(16, textfiles_1.ITextFileService),
        __param(17, preferences_1.IPreferencesService),
        __param(18, themeService_1.IThemeService),
        __param(19, searchHistoryService_1.ISearchHistoryService),
        __param(20, contextView_1.IContextMenuService),
        __param(21, accessibility_1.IAccessibilityService),
        __param(22, keybinding_1.IKeybindingService),
        __param(23, storage_1.IStorageService),
        __param(24, opener_1.IOpenerService),
        __param(25, telemetry_1.ITelemetryService),
        __param(26, notebookService_1.INotebookService),
        __param(27, log_1.ILogService),
        __param(28, accessibilitySignalService_1.IAccessibilitySignalService)
    ], SearchView);
    class SearchLinkButton extends lifecycle_1.Disposable {
        constructor(label, handler, tooltip) {
            super();
            this.element = $('a.pointer', { tabindex: 0 }, label);
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.element, tooltip));
            this.addEventHandlers(handler);
        }
        addEventHandlers(handler) {
            const wrappedHandler = (e) => {
                dom.EventHelper.stop(e, false);
                handler(e);
            };
            this._register(dom.addDisposableListener(this.element, dom.EventType.CLICK, wrappedHandler));
            this._register(dom.addDisposableListener(this.element, dom.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */)) {
                    wrappedHandler(e);
                    event.preventDefault();
                    event.stopPropagation();
                }
            }));
        }
    }
    function getEditorSelectionFromMatch(element, viewModel) {
        let match = null;
        if (element instanceof searchModel_1.Match) {
            match = element;
        }
        if (element instanceof searchModel_1.FileMatch && element.count() > 0) {
            match = element.matches()[element.matches().length - 1];
        }
        if (match) {
            const range = match.range();
            if (viewModel.isReplaceActive() && !!viewModel.replaceString) {
                const replaceString = match.replaceString;
                return {
                    startLineNumber: range.startLineNumber,
                    startColumn: range.startColumn,
                    endLineNumber: range.startLineNumber,
                    endColumn: range.startColumn + replaceString.length
                };
            }
            return range;
        }
        return undefined;
    }
    function getSelectionTextFromEditor(allowUnselectedWord, activeEditor) {
        let editor = activeEditor;
        if ((0, editorBrowser_1.isDiffEditor)(editor)) {
            if (editor.getOriginalEditor().hasTextFocus()) {
                editor = editor.getOriginalEditor();
            }
            else {
                editor = editor.getModifiedEditor();
            }
        }
        if (!(0, editorBrowser_1.isCodeEditor)(editor) || !editor.hasModel()) {
            return null;
        }
        const range = editor.getSelection();
        if (!range) {
            return null;
        }
        if (range.isEmpty()) {
            if (allowUnselectedWord) {
                const wordAtPosition = editor.getModel().getWordAtPosition(range.getStartPosition());
                return wordAtPosition?.word ?? null;
            }
            else {
                return null;
            }
        }
        let searchText = '';
        for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
            let lineText = editor.getModel().getLineContent(i);
            if (i === range.endLineNumber) {
                lineText = lineText.substring(0, range.endColumn - 1);
            }
            if (i === range.startLineNumber) {
                lineText = lineText.substring(range.startColumn - 1);
            }
            if (i !== range.startLineNumber) {
                lineText = '\n' + lineText;
            }
            searchText += lineText;
        }
        return searchText;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL2Jyb3dzZXIvc2VhcmNoVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb3NFaEcsa0VBc0JDO0lBRUQsZ0VBaURDO0lBMXJFRCxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLElBQVksa0JBR1g7SUFIRCxXQUFZLGtCQUFrQjtRQUM3QixpRUFBTyxDQUFBO1FBQ1AsNkRBQUssQ0FBQTtJQUNOLENBQUMsRUFIVyxrQkFBa0Isa0NBQWxCLGtCQUFrQixRQUc3QjtJQUVELE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSwwREFBMEQsQ0FBQyxDQUFDO0lBQzVILE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUNuQixJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFXLFNBQVEsbUJBQVE7O2lCQUVmLDZCQUF3QixHQUFHLGVBQWUsQUFBbEIsQ0FBbUI7UUF1RW5FLFlBQ0MsT0FBeUIsRUFDWCxXQUEwQyxFQUN4QyxhQUE4QyxFQUMxQyxpQkFBc0QsRUFDeEQsZUFBa0QsRUFDOUMsbUJBQTBELEVBQ2hFLGFBQThDLEVBQzdDLGNBQWdELEVBQzVDLGtCQUF3RCxFQUN0RCxvQkFBMkMsRUFDMUMscUJBQTZDLEVBQzlDLG9CQUEyQyxFQUN4QyxjQUF5RCxFQUNqRCwrQkFBa0YsRUFDaEcsaUJBQXFDLEVBQ3hDLGNBQWdELEVBQy9DLGVBQWtELEVBQy9DLGtCQUF3RCxFQUM5RCxZQUEyQixFQUNuQixvQkFBNEQsRUFDOUQsa0JBQXVDLEVBQ3JDLG9CQUE0RCxFQUMvRCxpQkFBcUMsRUFDeEMsY0FBZ0QsRUFDakQsYUFBNkIs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