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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/model", "vs/editor/common/services/textResourceConfiguration", "vs/editor/contrib/gotoSymbol/browser/peek/referencesController", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/label/common/label", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/textCodeEditor", "vs/workbench/contrib/search/browser/patternInputWidget", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/search/browser/searchIcons", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/notification/common/notification", "vs/workbench/contrib/search/browser/searchMessage", "vs/editor/browser/editorExtensions", "vs/editor/contrib/unusualLineTerminators/browser/unusualLineTerminators", "vs/platform/theme/browser/defaultStyles", "vs/platform/log/common/log", "vs/workbench/contrib/search/common/constants", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./media/searchEditor"], function (require, exports, DOM, keyboardEvent_1, aria_1, async_1, lifecycle_1, types_1, position_1, range_1, selection_1, model_1, textResourceConfiguration_1, referencesController_1, nls_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, label_1, progress_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, themables_1, workspace_1, textCodeEditor_1, patternInputWidget_1, searchWidget_1, queryBuilder_1, search_1, searchModel_1, constants_1, searchEditorSerialization_1, editorGroupsService_1, editorService_1, searchIcons_1, files_1, opener_1, notification_1, searchMessage_1, editorExtensions_1, unusualLineTerminators_1, defaultStyles_1, log_1, constants_2, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var SearchEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchEditor = void 0;
    const RESULT_LINE_REGEX = /^(\s+)(\d+)(: |  )(\s*)(.*)$/;
    const FILE_LINE_REGEX = /^(\S.*):$/;
    let SearchEditor = class SearchEditor extends textCodeEditor_1.AbstractTextCodeEditor {
        static { SearchEditor_1 = this; }
        static { this.ID = constants_1.SearchEditorID; }
        static { this.SEARCH_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'searchEditorViewState'; }
        get searchResultEditor() { return this.editorControl; }
        constructor(group, telemetryService, themeService, storageService, modelService, contextService, labelService, instantiationService, contextViewService, commandService, openerService, notificationService, progressService, textResourceService, editorGroupService, editorService, configurationService, fileService, logService) {
            super(SearchEditor_1.ID, group, telemetryService, instantiationService, storageService, textResourceService, themeService, editorService, editorGroupService, fileService);
            this.modelService = modelService;
            this.contextService = contextService;
            this.labelService = labelService;
            this.contextViewService = contextViewService;
            this.commandService = commandService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.runSearchDelayer = new async_1.Delayer(0);
            this.pauseSearching = false;
            this.showingIncludesExcludes = false;
            this.ongoingOperations = 0;
            this.updatingModelForSearch = false;
            this.container = DOM.$('.search-editor');
            this.searchOperation = this._register(new progress_1.LongRunningOperation(progressService));
            this._register(this.messageDisposables = new lifecycle_1.DisposableStore());
            this.searchHistoryDelayer = new async_1.Delayer(2000);
            this.searchModel = this._register(this.instantiationService.createInstance(searchModel_1.SearchModel));
        }
        createEditor(parent) {
            DOM.append(parent, this.container);
            this.queryEditorContainer = DOM.append(this.container, DOM.$('.query-container'));
            const searchResultContainer = DOM.append(this.container, DOM.$('.search-results'));
            super.createEditor(searchResultContainer);
            this.registerEditorListeners();
            const scopedContextKeyService = (0, types_1.assertIsDefined)(this.scopedContextKeyService);
            constants_1.InSearchEditor.bindTo(scopedContextKeyService).set(true);
            this.createQueryEditor(this.queryEditorContainer, this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService])), constants_2.SearchContext.InputBoxFocusedKey.bindTo(scopedContextKeyService));
        }
        createQueryEditor(container, scopedInstantiationService, inputBoxFocusedContextKey) {
            const searchEditorInputboxStyles = (0, defaultStyles_1.getInputBoxStyle)({ inputBorder: searchEditorTextInputBorder });
            this.queryEditorWidget = this._register(scopedInstantiationService.createInstance(searchWidget_1.SearchWidget, container, { _hideReplaceToggle: true, showContextToggle: true, inputBoxStyles: searchEditorInputboxStyles, toggleStyles: defaultStyles_1.defaultToggleStyles }));
            this._register(this.queryEditorWidget.onReplaceToggled(() => this.reLayout()));
            this._register(this.queryEditorWidget.onDidHeightChange(() => this.reLayout()));
            this._register(this.queryEditorWidget.onSearchSubmit(({ delay }) => this.triggerSearch({ delay })));
            if (this.queryEditorWidget.searchInput) {
                this._register(this.queryEditorWidget.searchInput.onDidOptionChange(() => this.triggerSearch({ resetCursor: false })));
            }
            else {
                this.logService.warn('SearchEditor: SearchWidget.searchInput is undefined, cannot register onDidOptionChange listener');
            }
            this._register(this.queryEditorWidget.onDidToggleContext(() => this.triggerSearch({ resetCursor: false })));
            // Includes/Excludes Dropdown
            this.includesExcludesContainer = DOM.append(container, DOM.$('.includes-excludes'));
            // Toggle query details button
            this.toggleQueryDetailsButton = DOM.append(this.includesExcludesContainer, DOM.$('.expand' + themables_1.ThemeIcon.asCSSSelector(searchIcons_1.searchDetailsIcon), { tabindex: 0, role: 'button' }));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), this.toggleQueryDetailsButton, (0, nls_1.localize)('moreSearch', "Toggle Search Details")));
            this._register(DOM.addDisposableListener(this.toggleQueryDetailsButton, DOM.EventType.CLICK, e => {
                DOM.EventHelper.stop(e);
                this.toggleIncludesExcludes();
            }));
            this._register(DOM.addDisposableListener(this.toggleQueryDetailsButton, DOM.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    DOM.EventHelper.stop(e);
                    this.toggleIncludesExcludes();
                }
            }));
            this._register(DOM.addDisposableListener(this.toggleQueryDetailsButton, DOM.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                    if (this.queryEditorWidget.isReplaceActive()) {
                        this.queryEditorWidget.focusReplaceAllAction();
                    }
                    else {
                        this.queryEditorWidget.isReplaceShown() ? this.queryEditorWidget.replaceInput?.focusOnPreserve() : this.queryEditorWidget.focusRegexAction();
                    }
                    DOM.EventHelper.stop(e);
                }
            }));
            // Includes
            const folderIncludesList = DOM.append(this.includesExcludesContainer, DOM.$('.file-types.includes'));
            const filesToIncludeTitle = (0, nls_1.localize)('searchScope.includes', "files to include");
            DOM.append(folderIncludesList, DOM.$('h4', undefined, filesToIncludeTitle));
            this.inputPatternIncludes = this._register(scopedInstantiationService.createInstance(patternInputWidget_1.IncludePatternInputWidget, folderIncludesList, this.contextViewService, {
                ariaLabel: (0, nls_1.localize)('label.includes', 'Search Include Patterns'),
                inputBoxStyles: searchEditorInputboxStyles
            }));
            this.inputPatternIncludes.onSubmit(triggeredOnType => this.triggerSearch({ resetCursor: false, delay: triggeredOnType ? this.searchConfig.searchOnTypeDebouncePeriod : 0 }));
            this._register(this.inputPatternIncludes.onChangeSearchInEditorsBox(() => this.triggerSearch()));
            // Excludes
            const excludesList = DOM.append(this.includesExcludesContainer, DOM.$('.file-types.excludes'));
            const excludesTitle = (0, nls_1.localize)('searchScope.excludes', "files to exclude");
            DOM.append(excludesList, DOM.$('h4', undefined, excludesTitle));
            this.inputPatternExcludes = this._register(scopedInstantiationService.createInstance(patternInputWidget_1.ExcludePatternInputWidget, excludesList, this.contextViewService, {
                ariaLabel: (0, nls_1.localize)('label.excludes', 'Search Exclude Patterns'),
                inputBoxStyles: searchEditorInputboxStyles
            }));
            this.inputPatternExcludes.onSubmit(triggeredOnType => this.triggerSearch({ resetCursor: false, delay: triggeredOnType ? this.searchConfig.searchOnTypeDebouncePeriod : 0 }));
            this._register(this.inputPatternExcludes.onChangeIgnoreBox(() => this.triggerSearch()));
            // Messages
            this.messageBox = DOM.append(container, DOM.$('.messages.text-search-provider-messages'));
            [this.queryEditorWidget.searchInputFocusTracker, this.queryEditorWidget.replaceInputFocusTracker, this.inputPatternExcludes.inputFocusTracker, this.inputPatternIncludes.inputFocusTracker]
                .forEach(tracker => {
                if (!tracker) {
                    return;
                }
                this._register(tracker.onDidFocus(() => setTimeout(() => inputBoxFocusedContextKey.set(true), 0)));
                this._register(tracker.onDidBlur(() => inputBoxFocusedContextKey.set(false)));
            });
        }
        toggleRunAgainMessage(show) {
            DOM.clearNode(this.messageBox);
            this.messageDisposables.clear();
            if (show) {
                const runAgainLink = DOM.append(this.messageBox, DOM.$('a.pointer.prominent.message', {}, (0, nls_1.localize)('runSearch', "Run Search")));
                this.messageDisposables.add(DOM.addDisposableListener(runAgainLink, DOM.EventType.CLICK, async () => {
                    await this.triggerSearch();
                    this.searchResultEditor.focus();
                }));
            }
        }
        _getContributions() {
            const skipContributions = [unusualLineTerminators_1.UnusualLineTerminatorsDetector.ID];
            return editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => skipContributions.indexOf(c.id) === -1);
        }
        getCodeEditorWidgetOptions() {
            return { contributions: this._getContributions() };
        }
        registerEditorListeners() {
            this.searchResultEditor.onMouseUp(e => {
                if (e.event.detail === 1) {
                    const behaviour = this.searchConfig.searchEditor.singleClickBehaviour;
                    const position = e.target.position;
                    if (position && behaviour === 'peekDefinition') {
                        const line = this.searchResultEditor.getModel()?.getLineContent(position.lineNumber) ?? '';
                        if (line.match(FILE_LINE_REGEX) || line.match(RESULT_LINE_REGEX)) {
                            this.searchResultEditor.setSelection(range_1.Range.fromPositions(position));
                            this.commandService.executeCommand('editor.action.peekDefinition');
                        }
                    }
                }
                else if (e.event.detail === 2) {
                    const behaviour = this.searchConfig.searchEditor.doubleClickBehaviour;
                    const position = e.target.position;
                    if (position && behaviour !== 'selectWord') {
                        const line = this.searchResultEditor.getModel()?.getLineContent(position.lineNumber) ?? '';
                        if (line.match(RESULT_LINE_REGEX)) {
                            this.searchResultEditor.setSelection(range_1.Range.fromPositions(position));
                            this.commandService.executeCommand(behaviour === 'goToLocation' ? 'editor.action.goToDeclaration' : 'editor.action.openDeclarationToTheSide');
                        }
                        else if (line.match(FILE_LINE_REGEX)) {
                            this.searchResultEditor.setSelection(range_1.Range.fromPositions(position));
                            this.commandService.executeCommand('editor.action.peekDefinition');
                        }
                    }
                }
            });
            this._register(this.searchResultEditor.onDidChangeModelContent(() => {
                if (!this.updatingModelForSearch) {
                    this.getInput()?.setDirty(true);
                }
            }));
        }
        getControl() {
            return this.searchResultEditor;
        }
        focus() {
            super.focus();
            const viewState = this.loadEditorViewState(this.getInput());
            if (viewState && viewState.focused === 'editor') {
                this.searchResultEditor.focus();
            }
            else {
                this.queryEditorWidget.focus();
            }
        }
        focusSearchInput() {
            this.queryEditorWidget.searchInput?.focus();
        }
        focusFilesToIncludeInput() {
            if (!this.showingIncludesExcludes) {
                this.toggleIncludesExcludes(true);
            }
            this.inputPatternIncludes.focus();
        }
        focusFilesToExcludeInput() {
            if (!this.showingIncludesExcludes) {
                this.toggleIncludesExcludes(true);
            }
            this.inputPatternExcludes.focus();
        }
        focusNextInput() {
            if (this.queryEditorWidget.searchInputHasFocus()) {
                if (this.showingIncludesExcludes) {
                    this.inputPatternIncludes.focus();
                }
                else {
                    this.searchResultEditor.focus();
                }
            }
            else if (this.inputPatternIncludes.inputHasFocus()) {
                this.inputPatternExcludes.focus();
            }
            else if (this.inputPatternExcludes.inputHasFocus()) {
                this.searchResultEditor.focus();
            }
            else if (this.searchResultEditor.hasWidgetFocus()) {
                // pass
            }
        }
        focusPrevInput() {
            if (this.queryEditorWidget.searchInputHasFocus()) {
                this.searchResultEditor.focus(); // wrap
            }
            else if (this.inputPatternIncludes.inputHasFocus()) {
                this.queryEditorWidget.searchInput?.focus();
            }
            else if (this.inputPatternExcludes.inputHasFocus()) {
                this.inputPatternIncludes.focus();
            }
            else if (this.searchResultEditor.hasWidgetFocus()) {
                // unreachable.
            }
        }
        setQuery(query) {
            this.queryEditorWidget.searchInput?.setValue(query);
        }
        selectQuery() {
            this.queryEditorWidget.searchInput?.select();
        }
        toggleWholeWords() {
            this.queryEditorWidget.searchInput?.setWholeWords(!this.queryEditorWidget.searchInput.getWholeWords());
            this.triggerSearch({ resetCursor: false });
        }
        toggleRegex() {
            this.queryEditorWidget.searchInput?.setRegex(!this.queryEditorWidget.searchInput.getRegex());
            this.triggerSearch({ resetCursor: false });
        }
        toggleCaseSensitive() {
            this.queryEditorWidget.searchInput?.setCaseSensitive(!this.queryEditorWidget.searchInput.getCaseSensitive());
            this.triggerSearch({ resetCursor: false });
        }
        toggleContextLines() {
            this.queryEditorWidget.toggleContextLines();
        }
        modifyContextLines(increase) {
            this.queryEditorWidget.modifyContextLines(increase);
        }
        toggleQueryDetails(shouldShow) {
            this.toggleIncludesExcludes(shouldShow);
        }
        deleteResultBlock() {
            const linesToDelete = new Set();
            const selections = this.searchResultEditor.getSelections();
            const model = this.searchResultEditor.getModel();
            if (!(selections && model)) {
                return;
            }
            const maxLine = model.getLineCount();
            const minLine = 1;
            const deleteUp = (start) => {
                for (let cursor = start; cursor >= minLine; cursor--) {
                    const line = model.getLineContent(cursor);
                    linesToDelete.add(cursor);
                    if (line[0] !== undefined && line[0] !== ' ') {
                        break;
                    }
                }
            };
            const deleteDown = (start) => {
                linesToDelete.add(start);
                for (let cursor = start + 1; cursor <= maxLine; cursor++) {
                    const line = model.getLineContent(cursor);
                    if (line[0] !== undefined && line[0] !== ' ') {
                        return cursor;
                    }
                    linesToDelete.add(cursor);
                }
                return;
            };
            const endingCursorLines = [];
            for (const selection of selections) {
                const lineNumber = selection.startLineNumber;
                endingCursorLines.push(deleteDown(lineNumber));
                deleteUp(lineNumber);
                for (let inner = selection.startLineNumber; inner <= selection.endLineNumber; inner++) {
                    linesToDelete.add(inner);
                }
            }
            if (endingCursorLines.length === 0) {
                endingCursorLines.push(1);
            }
            const isDefined = (x) => x !== undefined;
            model.pushEditOperations(this.searchResultEditor.getSelections(), [...linesToDelete].map(line => ({ range: new range_1.Range(line, 1, line + 1, 1), text: '' })), () => endingCursorLines.filter(isDefined).map(line => new selection_1.Selection(line, 1, line, 1)));
        }
        cleanState() {
            this.getInput()?.setDirty(false);
        }
        get searchConfig() {
            return this.configurationService.getValue('search');
        }
        iterateThroughMatches(reverse) {
            const model = this.searchResultEditor.getModel();
            if (!model) {
                return;
            }
            const lastLine = model.getLineCount() ?? 1;
            const lastColumn = model.getLineLength(lastLine);
            const fallbackStart = reverse ? new position_1.Position(lastLine, lastColumn) : new position_1.Position(1, 1);
            const currentPosition = this.searchResultEditor.getSelection()?.getStartPosition() ?? fallbackStart;
            const matchRanges = this.getInput()?.getMatchRanges();
            if (!matchRanges) {
                return;
            }
            const matchRange = (reverse ? findPrevRange : findNextRange)(matchRanges, currentPosition);
            this.searchResultEditor.setSelection(matchRange);
            this.searchResultEditor.revealLineInCenterIfOutsideViewport(matchRange.startLineNumber);
            this.searchResultEditor.focus();
            const matchLineText = model.getLineContent(matchRange.startLineNumber);
            const matchText = model.getValueInRange(matchRange);
            let file = '';
            for (let line = matchRange.startLineNumber; line >= 1; line--) {
                const lineText = model.getValueInRange(new range_1.Range(line, 1, line, 2));
                if (lineText !== ' ') {
                    file = model.getLineContent(line);
                    break;
                }
            }
            (0, aria_1.alert)((0, nls_1.localize)('searchResultItem', "Matched {0} at {1} in file {2}", matchText, matchLineText, file.slice(0, file.length - 1)));
        }
        focusNextResult() {
            this.iterateThroughMatches(false);
        }
        focusPreviousResult() {
            this.iterateThroughMatches(true);
        }
        focusAllResults() {
            this.searchResultEditor
                .setSelections((this.getInput()?.getMatchRanges() ?? []).map(range => new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)));
            this.searchResultEditor.focus();
        }
        async triggerSearch(_options) {
            const options = { resetCursor: true, delay: 0, ..._options };
            if (!this.pauseSearching) {
                await this.runSearchDelayer.trigger(async () => {
                    this.toggleRunAgainMessage(false);
                    await this.doRunSearch();
                    if (options.resetCursor) {
                        this.searchResultEditor.setPosition(new position_1.Position(1, 1));
                        this.searchResultEditor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
                    }
                    if (options.focusResults) {
                        this.searchResultEditor.focus();
                    }
                }, options.delay);
            }
        }
        readConfigFromWidget() {
            return {
                isCaseSensitive: this.queryEditorWidget.searchInput?.getCaseSensitive() ?? false,
                contextLines: this.queryEditorWidget.getContextLines(),
                filesToExclude: this.inputPatternExcludes.getValue(),
                filesToInclude: this.inputPatternIncludes.getValue(),
                query: this.queryEditorWidget.searchInput?.getValue() ?? '',
                isRegexp: this.queryEditorWidget.searchInput?.getRegex() ?? false,
                matchWholeWord: this.queryEditorWidget.searchInput?.getWholeWords() ?? false,
                useExcludeSettingsAndIgnoreFiles: this.inputPatternExcludes.useExcludesAndIgnoreFiles(),
                onlyOpenEditors: this.inputPatternIncludes.onlySearchInOpenEditors(),
                showIncludesExcludes: this.showingIncludesExcludes,
                notebookSearchConfig: {
                    includeMarkupInput: this.queryEditorWidget.getNotebookFilters().markupInput,
                    includeMarkupPreview: this.queryEditorWidget.getNotebookFilters().markupPreview,
                    includeCodeInput: this.queryEditorWidget.getNotebookFilters().codeInput,
                    includeOutput: this.queryEditorWidget.getNotebookFilters().codeOutput,
                }
            };
        }
        async doRunSearch() {
            this.searchModel.cancelSearch(true);
            const startInput = this.getInput();
            if (!startInput) {
                return;
            }
            this.searchHistoryDelayer.trigger(() => {
                this.queryEditorWidget.searchInput?.onSearchSubmit();
                this.inputPatternExcludes.onSearchSubmit();
                this.inputPatternIncludes.onSearchSubmit();
            });
            const config = this.readConfigFromWidget();
            if (!config.query) {
                return;
            }
            const content = {
                pattern: config.query,
                isRegExp: config.isRegexp,
                isCaseSensitive: config.isCaseSensitive,
                isWordMatch: config.matchWholeWord,
            };
            const options = {
                _reason: 'searchEditor',
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                maxResults: this.searchConfig.maxResults ?? undefined,
                disregardIgnoreFiles: !config.useExcludeSettingsAndIgnoreFiles || undefined,
                disregardExcludeSettings: !config.useExcludeSettingsAndIgnoreFiles || undefined,
                excludePattern: config.filesToExclude,
                includePattern: config.filesToInclude,
                onlyOpenEditors: config.onlyOpenEditors,
                previewOptions: {
                    matchLines: 1,
                    charsPerLine: 1000
                },
                afterContext: config.contextLines,
                beforeContext: config.contextLines,
                isSmartCase: this.searchConfig.smartCase,
                expandPatterns: true,
                notebookSearchConfig: {
                    includeMarkupInput: config.notebookSearchConfig.includeMarkupInput,
                    includeMarkupPreview: config.notebookSearchConfig.includeMarkupPreview,
                    includeCodeInput: config.notebookSearchConfig.includeCodeInput,
                    includeOutput: config.notebookSearchConfig.includeOutput,
                }
            };
            const folderResources = this.contextService.getWorkspace().folders;
            let query;
            try {
                const queryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
                query = queryBuilder.text(content, folderResources.map(folder => folder.uri), options);
            }
            catch (err) {
                return;
            }
            this.searchOperation.start(500);
            this.ongoingOperations++;
            const { configurationModel } = await startInput.resolveModels();
            configurationModel.updateConfig(config);
            const result = this.searchModel.search(query);
            startInput.ongoingSearchOperation = result.asyncResults.finally(() => {
                this.ongoingOperations--;
                if (this.ongoingOperations === 0) {
                    this.searchOperation.stop();
                }
            });
            const searchOperation = await startInput.ongoingSearchOperation;
            await this.onSearchComplete(searchOperation, config, startInput);
        }
        async onSearchComplete(searchOperation, startConfig, startInput) {
            const input = this.getInput();
            if (!input ||
                input !== startInput ||
                JSON.stringify(startConfig) !== JSON.stringify(this.readConfigFromWidget())) {
                return;
            }
            input.ongoingSearchOperation = undefined;
            const sortOrder = this.searchConfig.sortOrder;
            if (sortOrder === "modified" /* SearchSortOrder.Modified */) {
                await this.retrieveFileStats(this.searchModel.searchResult);
            }
            const controller = referencesController_1.ReferencesController.get(this.searchResultEditor);
            controller?.closeWidget(false);
            const labelFormatter = (uri) => this.labelService.getUriLabel(uri, { relative: true });
            const results = (0, searchEditorSerialization_1.serializeSearchResultForEditor)(this.searchModel.searchResult, startConfig.filesToInclude, startConfig.filesToExclude, startConfig.contextLines, labelFormatter, sortOrder, searchOperation?.limitHit);
            const { resultsModel } = await input.resolveModels();
            this.updatingModelForSearch = true;
            this.modelService.updateModel(resultsModel, results.text);
            this.updatingModelForSearch = false;
            if (searchOperation && searchOperation.messages) {
                for (const message of searchOperation.messages) {
                    this.addMessage(message);
                }
            }
            this.reLayout();
            input.setDirty(!input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
            input.setMatchRanges(results.matchRanges);
        }
        addMessage(message) {
            let messageBox;
            if (this.messageBox.firstChild) {
                messageBox = this.messageBox.firstChild;
            }
            else {
                messageBox = DOM.append(this.messageBox, DOM.$('.message'));
            }
            DOM.append(messageBox, (0, searchMessage_1.renderSearchMessage)(message, this.instantiationService, this.notificationService, this.openerService, this.commandService, this.messageDisposables, () => this.triggerSearch()));
        }
        async retrieveFileStats(searchResult) {
            const files = searchResult.matches().filter(f => !f.fileStat).map(f => f.resolveFileStat(this.fileService));
            await Promise.all(files);
        }
        layout(dimension) {
            this.dimension = dimension;
            this.reLayout();
        }
        getSelected() {
            const selection = this.searchResultEditor.getSelection();
            if (selection) {
                return this.searchResultEditor.getModel()?.getValueInRange(selection) ?? '';
            }
            return '';
        }
        reLayout() {
            if (this.dimension) {
                this.queryEditorWidget.setWidth(this.dimension.width - 28 /* container margin */);
                this.searchResultEditor.layout({ height: this.dimension.height - DOM.getTotalHeight(this.queryEditorContainer), width: this.dimension.width });
                this.inputPatternExcludes.setWidth(this.dimension.width - 28 /* container margin */);
                this.inputPatternIncludes.setWidth(this.dimension.width - 28 /* container margin */);
            }
        }
        getInput() {
            return this.input;
        }
        setSearchConfig(config) {
            this.priorConfig = config;
            if (config.query !== undefined) {
                this.queryEditorWidget.setValue(config.query);
            }
            if (config.isCaseSensitive !== undefined) {
                this.queryEditorWidget.searchInput?.setCaseSensitive(config.isCaseSensitive);
            }
            if (config.isRegexp !== undefined) {
                this.queryEditorWidget.searchInput?.setRegex(config.isRegexp);
            }
            if (config.matchWholeWord !== undefined) {
                this.queryEditorWidget.searchInput?.setWholeWords(config.matchWholeWord);
            }
            if (config.contextLines !== undefined) {
                this.queryEditorWidget.setContextLines(config.contextLines);
            }
            if (config.filesToExclude !== undefined) {
                this.inputPatternExcludes.setValue(config.filesToExclude);
            }
            if (config.filesToInclude !== undefined) {
                this.inputPatternIncludes.setValue(config.filesToInclude);
            }
            if (config.onlyOpenEditors !== undefined) {
                this.inputPatternIncludes.setOnlySearchInOpenEditors(config.onlyOpenEditors);
            }
            if (config.useExcludeSettingsAndIgnoreFiles !== undefined) {
                this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(config.useExcludeSettingsAndIgnoreFiles);
            }
            if (config.showIncludesExcludes !== undefined) {
                this.toggleIncludesExcludes(config.showIncludesExcludes);
            }
        }
        async setInput(newInput, options, context, token) {
            await super.setInput(newInput, options, context, token);
            if (token.isCancellationRequested) {
                return;
            }
            const { configurationModel, resultsModel } = await newInput.resolveModels();
            if (token.isCancellationRequested) {
                return;
            }
            this.searchResultEditor.setModel(resultsModel);
            this.pauseSearching = true;
            this.toggleRunAgainMessage(!newInput.ongoingSearchOperation && resultsModel.getLineCount() === 1 && resultsModel.getValueLength() === 0 && configurationModel.config.query !== '');
            this.setSearchConfig(configurationModel.config);
            this._register(configurationModel.onConfigDidUpdate(newConfig => {
                if (newConfig !== this.priorConfig) {
                    this.pauseSearching = true;
                    this.setSearchConfig(newConfig);
                    this.pauseSearching = false;
                }
            }));
            this.restoreViewState(context);
            if (!options?.preserveFocus) {
                this.focus();
            }
            this.pauseSearching = false;
            if (newInput.ongoingSearchOperation) {
                const existingConfig = this.readConfigFromWidget();
                newInput.ongoingSearchOperation.then(complete => {
                    this.onSearchComplete(complete, existingConfig, newInput);
                });
            }
        }
        toggleIncludesExcludes(_shouldShow) {
            const cls = 'expanded';
            const shouldShow = _shouldShow ?? !this.includesExcludesContainer.classList.contains(cls);
            if (shouldShow) {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'true');
                this.includesExcludesContainer.classList.add(cls);
            }
            else {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'false');
                this.includesExcludesContainer.classList.remove(cls);
            }
            this.showingIncludesExcludes = this.includesExcludesContainer.classList.contains(cls);
            this.reLayout();
        }
        toEditorViewStateResource(input) {
            if (input.typeId === constants_1.SearchEditorInputTypeId) {
                return input.modelUri;
            }
            return undefined;
        }
        computeEditorViewState(resource) {
            const control = this.getControl();
            const editorViewState = control.saveViewState();
            if (!editorViewState) {
                return undefined;
            }
            if (resource.toString() !== this.getInput()?.modelUri.toString()) {
                return undefined;
            }
            return { ...editorViewState, focused: this.searchResultEditor.hasWidgetFocus() ? 'editor' : 'input' };
        }
        tracksEditorViewState(input) {
            return input.typeId === constants_1.SearchEditorInputTypeId;
        }
        restoreViewState(context) {
            const viewState = this.loadEditorViewState(this.getInput(), context);
            if (viewState) {
                this.searchResultEditor.restoreViewState(viewState);
            }
        }
        getAriaLabel() {
            return this.getInput()?.getName() ?? (0, nls_1.localize)('searchEditor', "Search");
        }
    };
    exports.SearchEditor = SearchEditor;
    exports.SearchEditor = SearchEditor = SearchEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, model_1.IModelService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, label_1.ILabelService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, contextView_1.IContextViewService),
        __param(9, commands_1.ICommandService),
        __param(10, opener_1.IOpenerService),
        __param(11, notification_1.INotificationService),
        __param(12, progress_1.IEditorProgressService),
        __param(13, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(14, editorGroupsService_1.IEditorGroupsService),
        __param(15, editorService_1.IEditorService),
        __param(16, configuration_1.IConfigurationService),
        __param(17, files_1.IFileService),
        __param(18, log_1.ILogService)
    ], SearchEditor);
    const searchEditorTextInputBorder = (0, colorRegistry_1.registerColor)('searchEditor.textInputBorder', { dark: colorRegistry_1.inputBorder, light: colorRegistry_1.inputBorder, hcDark: colorRegistry_1.inputBorder, hcLight: colorRegistry_1.inputBorder }, (0, nls_1.localize)('textInputBoxBorder', "Search editor text input box border."));
    function findNextRange(matchRanges, currentPosition) {
        for (const matchRange of matchRanges) {
            if (position_1.Position.isBefore(currentPosition, matchRange.getStartPosition())) {
                return matchRange;
            }
        }
        return matchRanges[0];
    }
    function findPrevRange(matchRanges, currentPosition) {
        for (let i = matchRanges.length - 1; i >= 0; i--) {
            const matchRange = matchRanges[i];
            if (position_1.Position.isBefore(matchRange.getStartPosition(), currentPosition)) {
                {
                    return matchRange;
                }
            }
        }
        return matchRanges[matchRanges.length - 1];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2hFZGl0b3IvYnJvd3Nlci9zZWFyY2hFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdFaEcsTUFBTSxpQkFBaUIsR0FBRyw4QkFBOEIsQ0FBQztJQUN6RCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUM7SUFJN0IsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBYSxTQUFRLHVDQUE2Qzs7aUJBQzlELE9BQUUsR0FBVywwQkFBYyxBQUF6QixDQUEwQjtpQkFFNUIsNENBQXVDLEdBQUcsdUJBQXVCLEFBQTFCLENBQTJCO1FBR2xGLElBQVksa0JBQWtCLEtBQUssT0FBTyxJQUFJLENBQUMsYUFBYyxDQUFDLENBQUMsQ0FBQztRQW9CaEUsWUFDQyxLQUFtQixFQUNBLGdCQUFtQyxFQUN2QyxZQUEyQixFQUN6QixjQUErQixFQUNqQyxZQUE0QyxFQUNqQyxjQUF5RCxFQUNwRSxZQUE0QyxFQUNwQyxvQkFBMkMsRUFDN0Msa0JBQXdELEVBQzVELGNBQWdELEVBQ2pELGFBQThDLEVBQ3hDLG1CQUEwRCxFQUN4RCxlQUF1QyxFQUM1QixtQkFBc0QsRUFDbkUsa0JBQXdDLEVBQzlDLGFBQTZCLEVBQ3RCLG9CQUFxRCxFQUM5RCxXQUF5QixFQUMxQixVQUF3QztZQUVyRCxLQUFLLENBQUMsY0FBWSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFoQnpJLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ2hCLG1CQUFjLEdBQWQs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