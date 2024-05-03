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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/comparers", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/strings", "vs/base/common/ternarySearchTree", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/notebook/browser/contrib/find/findMatchDecorationModel", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/search/browser/replace", "vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers", "vs/workbench/contrib/search/common/notebookSearch", "vs/workbench/contrib/search/common/searchNotebookHelpers", "vs/workbench/services/search/common/replace", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchHelpers", "vs/workbench/contrib/search/common/cellSearchModel"], function (require, exports, async_1, cancellation_1, comparers_1, decorators_1, errors, event_1, lazy_1, lifecycle_1, map_1, network_1, strings_1, ternarySearchTree_1, uri_1, range_1, model_1, textModel_1, model_2, configuration_1, instantiation_1, label_1, log_1, progress_1, telemetry_1, colorRegistry_1, themeService_1, uriIdentity_1, findMatchDecorationModel_1, notebookEditorWidget_1, notebookEditorService_1, notebookCommon_1, replace_1, searchNotebookHelpers_1, notebookSearch_1, searchNotebookHelpers_2, replace_2, search_1, searchHelpers_1, cellSearchModel_1) {
    "use strict";
    var FileMatch_1, FolderMatch_1, RangeHighlightDecorations_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeHighlightDecorations = exports.ISearchViewModelWorkbenchService = exports.SearchViewModelWorkbenchService = exports.SearchModel = exports.SearchModelLocation = exports.SearchResult = exports.FolderMatchNoRoot = exports.FolderMatchWorkspaceRoot = exports.FolderMatchWithResource = exports.FolderMatch = exports.FileMatch = exports.MatchInNotebook = exports.CellMatch = exports.Match = void 0;
    exports.searchMatchComparer = searchMatchComparer;
    exports.compareNotebookPos = compareNotebookPos;
    exports.searchComparer = searchComparer;
    exports.textSearchMatchesToNotebookMatches = textSearchMatchesToNotebookMatches;
    exports.arrayContainsElementOrParent = arrayContainsElementOrParent;
    class Match {
        static { this.MAX_PREVIEW_CHARS = 250; }
        constructor(_parent, _fullPreviewLines, _fullPreviewRange, _documentRange, aiContributed) {
            this._parent = _parent;
            this._fullPreviewLines = _fullPreviewLines;
            this.aiContributed = aiContributed;
            this._oneLinePreviewText = _fullPreviewLines[_fullPreviewRange.startLineNumber];
            const adjustedEndCol = _fullPreviewRange.startLineNumber === _fullPreviewRange.endLineNumber ?
                _fullPreviewRange.endColumn :
                this._oneLinePreviewText.length;
            this._rangeInPreviewText = new search_1.OneLineRange(1, _fullPreviewRange.startColumn + 1, adjustedEndCol + 1);
            this._range = new range_1.Range(_documentRange.startLineNumber + 1, _documentRange.startColumn + 1, _documentRange.endLineNumber + 1, _documentRange.endColumn + 1);
            this._fullPreviewRange = _fullPreviewRange;
            this._id = this._parent.id() + '>' + this._range + this.getMatchString();
        }
        id() {
            return this._id;
        }
        parent() {
            return this._parent;
        }
        text() {
            return this._oneLinePreviewText;
        }
        range() {
            return this._range;
        }
        preview() {
            const fullBefore = this._oneLinePreviewText.substring(0, this._rangeInPreviewText.startColumn - 1), before = (0, strings_1.lcut)(fullBefore, 26, '…');
            let inside = this.getMatchString(), after = this._oneLinePreviewText.substring(this._rangeInPreviewText.endColumn - 1);
            let charsRemaining = Match.MAX_PREVIEW_CHARS - before.length;
            inside = inside.substr(0, charsRemaining);
            charsRemaining -= inside.length;
            after = after.substr(0, charsRemaining);
            return {
                before,
                fullBefore,
                inside,
                after,
            };
        }
        get replaceString() {
            const searchModel = this.parent().parent().searchModel;
            if (!searchModel.replacePattern) {
                throw new Error('searchModel.replacePattern must be set before accessing replaceString');
            }
            const fullMatchText = this.fullMatchText();
            let replaceString = searchModel.replacePattern.getReplaceString(fullMatchText, searchModel.preserveCase);
            if (replaceString !== null) {
                return replaceString;
            }
            // Search/find normalize line endings - check whether \r prevents regex from matching
            const fullMatchTextWithoutCR = fullMatchText.replace(/\r\n/g, '\n');
            if (fullMatchTextWithoutCR !== fullMatchText) {
                replaceString = searchModel.replacePattern.getReplaceString(fullMatchTextWithoutCR, searchModel.preserveCase);
                if (replaceString !== null) {
                    return replaceString;
                }
            }
            // If match string is not matching then regex pattern has a lookahead expression
            const contextMatchTextWithSurroundingContent = this.fullMatchText(true);
            replaceString = searchModel.replacePattern.getReplaceString(contextMatchTextWithSurroundingContent, searchModel.preserveCase);
            if (replaceString !== null) {
                return replaceString;
            }
            // Search/find normalize line endings, this time in full context
            const contextMatchTextWithoutCR = contextMatchTextWithSurroundingContent.replace(/\r\n/g, '\n');
            if (contextMatchTextWithoutCR !== contextMatchTextWithSurroundingContent) {
                replaceString = searchModel.replacePattern.getReplaceString(contextMatchTextWithoutCR, searchModel.preserveCase);
                if (replaceString !== null) {
                    return replaceString;
                }
            }
            // Match string is still not matching. Could be unsupported matches (multi-line).
            return searchModel.replacePattern.pattern;
        }
        fullMatchText(includeSurrounding = false) {
            let thisMatchPreviewLines;
            if (includeSurrounding) {
                thisMatchPreviewLines = this._fullPreviewLines;
            }
            else {
                thisMatchPreviewLines = this._fullPreviewLines.slice(this._fullPreviewRange.startLineNumber, this._fullPreviewRange.endLineNumber + 1);
                thisMatchPreviewLines[thisMatchPreviewLines.length - 1] = thisMatchPreviewLines[thisMatchPreviewLines.length - 1].slice(0, this._fullPreviewRange.endColumn);
                thisMatchPreviewLines[0] = thisMatchPreviewLines[0].slice(this._fullPreviewRange.startColumn);
            }
            return thisMatchPreviewLines.join('\n');
        }
        rangeInPreview() {
            // convert to editor's base 1 positions.
            return {
                ...this._fullPreviewRange,
                startColumn: this._fullPreviewRange.startColumn + 1,
                endColumn: this._fullPreviewRange.endColumn + 1
            };
        }
        fullPreviewLines() {
            return this._fullPreviewLines.slice(this._fullPreviewRange.startLineNumber, this._fullPreviewRange.endLineNumber + 1);
        }
        getMatchString() {
            return this._oneLinePreviewText.substring(this._rangeInPreviewText.startColumn - 1, this._rangeInPreviewText.endColumn - 1);
        }
    }
    exports.Match = Match;
    __decorate([
        decorators_1.memoize
    ], Match.prototype, "preview", null);
    class CellMatch {
        constructor(_parent, _cell, _cellIndex) {
            this._parent = _parent;
            this._cell = _cell;
            this._cellIndex = _cellIndex;
            this._contentMatches = new Map();
            this._webviewMatches = new Map();
            this._context = new Map();
        }
        hasCellViewModel() {
            return !(this._cell instanceof cellSearchModel_1.CellSearchModel);
        }
        get context() {
            return new Map(this._context);
        }
        matches() {
            return [...this._contentMatches.values(), ...this._webviewMatches.values()];
        }
        get contentMatches() {
            return Array.from(this._contentMatches.values());
        }
        get webviewMatches() {
            return Array.from(this._webviewMatches.values());
        }
        remove(matches) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            for (const match of matches) {
                this._contentMatches.delete(match.id());
                this._webviewMatches.delete(match.id());
            }
        }
        clearAllMatches() {
            this._contentMatches.clear();
            this._webviewMatches.clear();
        }
        addContentMatches(textSearchMatches) {
            const contentMatches = textSearchMatchesToNotebookMatches(textSearchMatches, this);
            contentMatches.forEach((match) => {
                this._contentMatches.set(match.id(), match);
            });
            this.addContext(textSearchMatches);
        }
        addContext(textSearchMatches) {
            if (!this.cell) {
                // todo: get closed notebook results in search editor
                return;
            }
            this.cell.resolveTextModel().then((textModel) => {
                const textResultsWithContext = (0, searchHelpers_1.getTextSearchMatchWithModelContext)(textSearchMatches, textModel, this.parent.parent().query);
                const contexts = textResultsWithContext.filter((result => !(0, search_1.resultIsMatch)(result)));
                contexts.map(context => ({ ...context, lineNumber: context.lineNumber + 1 }))
                    .forEach((context) => { this._context.set(context.lineNumber, context.text); });
            });
        }
        addWebviewMatches(textSearchMatches) {
            const webviewMatches = textSearchMatchesToNotebookMatches(textSearchMatches, this);
            webviewMatches.forEach((match) => {
                this._webviewMatches.set(match.id(), match);
            });
            // TODO: add webview results to context
        }
        setCellModel(cell) {
            this._cell = cell;
        }
        get parent() {
            return this._parent;
        }
        get id() {
            return this._cell?.id ?? `${searchNotebookHelpers_2.rawCellPrefix}${this.cellIndex}`;
        }
        get cellIndex() {
            return this._cellIndex;
        }
        get cell() {
            return this._cell;
        }
    }
    exports.CellMatch = CellMatch;
    class MatchInNotebook extends Match {
        constructor(_cellParent, _fullPreviewLines, _fullPreviewRange, _documentRange, webviewIndex) {
            super(_cellParent.parent, _fullPreviewLines, _fullPreviewRange, _documentRange, false);
            this._cellParent = _cellParent;
            this._id = this._parent.id() + '>' + this._cellParent.cellIndex + (webviewIndex ? '_' + webviewIndex : '') + '_' + this.notebookMatchTypeString() + this._range + this.getMatchString();
            this._webviewIndex = webviewIndex;
        }
        parent() {
            return this._cellParent.parent;
        }
        get cellParent() {
            return this._cellParent;
        }
        notebookMatchTypeString() {
            return this.isWebviewMatch() ? 'webview' : 'content';
        }
        isWebviewMatch() {
            return this._webviewIndex !== undefined;
        }
        isReadonly() {
            return (!this._cellParent.hasCellViewModel()) || this.isWebviewMatch();
        }
        get cellIndex() {
            return this._cellParent.cellIndex;
        }
        get webviewIndex() {
            return this._webviewIndex;
        }
        get cell() {
            return this._cellParent.cell;
        }
    }
    exports.MatchInNotebook = MatchInNotebook;
    let FileMatch = class FileMatch extends lifecycle_1.Disposable {
        static { FileMatch_1 = this; }
        static { this._CURRENT_FIND_MATCH = textModel_1.ModelDecorationOptions.register({
            description: 'search-current-find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            zIndex: 13,
            className: 'currentFindMatch',
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static { this._FIND_MATCH = textModel_1.ModelDecorationOptions.register({
            description: 'search-find-match',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'findMatch',
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.overviewRulerFindMatchForeground),
                position: model_1.OverviewRulerLane.Center
            },
            minimap: {
                color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapFindMatch),
                position: 1 /* MinimapPosition.Inline */
            }
        }); }
        static getDecorationOption(selected) {
            return (selected ? FileMatch_1._CURRENT_FIND_MATCH : FileMatch_1._FIND_MATCH);
        }
        get context() {
            return new Map(this._context);
        }
        get cellContext() {
            const cellContext = new Map();
            this._cellMatches.forEach(cellMatch => {
                cellContext.set(cellMatch.id, cellMatch.context);
            });
            return cellContext;
        }
        // #endregion
        constructor(_query, _previewOptions, _maxResults, _parent, rawMatch, _closestRoot, searchInstanceID, modelService, replaceService, labelService, notebookEditorService) {
            super();
            this._query = _query;
            this._previewOptions = _previewOptions;
            this._maxResults = _maxResults;
            this._parent = _parent;
            this.rawMatch = rawMatch;
            this._closestRoot = _closestRoot;
            this.searchInstanceID = searchInstanceID;
            this.modelService = modelService;
            this.replaceService = replaceService;
            this.labelService = labelService;
            this.notebookEditorService = notebookEditorService;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this._model = null;
            this._modelListener = null;
            this._selectedMatch = null;
            this._modelDecorations = [];
            this._context = new Map();
            // #region notebook fields
            this._notebookEditorWidget = null;
            this._editorWidgetListener = null;
            this.replaceQ = Promise.resolve();
            this._resource = this.rawMatch.resource;
            this._textMatches = new Map();
            this._removedTextMatches = new Set();
            this._updateScheduler = new async_1.RunOnceScheduler(this.updateMatchesForModel.bind(this), 250);
            this._name = new lazy_1.Lazy(() => labelService.getUriBasenameLabel(this.resource));
            this._cellMatches = new Map();
            this._notebookUpdateScheduler = new async_1.RunOnceScheduler(this.updateMatchesForEditorWidget.bind(this), 250);
        }
        addWebviewMatchesToCell(cellID, webviewMatches) {
            const cellMatch = this.getCellMatch(cellID);
            if (cellMatch !== undefined) {
                cellMatch.addWebviewMatches(webviewMatches);
            }
        }
        addContentMatchesToCell(cellID, contentMatches) {
            const cellMatch = this.getCellMatch(cellID);
            if (cellMatch !== undefined) {
                cellMatch.addContentMatches(contentMatches);
            }
        }
        getCellMatch(cellID) {
            return this._cellMatches.get(cellID);
        }
        addCellMatch(rawCell) {
            const cellMatch = new CellMatch(this, (0, searchNotebookHelpers_1.isINotebookCellMatchWithModel)(rawCell) ? rawCell.cell : undefined, rawCell.index);
            this._cellMatches.set(cellMatch.id, cellMatch);
            this.addWebviewMatchesToCell(cellMatch.id, rawCell.webviewResults);
            this.addContentMatchesToCell(cellMatch.id, rawCell.contentResults);
        }
        get closestRoot() {
            return this._closestRoot;
        }
        hasReadonlyMatches() {
            return this.matches().some(m => m instanceof MatchInNotebook && m.isReadonly());
        }
        createMatches(isAiContributed) {
            const model = this.modelService.getModel(this._resource);
            if (model && !isAiContributed) {
                // todo: handle better when ai contributed results has model, currently, createMatches does not work for this
                this.bindModel(model);
                this.updateMatchesForModel();
            }
            else {
                const notebookEditorWidgetBorrow = this.notebookEditorService.retrieveExistingWidgetFromURI(this.resource);
                if (notebookEditorWidgetBorrow?.value) {
                    this.bindNotebookEditorWidget(notebookEditorWidgetBorrow.value);
                }
                if (this.rawMatch.results) {
                    this.rawMatch.results
                        .filter(search_1.resultIsMatch)
                        .forEach(rawMatch => {
                        textSearchResultToMatches(rawMatch, this, isAiContributed)
                            .forEach(m => this.add(m));
                    });
                }
                if ((0, searchNotebookHelpers_1.isINotebookFileMatchWithModel)(this.rawMatch) || (0, searchNotebookHelpers_2.isINotebookFileMatchNoModel)(this.rawMatch)) {
                    this.rawMatch.cellResults?.forEach(cell => this.addCellMatch(cell));
                    this.setNotebookFindMatchDecorationsUsingCellMatches(this.cellMatches());
                    this._onChange.fire({ forceUpdateModel: true });
                }
                this.addContext(this.rawMatch.results);
            }
        }
        bindModel(model) {
            this._model = model;
            this._modelListener = this._model.onDidChangeContent(() => {
                this._updateScheduler.schedule();
            });
            this._model.onWillDispose(() => this.onModelWillDispose());
            this.updateHighlights();
        }
        onModelWillDispose() {
            // Update matches because model might have some dirty changes
            this.updateMatchesForModel();
            this.unbindModel();
        }
        unbindModel() {
            if (this._model) {
                this._updateScheduler.cancel();
                this._model.changeDecorations((accessor) => {
                    this._modelDecorations = accessor.deltaDecorations(this._modelDecorations, []);
                });
                this._model = null;
                this._modelListener.dispose();
            }
        }
        updateMatchesForModel() {
            // this is called from a timeout and might fire
            // after the model has been disposed
            if (!this._model) {
                return;
            }
            this._textMatches = new Map();
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const matches = this._model
                .findMatches(this._query.pattern, this._model.getFullModelRange(), !!this._query.isRegExp, !!this._query.isCaseSensitive, wordSeparators, false, this._maxResults ?? Number.MAX_SAFE_INTEGER);
            this.updateMatches(matches, true, this._model, false);
        }
        async updatesMatchesForLineAfterReplace(lineNumber, modelChange) {
            if (!this._model) {
                return;
            }
            const range = {
                startLineNumber: lineNumber,
                startColumn: this._model.getLineMinColumn(lineNumber),
                endLineNumber: lineNumber,
                endColumn: this._model.getLineMaxColumn(lineNumber)
            };
            const oldMatches = Array.from(this._textMatches.values()).filter(match => match.range().startLineNumber === lineNumber);
            oldMatches.forEach(match => this._textMatches.delete(match.id()));
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const matches = this._model.findMatches(this._query.pattern, range, !!this._query.isRegExp, !!this._query.isCaseSensitive, wordSeparators, false, this._maxResults ?? Number.MAX_SAFE_INTEGER);
            this.updateMatches(matches, modelChange, this._model, false);
            // await this.updateMatchesForEditorWidget();
        }
        updateMatches(matches, modelChange, model, isAiContributed) {
            const textSearchResults = (0, searchHelpers_1.editorMatchesToTextSearchResults)(matches, model, this._previewOptions);
            textSearchResults.forEach(textSearchResult => {
                textSearchResultToMatches(textSearchResult, this, isAiContributed).forEach(match => {
                    if (!this._removedTextMatches.has(match.id())) {
                        this.add(match);
                        if (this.isMatchSelected(match)) {
                            this._selectedMatch = match;
                        }
                    }
                });
            });
            this.addContext((0, searchHelpers_1.getTextSearchMatchWithModelContext)(textSearchResults, model, this.parent().parent().query));
            this._onChange.fire({ forceUpdateModel: modelChange });
            this.updateHighlights();
        }
        updateHighlights() {
            if (!this._model) {
                return;
            }
            this._model.changeDecorations((accessor) => {
                const newDecorations = (this.parent().showHighlights
                    ? this.matches().map(match => ({
                        range: match.range(),
                        options: FileMatch_1.getDecorationOption(this.isMatchSelected(match))
                    }))
                    : []);
                this._modelDecorations = accessor.deltaDecorations(this._modelDecorations, newDecorations);
            });
        }
        id() {
            return this.resource.toString();
        }
        parent() {
            return this._parent;
        }
        matches() {
            const cellMatches = Array.from(this._cellMatches.values()).flatMap((e) => e.matches());
            return [...this._textMatches.values(), ...cellMatches];
        }
        textMatches() {
            return Array.from(this._textMatches.values());
        }
        cellMatches() {
            return Array.from(this._cellMatches.values());
        }
        remove(matches) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            for (const match of matches) {
                this.removeMatch(match);
                this._removedTextMatches.add(match.id());
            }
            this._onChange.fire({ didRemove: true });
        }
        async replace(toReplace) {
            return this.replaceQ = this.replaceQ.finally(async () => {
                await this.replaceService.replace(toReplace);
                await this.updatesMatchesForLineAfterReplace(toReplace.range().startLineNumber, false);
            });
        }
        setSelectedMatch(match) {
            if (match) {
                if (!this.isMatchSelected(match) && match instanceof MatchInNotebook) {
                    this._selectedMatch = match;
                    return;
                }
                if (!this._textMatches.has(match.id())) {
                    return;
                }
                if (this.isMatchSelected(match)) {
                    return;
                }
            }
            this._selectedMatch = match;
            this.updateHighlights();
        }
        getSelectedMatch() {
            return this._selectedMatch;
        }
        isMatchSelected(match) {
            return !!this._selectedMatch && this._selectedMatch.id() === match.id();
        }
        count() {
            return this.matches().length;
        }
        get resource() {
            return this._resource;
        }
        name() {
            return this._name.value;
        }
        addContext(results) {
            if (!results) {
                return;
            }
            const contexts = results
                .filter((result => !(0, search_1.resultIsMatch)(result)));
            return contexts.forEach(context => this._context.set(context.lineNumber, context.text));
        }
        add(match, trigger) {
            this._textMatches.set(match.id(), match);
            if (trigger) {
                this._onChange.fire({ forceUpdateModel: true });
            }
        }
        removeMatch(match) {
            if (match instanceof MatchInNotebook) {
                match.cellParent.remove(match);
                if (match.cellParent.matches().length === 0) {
                    this._cellMatches.delete(match.cellParent.id);
                }
            }
            else {
                this._textMatches.delete(match.id());
            }
            if (this.isMatchSelected(match)) {
                this.setSelectedMatch(null);
                this._findMatchDecorationModel?.clearCurrentFindMatchDecoration();
            }
            else {
                this.updateHighlights();
            }
            if (match instanceof MatchInNotebook) {
                this.setNotebookFindMatchDecorationsUsingCellMatches(this.cellMatches());
            }
        }
        async resolveFileStat(fileService) {
            this._fileStat = await fileService.stat(this.resource).catch(() => undefined);
        }
        get fileStat() {
            return this._fileStat;
        }
        set fileStat(stat) {
            this._fileStat = stat;
        }
        dispose() {
            this.setSelectedMatch(null);
            this.unbindModel();
            this.unbindNotebookEditorWidget();
            this._onDispose.fire();
            super.dispose();
        }
        hasOnlyReadOnlyMatches() {
            return this.matches().every(match => (match instanceof MatchInNotebook && match.isReadonly()));
        }
        // #region strictly notebook methods
        bindNotebookEditorWidget(widget) {
            if (this._notebookEditorWidget === widget) {
                return;
            }
            this._notebookEditorWidget = widget;
            this._editorWidgetListener = this._notebookEditorWidget.textModel?.onDidChangeContent((e) => {
                if (!e.rawEvents.some(event => event.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellContent || event.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange)) {
                    return;
                }
                this._notebookUpdateScheduler.schedule();
            }) ?? null;
            this._addNotebookHighlights();
        }
        unbindNotebookEditorWidget(widget) {
            if (widget && this._notebookEditorWidget !== widget) {
                return;
            }
            if (this._notebookEditorWidget) {
                this._notebookUpdateScheduler.cancel();
                this._editorWidgetListener?.dispose();
            }
            this._removeNotebookHighlights();
            this._notebookEditorWidget = null;
        }
        updateNotebookHighlights() {
            if (this.parent().showHighlights) {
                this._addNotebookHighlights();
                this.setNotebookFindMatchDecorationsUsingCellMatches(Array.from(this._cellMatches.values()));
            }
            else {
                this._removeNotebookHighlights();
            }
        }
        _addNotebookHighlights() {
            if (!this._notebookEditorWidget) {
                return;
            }
            this._findMatchDecorationModel?.stopWebviewFind();
            this._findMatchDecorationModel?.dispose();
            this._findMatchDecorationModel = new findMatchDecorationModel_1.FindMatchDecorationModel(this._notebookEditorWidget, this.searchInstanceID);
            if (this._selectedMatch instanceof MatchInNotebook) {
                this.highlightCurrentFindMatchDecoration(this._selectedMatch);
            }
        }
        _removeNotebookHighlights() {
            if (this._findMatchDecorationModel) {
                this._findMatchDecorationModel?.stopWebviewFind();
                this._findMatchDecorationModel?.dispose();
                this._findMatchDecorationModel = undefined;
            }
        }
        updateNotebookMatches(matches, modelChange) {
            if (!this._notebookEditorWidget) {
                return;
            }
            const oldCellMatches = new Map(this._cellMatches);
            if (this._notebookEditorWidget.getId() !== this._lastEditorWidgetIdForUpdate) {
                this._cellMatches.clear();
                this._lastEditorWidgetIdForUpdate = this._notebookEditorWidget.getId();
            }
            matches.forEach(match => {
                let existingCell = this._cellMatches.get(match.cell.id);
                if (this._notebookEditorWidget && !existingCell) {
                    const index = this._notebookEditorWidget.getCellIndex(match.cell);
                    const existingRawCell = oldCellMatches.get(`${searchNotebookHelpers_2.rawCellPrefix}${index}`);
                    if (existingRawCell) {
                        existingRawCell.setCellModel(match.cell);
                        existingRawCell.clearAllMatches();
                        existingCell = existingRawCell;
                    }
                }
                existingCell?.clearAllMatches();
                const cell = existingCell ?? new CellMatch(this, match.cell, match.index);
                cell.addContentMatches((0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(match.contentMatches, match.cell));
                cell.addWebviewMatches((0, searchNotebookHelpers_1.webviewMatchesToTextSearchMatches)(match.webviewMatches));
                this._cellMatches.set(cell.id, cell);
            });
            this._findMatchDecorationModel?.setAllFindMatchesDecorations(matches);
            if (this._selectedMatch instanceof MatchInNotebook) {
                this.highlightCurrentFindMatchDecoration(this._selectedMatch);
            }
            this._onChange.fire({ forceUpdateModel: modelChange });
        }
        setNotebookFindMatchDecorationsUsingCellMatches(cells) {
            if (!this._findMatchDecorationModel) {
                return;
            }
            const cellFindMatch = cells.map((cell) => {
                const webviewMatches = cell.webviewMatches.map(match => {
                    return {
                        index: match.webviewIndex,
                    };
                });
                const findMatches = cell.contentMatches.map(match => {
                    return new model_1.FindMatch(match.range(), [match.text()]);
                });
                return {
                    cell: cell.cell,
                    index: cell.cellIndex,
                    contentMatches: findMatches,
                    webviewMatches: webviewMatches
                };
            });
            try {
                this._findMatchDecorationModel.setAllFindMatchesDecorations(cellFindMatch);
            }
            catch (e) {
                // no op, might happen due to bugs related to cell output regex search
            }
        }
        async updateMatchesForEditorWidget() {
            if (!this._notebookEditorWidget) {
                return;
            }
            this._textMatches = new Map();
            const wordSeparators = this._query.isWordMatch && this._query.wordSeparators ? this._query.wordSeparators : null;
            const allMatches = await this._notebookEditorWidget
                .find(this._query.pattern, {
                regex: this._query.isRegExp,
                wholeWord: this._query.isWordMatch,
                caseSensitive: this._query.isCaseSensitive,
                wordSeparators: wordSeparators ?? undefined,
                includeMarkupInput: this._query.notebookInfo?.isInNotebookMarkdownInput,
                includeMarkupPreview: this._query.notebookInfo?.isInNotebookMarkdownPreview,
                includeCodeInput: this._query.notebookInfo?.isInNotebookCellInput,
                includeOutput: this._query.notebookInfo?.isInNotebookCellOutput,
            }, cancellation_1.CancellationToken.None, false, true, this.searchInstanceID);
            this.updateNotebookMatches(allMatches, true);
        }
        async showMatch(match) {
            const offset = await this.highlightCurrentFindMatchDecoration(match);
            this.setSelectedMatch(match);
            this.revealCellRange(match, offset);
        }
        async highlightCurrentFindMatchDecoration(match) {
            if (!this._findMatchDecorationModel || !match.cell) {
                // match cell should never be a CellSearchModel if the notebook is open
                return null;
            }
            if (match.webviewIndex === undefined) {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInCell(match.cell, match.range());
            }
            else {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInWebview(match.cell, match.webviewIndex);
            }
        }
        revealCellRange(match, outputOffset) {
            if (!this._notebookEditorWidget || !match.cell) {
                // match cell should never be a CellSearchModel if the notebook is open
                return;
            }
            if (match.webviewIndex !== undefined) {
                const index = this._notebookEditorWidget.getCellIndex(match.cell);
                if (index !== undefined) {
                    this._notebookEditorWidget.revealCellOffsetInCenter(match.cell, outputOffset ?? 0);
                }
            }
            else {
                match.cell.updateEditState(match.cell.getEditState(), 'focusNotebookCell');
                this._notebookEditorWidget.setCellEditorSelection(match.cell, match.range());
                this._notebookEditorWidget.revealRangeInCenterIfOutsideViewportAsync(match.cell, match.range());
            }
        }
    };
    exports.FileMatch = FileMatch;
    exports.FileMatch = FileMatch = FileMatch_1 = __decorate([
        __param(7, model_2.IModelService),
        __param(8, replace_1.IReplaceService),
        __param(9, label_1.ILabelService),
        __param(10, notebookEditorService_1.INotebookEditorService)
    ], FileMatch);
    let FolderMatch = FolderMatch_1 = class FolderMatch extends lifecycle_1.Disposable {
        constructor(_resource, _id, _index, _query, _parent, _searchResult, _closestRoot, replaceService, instantiationService, labelService, uriIdentityService) {
            super();
            this._resource = _resource;
            this._id = _id;
            this._index = _index;
            this._query = _query;
            this._parent = _parent;
            this._searchResult = _searchResult;
            this._closestRoot = _closestRoot;
            this.replaceService = replaceService;
            this.instantiationService = instantiationService;
            this.uriIdentityService = uriIdentityService;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this._replacingAll = false;
            this._fileMatches = new map_1.ResourceMap();
            this._folderMatches = new map_1.ResourceMap();
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._unDisposedFileMatches = new map_1.ResourceMap();
            this._unDisposedFolderMatches = new map_1.ResourceMap();
            this._name = new lazy_1.Lazy(() => this.resource ? labelService.getUriBasenameLabel(this.resource) : '');
        }
        get searchModel() {
            return this._searchResult.searchModel;
        }
        get showHighlights() {
            return this._parent.showHighlights;
        }
        get closestRoot() {
            return this._closestRoot;
        }
        set replacingAll(b) {
            this._replacingAll = b;
        }
        id() {
            return this._id;
        }
        get resource() {
            return this._resource;
        }
        index() {
            return this._index;
        }
        name() {
            return this._name.value;
        }
        parent() {
            return this._parent;
        }
        bindModel(model) {
            const fileMatch = this._fileMatches.get(model.uri);
            if (fileMatch) {
                fileMatch.bindModel(model);
            }
            else {
                const folderMatch = this.getFolderMatch(model.uri);
                const match = folderMatch?.getDownstreamFileMatch(model.uri);
                match?.bindModel(model);
            }
        }
        async bindNotebookEditorWidget(editor, resource) {
            const fileMatch = this._fileMatches.get(resource);
            if (fileMatch) {
                fileMatch.bindNotebookEditorWidget(editor);
                await fileMatch.updateMatchesForEditorWidget();
            }
            else {
                const folderMatches = this.folderMatchesIterator();
                for (const elem of folderMatches) {
                    await elem.bindNotebookEditorWidget(editor, resource);
                }
            }
        }
        unbindNotebookEditorWidget(editor, resource) {
            const fileMatch = this._fileMatches.get(resource);
            if (fileMatch) {
                fileMatch.unbindNotebookEditorWidget(editor);
            }
            else {
                const folderMatches = this.folderMatchesIterator();
                for (const elem of folderMatches) {
                    elem.unbindNotebookEditorWidget(editor, resource);
                }
            }
        }
        createIntermediateFolderMatch(resource, id, index, query, baseWorkspaceFolder) {
            const folderMatch = this._register(this.instantiationService.createInstance(FolderMatchWithResource, resource, id, index, query, this, this._searchResult, baseWorkspaceFolder));
            this.configureIntermediateMatch(folderMatch);
            this.doAddFolder(folderMatch);
            return folderMatch;
        }
        configureIntermediateMatch(folderMatch) {
            const disposable = folderMatch.onChange((event) => this.onFolderChange(folderMatch, event));
            this._register(folderMatch.onDispose(() => disposable.dispose()));
        }
        clear(clearingAll = false) {
            const changed = this.allDownstreamFileMatches();
            this.disposeMatches();
            this._onChange.fire({ elements: changed, removed: true, added: false, clearingAll });
        }
        remove(matches) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            const allMatches = getFileMatches(matches);
            this.doRemoveFile(allMatches);
        }
        async replace(match) {
            return this.replaceService.replace([match]).then(() => {
                this.doRemoveFile([match], true, true, true);
            });
        }
        replaceAll() {
            const matches = this.matches();
            return this.batchReplace(matches);
        }
        matches() {
            return [...this.fileMatchesIterator(), ...this.folderMatchesIterator()];
        }
        fileMatchesIterator() {
            return this._fileMatches.values();
        }
        folderMatchesIterator() {
            return this._folderMatches.values();
        }
        isEmpty() {
            return (this.fileCount() + this.folderCount()) === 0;
        }
        getDownstreamFileMatch(uri) {
            const directChildFileMatch = this._fileMatches.get(uri);
            if (directChildFileMatch) {
                return directChildFileMatch;
            }
            const folderMatch = this.getFolderMatch(uri);
            const match = folderMatch?.getDownstreamFileMatch(uri);
            if (match) {
                return match;
            }
            return null;
        }
        allDownstreamFileMatches() {
            let recursiveChildren = [];
            const iterator = this.folderMatchesIterator();
            for (const elem of iterator) {
                recursiveChildren = recursiveChildren.concat(elem.allDownstreamFileMatches());
            }
            return [...this.fileMatchesIterator(), ...recursiveChildren];
        }
        fileCount() {
            return this._fileMatches.size;
        }
        folderCount() {
            return this._folderMatches.size;
        }
        count() {
            return this.fileCount() + this.folderCount();
        }
        recursiveFileCount() {
            return this.allDownstreamFileMatches().length;
        }
        recursiveMatchCount() {
            return this.allDownstreamFileMatches().reduce((prev, match) => prev + match.count(), 0);
        }
        get query() {
            return this._query;
        }
        addFileMatch(raw, silent, searchInstanceID, isAiContributed) {
            // when adding a fileMatch that has intermediate directories
            const added = [];
            const updated = [];
            raw.forEach(rawFileMatch => {
                const existingFileMatch = this.getDownstreamFileMatch(rawFileMatch.resource);
                if (existingFileMatch) {
                    if (rawFileMatch.results) {
                        rawFileMatch
                            .results
                            .filter(search_1.resultIsMatch)
                            .forEach(m => {
                            textSearchResultToMatches(m, existingFileMatch, isAiContributed)
                                .forEach(m => existingFileMatch.add(m));
                        });
                    }
                    // add cell matches
                    if ((0, searchNotebookHelpers_1.isINotebookFileMatchWithModel)(rawFileMatch) || (0, searchNotebookHelpers_2.isINotebookFileMatchNoModel)(rawFileMatch)) {
                        rawFileMatch.cellResults?.forEach(rawCellMatch => {
                            const existingCellMatch = existingFileMatch.getCellMatch((0, searchNotebookHelpers_1.getIDFromINotebookCellMatch)(rawCellMatch));
                            if (existingCellMatch) {
                                existingCellMatch.addContentMatches(rawCellMatch.contentResults);
                                existingCellMatch.addWebviewMatches(rawCellMatch.webviewResults);
                            }
                            else {
                                existingFileMatch.addCellMatch(rawCellMatch);
                            }
                        });
                    }
                    updated.push(existingFileMatch);
                    if (rawFileMatch.results && rawFileMatch.results.length > 0) {
                        existingFileMatch.addContext(rawFileMatch.results);
                    }
                }
                else {
                    if (this instanceof FolderMatchWorkspaceRoot || this instanceof FolderMatchNoRoot) {
                        const fileMatch = this.createAndConfigureFileMatch(rawFileMatch, searchInstanceID);
                        added.push(fileMatch);
                    }
                }
            });
            const elements = [...added, ...updated];
            if (!silent && elements.length) {
                this._onChange.fire({ elements, added: !!added.length });
            }
        }
        doAddFile(fileMatch) {
            this._fileMatches.set(fileMatch.resource, fileMatch);
            if (this._unDisposedFileMatches.has(fileMatch.resource)) {
                this._unDisposedFileMatches.delete(fileMatch.resource);
            }
        }
        hasOnlyReadOnlyMatches() {
            return Array.from(this._fileMatches.values()).every(fm => fm.hasOnlyReadOnlyMatches());
        }
        uriHasParent(parent, child) {
            return this.uriIdentityService.extUri.isEqualOrParent(child, parent) && !this.uriIdentityService.extUri.isEqual(child, parent);
        }
        isInParentChain(folderMatch) {
            let matchItem = this;
            while (matchItem instanceof FolderMatch_1) {
                if (matchItem.id() === folderMatch.id()) {
                    return true;
                }
                matchItem = matchItem.parent();
            }
            return false;
        }
        getFolderMatch(resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            return folderMatch;
        }
        doAddFolder(folderMatch) {
            if (this instanceof FolderMatchWithResource && !this.uriHasParent(this.resource, folderMatch.resource)) {
                throw Error(`${folderMatch.resource} does not belong as a child of ${this.resource}`);
            }
            else if (this.isInParentChain(folderMatch)) {
                throw Error(`${folderMatch.resource} is a parent of ${this.resource}`);
            }
            this._folderMatches.set(folderMatch.resource, folderMatch);
            this._folderMatchesMap.set(folderMatch.resource, folderMatch);
            if (this._unDisposedFolderMatches.has(folderMatch.resource)) {
                this._unDisposedFolderMatches.delete(folderMatch.resource);
            }
        }
        async batchReplace(matches) {
            const allMatches = getFileMatches(matches);
            await this.replaceService.replace(allMatches);
            this.doRemoveFile(allMatches, true, true, true);
        }
        onFileChange(fileMatch, removed = false) {
            let added = false;
            if (!this._fileMatches.has(fileMatch.resource)) {
                this.doAddFile(fileMatch);
                added = true;
            }
            if (fileMatch.count() === 0) {
                this.doRemoveFile([fileMatch], false, false);
                added = false;
                removed = true;
            }
            if (!this._replacingAll) {
                this._onChange.fire({ elements: [fileMatch], added: added, removed: removed });
            }
        }
        onFolderChange(folderMatch, event) {
            if (!this._folderMatches.has(folderMatch.resource)) {
                this.doAddFolder(folderMatch);
            }
            if (folderMatch.isEmpty()) {
                this._folderMatches.delete(folderMatch.resource);
                folderMatch.dispose();
            }
            this._onChange.fire(event);
        }
        doRemoveFile(fileMatches, dispose = true, trigger = true, keepReadonly = false) {
            const removed = [];
            for (const match of fileMatches) {
                if (this._fileMatches.get(match.resource)) {
                    if (keepReadonly && match.hasReadonlyMatches()) {
                        continue;
                    }
                    this._fileMatches.delete(match.resource);
                    if (dispose) {
                        match.dispose();
                    }
                    else {
                        this._unDisposedFileMatches.set(match.resource, match);
                    }
                    removed.push(match);
                }
                else {
                    const folder = this.getFolderMatch(match.resource);
                    if (folder) {
                        folder.doRemoveFile([match], dispose, trigger);
                    }
                    else {
                        throw Error(`FileMatch ${match.resource} is not located within FolderMatch ${this.resource}`);
                    }
                }
            }
            if (trigger) {
                this._onChange.fire({ elements: removed, removed: true });
            }
        }
        disposeMatches() {
            [...this._fileMatches.values()].forEach((fileMatch) => fileMatch.dispose());
            [...this._folderMatches.values()].forEach((folderMatch) => folderMatch.disposeMatches());
            [...this._unDisposedFileMatches.values()].forEach((fileMatch) => fileMatch.dispose());
            [...this._unDisposedFolderMatches.values()].forEach((folderMatch) => folderMatch.disposeMatches());
            this._fileMatches.clear();
            this._folderMatches.clear();
            this._unDisposedFileMatches.clear();
            this._unDisposedFolderMatches.clear();
        }
        dispose() {
            this.disposeMatches();
            this._onDispose.fire();
            super.dispose();
        }
    };
    exports.FolderMatch = FolderMatch;
    exports.FolderMatch = FolderMatch = FolderMatch_1 = __decorate([
        __param(7, replace_1.IReplaceService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, label_1.ILabelService),
        __param(10, uriIdentity_1.IUriIdentityService)
    ], FolderMatch);
    let FolderMatchWithResource = class FolderMatchWithResource extends FolderMatch {
        constructor(_resource, _id, _index, _query, _parent, _searchResult, _closestRoot, replaceService, instantiationService, labelService, uriIdentityService) {
            super(_resource, _id, _index, _query, _parent, _searchResult, _closestRoot, replaceService, instantiationService, labelService, uriIdentityService);
            this._normalizedResource = new lazy_1.Lazy(() => this.uriIdentityService.extUri.removeTrailingPathSeparator(this.uriIdentityService.extUri.normalizePath(this.resource)));
        }
        get resource() {
            return this._resource;
        }
        get normalizedResource() {
            return this._normalizedResource.value;
        }
    };
    exports.FolderMatchWithResource = FolderMatchWithResource;
    exports.FolderMatchWithResource = FolderMatchWithResource = __decorate([
        __param(7, replace_1.IReplaceService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, label_1.ILabelService),
        __param(10, uriIdentity_1.IUriIdentityService)
    ], FolderMatchWithResource);
    /**
     * FolderMatchWorkspaceRoot => folder for workspace root
     */
    let FolderMatchWorkspaceRoot = class FolderMatchWorkspaceRoot extends FolderMatchWithResource {
        constructor(_resource, _id, _index, _query, _parent, _ai, replaceService, instantiationService, labelService, uriIdentityService) {
            super(_resource, _id, _index, _query, _parent, _parent, null, replaceService, instantiationService, labelService, uriIdentityService);
            this._ai = _ai;
        }
        normalizedUriParent(uri) {
            return this.uriIdentityService.extUri.normalizePath(this.uriIdentityService.extUri.dirname(uri));
        }
        uriEquals(uri1, ur2) {
            return this.uriIdentityService.extUri.isEqual(uri1, ur2);
        }
        createFileMatch(query, previewOptions, maxResults, parent, rawFileMatch, closestRoot, searchInstanceID) {
            const fileMatch = this.instantiationService.createInstance(FileMatch, query, previewOptions, maxResults, parent, rawFileMatch, closestRoot, searchInstanceID);
            fileMatch.createMatches(this._ai);
            parent.doAddFile(fileMatch);
            const disposable = fileMatch.onChange(({ didRemove }) => parent.onFileChange(fileMatch, didRemove));
            this._register(fileMatch.onDispose(() => disposable.dispose()));
            return fileMatch;
        }
        createAndConfigureFileMatch(rawFileMatch, searchInstanceID) {
            if (!this.uriHasParent(this.resource, rawFileMatch.resource)) {
                throw Error(`${rawFileMatch.resource} is not a descendant of ${this.resource}`);
            }
            const fileMatchParentParts = [];
            let uri = this.normalizedUriParent(rawFileMatch.resource);
            while (!this.uriEquals(this.normalizedResource, uri)) {
                fileMatchParentParts.unshift(uri);
                const prevUri = uri;
                uri = this.uriIdentityService.extUri.removeTrailingPathSeparator(this.normalizedUriParent(uri));
                if (this.uriEquals(prevUri, uri)) {
                    throw Error(`${rawFileMatch.resource} is not correctly configured as a child of ${this.normalizedResource}`);
                }
            }
            const root = this.closestRoot ?? this;
            let parent = this;
            for (let i = 0; i < fileMatchParentParts.length; i++) {
                let folderMatch = parent.getFolderMatch(fileMatchParentParts[i]);
                if (!folderMatch) {
                    folderMatch = parent.createIntermediateFolderMatch(fileMatchParentParts[i], fileMatchParentParts[i].toString(), -1, this._query, root);
                }
                parent = folderMatch;
            }
            return this.createFileMatch(this._query.contentPattern, this._query.previewOptions, this._query.maxResults, parent, rawFileMatch, root, searchInstanceID);
        }
    };
    exports.FolderMatchWorkspaceRoot = FolderMatchWorkspaceRoot;
    exports.FolderMatchWorkspaceRoot = FolderMatchWorkspaceRoot = __decorate([
        __param(6, replace_1.IReplaceService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, label_1.ILabelService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], FolderMatchWorkspaceRoot);
    /**
     * BaseFolderMatch => optional resource ("other files" node)
     * FolderMatch => required resource (normal folder node)
     */
    let FolderMatchNoRoot = class FolderMatchNoRoot extends FolderMatch {
        constructor(_id, _index, _query, _parent, replaceService, instantiationService, labelService, uriIdentityService) {
            super(null, _id, _index, _query, _parent, _parent, null, replaceService, instantiationService, labelService, uriIdentityService);
        }
        createAndConfigureFileMatch(rawFileMatch, searchInstanceID) {
            const fileMatch = this._register(this.instantiationService.createInstance(FileMatch, this._query.contentPattern, this._query.previewOptions, this._query.maxResults, this, rawFileMatch, null, searchInstanceID));
            fileMatch.createMatches(false); // currently, no support for AI results in out-of-workspace files
            this.doAddFile(fileMatch);
            const disposable = fileMatch.onChange(({ didRemove }) => this.onFileChange(fileMatch, didRemove));
            this._register(fileMatch.onDispose(() => disposable.dispose()));
            return fileMatch;
        }
    };
    exports.FolderMatchNoRoot = FolderMatchNoRoot;
    exports.FolderMatchNoRoot = FolderMatchNoRoot = __decorate([
        __param(4, replace_1.IReplaceService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, label_1.ILabelService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], FolderMatchNoRoot);
    let elemAIndex = -1;
    let elemBIndex = -1;
    /**
     * Compares instances of the same match type. Different match types should not be siblings
     * and their sort order is undefined.
     */
    function searchMatchComparer(elementA, elementB, sortOrder = "default" /* SearchSortOrder.Default */) {
        if (elementA instanceof FileMatch && elementB instanceof FolderMatch) {
            return 1;
        }
        if (elementB instanceof FileMatch && elementA instanceof FolderMatch) {
            return -1;
        }
        if (elementA instanceof FolderMatch && elementB instanceof FolderMatch) {
            elemAIndex = elementA.index();
            elemBIndex = elementB.index();
            if (elemAIndex !== -1 && elemBIndex !== -1) {
                return elemAIndex - elemBIndex;
            }
            switch (sortOrder) {
                case "countDescending" /* SearchSortOrder.CountDescending */:
                    return elementB.count() - elementA.count();
                case "countAscending" /* SearchSortOrder.CountAscending */:
                    return elementA.count() - elementB.count();
                case "type" /* SearchSortOrder.Type */:
                    return (0, comparers_1.compareFileExtensions)(elementA.name(), elementB.name());
                case "fileNames" /* SearchSortOrder.FileNames */:
                    return (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
                // Fall through otherwise
                default:
                    if (!elementA.resource || !elementB.resource) {
                        return 0;
                    }
                    return (0, comparers_1.comparePaths)(elementA.resource.fsPath, elementB.resource.fsPath) || (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
            }
        }
        if (elementA instanceof FileMatch && elementB instanceof FileMatch) {
            switch (sortOrder) {
                case "countDescending" /* SearchSortOrder.CountDescending */:
                    return elementB.count() - elementA.count();
                case "countAscending" /* SearchSortOrder.CountAscending */:
                    return elementA.count() - elementB.count();
                case "type" /* SearchSortOrder.Type */:
                    return (0, comparers_1.compareFileExtensions)(elementA.name(), elementB.name());
                case "fileNames" /* SearchSortOrder.FileNames */:
                    return (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
                case "modified" /* SearchSortOrder.Modified */: {
                    const fileStatA = elementA.fileStat;
                    const fileStatB = elementB.fileStat;
                    if (fileStatA && fileStatB) {
                        return fileStatB.mtime - fileStatA.mtime;
                    }
                }
                // Fall through otherwise
                default:
                    return (0, comparers_1.comparePaths)(elementA.resource.fsPath, elementB.resource.fsPath) || (0, comparers_1.compareFileNames)(elementA.name(), elementB.name());
            }
        }
        if (elementA instanceof MatchInNotebook && elementB instanceof MatchInNotebook) {
            return compareNotebookPos(elementA, elementB);
        }
        if (elementA instanceof Match && elementB instanceof Match) {
            return range_1.Range.compareRangesUsingStarts(elementA.range(), elementB.range());
        }
        return 0;
    }
    function compareNotebookPos(match1, match2) {
        if (match1.cellIndex === match2.cellIndex) {
            if (match1.webviewIndex !== undefined && match2.webviewIndex !== undefined) {
                return match1.webviewIndex - match2.webviewIndex;
            }
            else if (match1.webviewIndex === undefined && match2.webviewIndex === undefined) {
                return range_1.Range.compareRangesUsingStarts(match1.range(), match2.range());
            }
            else {
                // webview matches should always be after content matches
                if (match1.webviewIndex !== undefined) {
                    return 1;
                }
                else {
                    return -1;
                }
            }
        }
        else if (match1.cellIndex < match2.cellIndex) {
            return -1;
        }
        else {
            return 1;
        }
    }
    function searchComparer(elementA, elementB, sortOrder = "default" /* SearchSortOrder.Default */) {
        const elemAParents = createParentList(elementA);
        const elemBParents = createParentList(elementB);
        let i = elemAParents.length - 1;
        let j = elemBParents.length - 1;
        while (i >= 0 && j >= 0) {
            if (elemAParents[i].id() !== elemBParents[j].id()) {
                return searchMatchComparer(elemAParents[i], elemBParents[j], sortOrder);
            }
            i--;
            j--;
        }
        const elemAAtEnd = i === 0;
        const elemBAtEnd = j === 0;
        if (elemAAtEnd && !elemBAtEnd) {
            return 1;
        }
        else if (!elemAAtEnd && elemBAtEnd) {
            return -1;
        }
        return 0;
    }
    function createParentList(element) {
        const parentArray = [];
        let currElement = element;
        while (!(currElement instanceof SearchResult)) {
            parentArray.push(currElement);
            currElement = currElement.parent();
        }
        return parentArray;
    }
    let SearchResult = class SearchResult extends lifecycle_1.Disposable {
        constructor(searchModel, replaceService, instantiationService, modelService, uriIdentityService, notebookEditorService) {
            super();
            this.searchModel = searchModel;
            this.replaceService = replaceService;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.uriIdentityService = uriIdentityService;
            this.notebookEditorService = notebookEditorService;
            this._onChange = this._register(new event_1.PauseableEmitter({
                merge: mergeSearchResultEvents
            }));
            this.onChange = this._onChange.event;
            this._folderMatches = [];
            this._aiFolderMatches = [];
            this._otherFilesMatch = null;
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._aiFolderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._showHighlights = false;
            this._query = null;
            this.disposePastResults = () => Promise.resolve();
            this._isDirty = false;
            this._rangeHighlightDecorations = this.instantiationService.createInstance(RangeHighlightDecorations);
            this.modelService.getModels().forEach(model => this.onModelAdded(model));
            this._register(this.modelService.onModelAdded(model => this.onModelAdded(model)));
            this._register(this.notebookEditorService.onDidAddNotebookEditor(widget => {
                if (widget instanceof notebookEditorWidget_1.NotebookEditorWidget) {
                    this.onDidAddNotebookEditorWidget(widget);
                }
            }));
            this._register(this.onChange(e => {
                if (e.removed) {
                    this._isDirty = !this.isEmpty() || !this.isEmpty(true);
                }
            }));
        }
        async batchReplace(elementsToReplace) {
            try {
                this._onChange.pause();
                await Promise.all(elementsToReplace.map(async (elem) => {
                    const parent = elem.parent();
                    if ((parent instanceof FolderMatch || parent instanceof FileMatch) && arrayContainsElementOrParent(parent, elementsToReplace)) {
                        // skip any children who have parents in the array
                        return;
                    }
                    if (elem instanceof FileMatch) {
                        await elem.parent().replace(elem);
                    }
                    else if (elem instanceof Match) {
                        await elem.parent().replace(elem);
                    }
                    else if (elem instanceof FolderMatch) {
                        await elem.replaceAll();
                    }
                }));
            }
            finally {
                this._onChange.resume();
            }
        }
        batchRemove(elementsToRemove) {
            // need to check that we aren't trying to remove elements twice
            const removedElems = [];
            try {
                this._onChange.pause();
                elementsToRemove.forEach((currentElement) => {
                    if (!arrayContainsElementOrParent(currentElement, removedElems)) {
                        currentElement.parent().remove(currentElement);
                        removedElems.push(currentElement);
                    }
                });
            }
            finally {
                this._onChange.resume();
            }
        }
        get isDirty() {
            return this._isDirty;
        }
        get query() {
            return this._query;
        }
        set query(query) {
            // When updating the query we could change the roots, so keep a reference to them to clean up when we trigger `disposePastResults`
            const oldFolderMatches = this.folderMatches();
            this.disposePastResults = async () => {
                oldFolderMatches.forEach(match => match.clear());
                oldFolderMatches.forEach(match => match.dispose());
                this._isDirty = false;
            };
            this._cachedSearchComplete = undefined;
            this._aiCachedSearchComplete = undefined;
            this._rangeHighlightDecorations.removeHighlightRange();
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._aiFolderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            if (!query) {
                return;
            }
            this._folderMatches = (query && query.folderQueries || [])
                .map(fq => fq.folder)
                .map((resource, index) => this._createBaseFolderMatch(resource, resource.toString(), index, query, false));
            this._folderMatches.forEach(fm => this._folderMatchesMap.set(fm.resource, fm));
            this._aiFolderMatches = (query && query.folderQueries || [])
                .map(fq => fq.folder)
                .map((resource, index) => this._createBaseFolderMatch(resource, resource.toString(), index, query, true));
            this._aiFolderMatches.forEach(fm => this._aiFolderMatchesMap.set(fm.resource, fm));
            this._otherFilesMatch = this._createBaseFolderMatch(null, 'otherFiles', this._folderMatches.length + this._aiFolderMatches.length + 1, query, false);
            this._query = query;
        }
        setCachedSearchComplete(cachedSearchComplete, ai) {
            if (ai) {
                this._aiCachedSearchComplete = cachedSearchComplete;
            }
            else {
                this._cachedSearchComplete = cachedSearchComplete;
            }
        }
        getCachedSearchComplete(ai) {
            return ai ? this._aiCachedSearchComplete : this._cachedSearchComplete;
        }
        onDidAddNotebookEditorWidget(widget) {
            this._onWillChangeModelListener?.dispose();
            this._onWillChangeModelListener = widget.onWillChangeModel((model) => {
                if (model) {
                    this.onNotebookEditorWidgetRemoved(widget, model?.uri);
                }
            });
            this._onDidChangeModelListener?.dispose();
            // listen to view model change as we are searching on both inputs and outputs
            this._onDidChangeModelListener = widget.onDidAttachViewModel(() => {
                if (widget.hasModel()) {
                    this.onNotebookEditorWidgetAdded(widget, widget.textModel.uri);
                }
            });
        }
        onModelAdded(model) {
            const folderMatch = this._folderMatchesMap.findSubstr(model.uri);
            folderMatch?.bindModel(model);
        }
        async onNotebookEditorWidgetAdded(editor, resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            await folderMatch?.bindNotebookEditorWidget(editor, resource);
        }
        onNotebookEditorWidgetRemoved(editor, resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            folderMatch?.unbindNotebookEditorWidget(editor, resource);
        }
        _createBaseFolderMatch(resource, id, index, query, ai) {
            let folderMatch;
            if (resource) {
                folderMatch = this._register(this.instantiationService.createInstance(FolderMatchWorkspaceRoot, resource, id, index, query, this, ai));
            }
            else {
                folderMatch = this._register(this.instantiationService.createInstance(FolderMatchNoRoot, id, index, query, this));
            }
            const disposable = folderMatch.onChange((event) => this._onChange.fire(event));
            this._register(folderMatch.onDispose(() => disposable.dispose()));
            return folderMatch;
        }
        add(allRaw, searchInstanceID, ai, silent = false) {
            // Split up raw into a list per folder so we can do a batch add per folder.
            const { byFolder, other } = this.groupFilesByFolder(allRaw, ai);
            byFolder.forEach(raw => {
                if (!raw.length) {
                    return;
                }
                // ai results go into the respective folder
                const folderMatch = ai ? this.getAIFolderMatch(raw[0].resource) : this.getFolderMatch(raw[0].resource);
                folderMatch?.addFileMatch(raw, silent, searchInstanceID, ai);
            });
            if (!ai) {
                this._otherFilesMatch?.addFileMatch(other, silent, searchInstanceID, false);
            }
            this.disposePastResults();
        }
        clear() {
            this.folderMatches().forEach((folderMatch) => folderMatch.clear(true));
            this.folderMatches(true);
            this.disposeMatches();
            this._folderMatches = [];
            this._aiFolderMatches = [];
            this._otherFilesMatch = null;
        }
        remove(matches, ai = false) {
            if (!Array.isArray(matches)) {
                matches = [matches];
            }
            matches.forEach(m => {
                if (m instanceof FolderMatch) {
                    m.clear();
                }
            });
            const fileMatches = matches.filter(m => m instanceof FileMatch);
            const { byFolder, other } = this.groupFilesByFolder(fileMatches, ai);
            byFolder.forEach(matches => {
                if (!matches.length) {
                    return;
                }
                this.getFolderMatch(matches[0].resource).remove(matches);
            });
            if (other.length) {
                this.getFolderMatch(other[0].resource).remove(other);
            }
        }
        replace(match) {
            return this.getFolderMatch(match.resource).replace(match);
        }
        replaceAll(progress) {
            this.replacingAll = true;
            const promise = this.replaceService.replace(this.matches(), progress);
            return promise.then(() => {
                this.replacingAll = false;
                this.clear();
            }, () => {
                this.replacingAll = false;
            });
        }
        folderMatches(ai = false) {
            if (ai) {
                return this._aiFolderMatches;
            }
            return this._otherFilesMatch ?
                [
                    ...this._folderMatches,
                    this._otherFilesMatch
                ] :
                [
                    ...this._folderMatches
                ];
        }
        matches(ai = false) {
            const matches = [];
            this.folderMatches(ai).forEach(folderMatch => {
                matches.push(folderMatch.allDownstreamFileMatches());
            });
            return [].concat(...matches);
        }
        isEmpty(ai = false) {
            return this.folderMatches(ai).every((folderMatch) => folderMatch.isEmpty());
        }
        fileCount(ai = false) {
            return this.folderMatches(ai).reduce((prev, match) => prev + match.recursiveFileCount(), 0);
        }
        count(ai = false) {
            return this.matches(ai).reduce((prev, match) => prev + match.count(), 0);
        }
        get showHighlights() {
            return this._showHighlights;
        }
        toggleHighlights(value) {
            if (this._showHighlights === value) {
                return;
            }
            this._showHighlights = value;
            let selectedMatch = null;
            this.matches().forEach((fileMatch) => {
                fileMatch.updateHighlights();
                fileMatch.updateNotebookHighlights();
                if (!selectedMatch) {
                    selectedMatch = fileMatch.getSelectedMatch();
                }
            });
            if (this._showHighlights && selectedMatch) {
                // TS?
                this._rangeHighlightDecorations.highlightRange(selectedMatch.parent().resource, selectedMatch.range());
            }
            else {
                this._rangeHighlightDecorations.removeHighlightRange();
            }
        }
        get rangeHighlightDecorations() {
            return this._rangeHighlightDecorations;
        }
        getFolderMatch(resource) {
            const folderMatch = this._folderMatchesMap.findSubstr(resource);
            return folderMatch ? folderMatch : this._otherFilesMatch;
        }
        getAIFolderMatch(resource) {
            const folderMatch = this._aiFolderMatchesMap.findSubstr(resource);
            return folderMatch;
        }
        set replacingAll(running) {
            this.folderMatches().forEach((folderMatch) => {
                folderMatch.replacingAll = running;
            });
        }
        groupFilesByFolder(fileMatches, ai) {
            const rawPerFolder = new map_1.ResourceMap();
            const otherFileMatches = [];
            (ai ? this._aiFolderMatches : this._folderMatches).forEach(fm => rawPerFolder.set(fm.resource, []));
            fileMatches.forEach(rawFileMatch => {
                const folderMatch = ai ? this.getAIFolderMatch(rawFileMatch.resource) : this.getFolderMatch(rawFileMatch.resource);
                if (!folderMatch) {
                    // foldermatch was previously removed by user or disposed for some reason
                    return;
                }
                const resource = folderMatch.resource;
                if (resource) {
                    rawPerFolder.get(resource).push(rawFileMatch);
                }
                else {
                    otherFileMatches.push(rawFileMatch);
                }
            });
            return {
                byFolder: rawPerFolder,
                other: otherFileMatches
            };
        }
        disposeMatches() {
            this.folderMatches().forEach(folderMatch => folderMatch.dispose());
            this.folderMatches(true).forEach(folderMatch => folderMatch.dispose());
            this._folderMatches = [];
            this._aiFolderMatches = [];
            this._folderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._aiFolderMatchesMap = ternarySearchTree_1.TernarySearchTree.forUris(key => this.uriIdentityService.extUri.ignorePathCasing(key));
            this._rangeHighlightDecorations.removeHighlightRange();
        }
        async dispose() {
            this._onWillChangeModelListener?.dispose();
            this._onDidChangeModelListener?.dispose();
            this._rangeHighlightDecorations.dispose();
            this.disposeMatches();
            super.dispose();
            await this.disposePastResults();
        }
    };
    exports.SearchResult = SearchResult;
    exports.SearchResult = SearchResult = __decorate([
        __param(1, replace_1.IReplaceService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, model_2.IModelService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, notebookEditorService_1.INotebookEditorService)
    ], SearchResult);
    var SearchModelLocation;
    (function (SearchModelLocation) {
        SearchModelLocation[SearchModelLocation["PANEL"] = 0] = "PANEL";
        SearchModelLocation[SearchModelLocation["QUICK_ACCESS"] = 1] = "QUICK_ACCESS";
    })(SearchModelLocation || (exports.SearchModelLocation = SearchModelLocation = {}));
    let SearchModel = class SearchModel extends lifecycle_1.Disposable {
        constructor(searchService, telemetryService, configurationService, instantiationService, logService, notebookSearchService, progressService) {
            super();
            this.searchService = searchService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.notebookSearchService = notebookSearchService;
            this.progressService = progressService;
            this._searchQuery = null;
            this._replaceActive = false;
            this._replaceString = null;
            this._replacePattern = null;
            this._preserveCase = false;
            this._startStreamDelay = Promise.resolve();
            this._resultQueue = [];
            this._aiResultQueue = [];
            this._onReplaceTermChanged = this._register(new event_1.Emitter());
            this.onReplaceTermChanged = this._onReplaceTermChanged.event;
            this._onSearchResultChanged = this._register(new event_1.PauseableEmitter({
                merge: mergeSearchResultEvents
            }));
            this.onSearchResultChanged = this._onSearchResultChanged.event;
            this.currentCancelTokenSource = null;
            this.currentAICancelTokenSource = null;
            this.searchCancelledForNewSearch = false;
            this.aiSearchCancelledForNewSearch = false;
            this.location = SearchModelLocation.PANEL;
            this._searchResult = this.instantiationService.createInstance(SearchResult, this);
            this._register(this._searchResult.onChange((e) => this._onSearchResultChanged.fire(e)));
        }
        isReplaceActive() {
            return this._replaceActive;
        }
        set replaceActive(replaceActive) {
            this._replaceActive = replaceActive;
        }
        get replacePattern() {
            return this._replacePattern;
        }
        get replaceString() {
            return this._replaceString || '';
        }
        set preserveCase(value) {
            this._preserveCase = value;
        }
        get preserveCase() {
            return this._preserveCase;
        }
        set replaceString(replaceString) {
            this._replaceString = replaceString;
            if (this._searchQuery) {
                this._replacePattern = new replace_2.ReplacePattern(replaceString, this._searchQuery.contentPattern);
            }
            this._onReplaceTermChanged.fire();
        }
        get searchResult() {
            return this._searchResult;
        }
        async addAIResults(onProgress) {
            if (this.searchResult.count(true)) {
                // already has matches
                return;
            }
            else {
                if (this._searchQuery) {
                    await this.aiSearch({ ...this._searchQuery, contentPattern: this._searchQuery.contentPattern.pattern, type: 3 /* QueryType.aiText */ }, onProgress, this.currentCancelTokenSource?.token);
                }
            }
        }
        async doAISearchWithModal(searchQuery, searchInstanceID, token, onProgress) {
            const promise = this.searchService.aiTextSearch(searchQuery, token, async (p) => {
                this.onSearchProgress(p, searchInstanceID, false, true);
                onProgress?.(p);
            });
            return this.progressService.withProgress({
                location: 15 /* ProgressLocation.Notification */,
                type: 'syncing',
                title: 'Searching for AI results...',
            }, async (_) => promise);
        }
        aiSearch(query, onProgress, callerToken) {
            const searchInstanceID = Date.now().toString();
            const tokenSource = this.currentAICancelTokenSource = new cancellation_1.CancellationTokenSource(callerToken);
            const start = Date.now();
            const asyncAIResults = this.doAISearchWithModal(query, searchInstanceID, this.currentAICancelTokenSource.token, async (p) => {
                this.onSearchProgress(p, searchInstanceID, false, true);
                onProgress?.(p);
            })
                .then(value => {
                this.onSearchCompleted(value, Date.now() - start, searchInstanceID, true);
                return value;
            }, e => {
                this.onSearchError(e, Date.now() - start, true);
                throw e;
            }).finally(() => tokenSource.dispose());
            return asyncAIResults;
        }
        doSearch(query, progressEmitter, searchQuery, searchInstanceID, onProgress, callerToken) {
            const asyncGenerateOnProgress = async (p) => {
                progressEmitter.fire();
                this.onSearchProgress(p, searchInstanceID, false, false);
                onProgress?.(p);
            };
            const syncGenerateOnProgress = (p) => {
                progressEmitter.fire();
                this.onSearchProgress(p, searchInstanceID, true);
                onProgress?.(p);
            };
            const tokenSource = this.currentCancelTokenSource = new cancellation_1.CancellationTokenSource(callerToken);
            const notebookResult = this.notebookSearchService.notebookSearch(query, tokenSource.token, searchInstanceID, asyncGenerateOnProgress);
            const textResult = this.searchService.textSearchSplitSyncAsync(searchQuery, this.currentCancelTokenSource.token, asyncGenerateOnProgress, notebookResult.openFilesToScan, notebookResult.allScannedFiles);
            const syncResults = textResult.syncResults.results;
            syncResults.forEach(p => { if (p) {
                syncGenerateOnProgress(p);
            } });
            const getAsyncResults = async () => {
                const searchStart = Date.now();
                // resolve async parts of search
                const allClosedEditorResults = await textResult.asyncResults;
                const resolvedNotebookResults = await notebookResult.completeData;
                tokenSource.dispose();
                const searchLength = Date.now() - searchStart;
                const resolvedResult = {
                    results: [...allClosedEditorResults.results, ...resolvedNotebookResults.results],
                    messages: [...allClosedEditorResults.messages, ...resolvedNotebookResults.messages],
                    limitHit: allClosedEditorResults.limitHit || resolvedNotebookResults.limitHit,
                    exit: allClosedEditorResults.exit,
                    stats: allClosedEditorResults.stats,
                };
                this.logService.trace(`whole search time | ${searchLength}ms`);
                return resolvedResult;
            };
            return {
                asyncResults: getAsyncResults(),
                syncResults
            };
        }
        search(query, onProgress, callerToken) {
            this.cancelSearch(true);
            this._searchQuery = query;
            if (!this.searchConfig.searchOnType) {
                this.searchResult.clear();
            }
            const searchInstanceID = Date.now().toString();
            this._searchResult.query = this._searchQuery;
            const progressEmitter = this._register(new event_1.Emitter());
            this._replacePattern = new replace_2.ReplacePattern(this.replaceString, this._searchQuery.contentPattern);
            // In search on type case, delay the streaming of results just a bit, so that we don't flash the only "local results" fast path
            this._startStreamDelay = new Promise(resolve => setTimeout(resolve, this.searchConfig.searchOnType ? 150 : 0));
            const req = this.doSearch(query, progressEmitter, this._searchQuery, searchInstanceID, onProgress, callerToken);
            const asyncResults = req.asyncResults;
            const syncResults = req.syncResults;
            if (onProgress) {
                syncResults.forEach(p => {
                    if (p) {
                        onProgress(p);
                    }
                });
            }
            const start = Date.now();
            let event;
            const progressEmitterPromise = new Promise(resolve => {
                event = event_1.Event.once(progressEmitter.event)(resolve);
                return event;
            });
            Promise.race([asyncResults, progressEmitterPromise]).finally(() => {
                /* __GDPR__
                    "searchResultsFirstRender" : {
                        "owner": "roblourens",
                        "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                    }
                */
                event?.dispose();
                this.telemetryService.publicLog('searchResultsFirstRender', { duration: Date.now() - start });
            });
            try {
                return {
                    asyncResults: asyncResults.then(value => {
                        this.onSearchCompleted(value, Date.now() - start, searchInstanceID, false);
                        return value;
                    }, e => {
                        this.onSearchError(e, Date.now() - start, false);
                        throw e;
                    }),
                    syncResults
                };
            }
            finally {
                /* __GDPR__
                    "searchResultsFinished" : {
                        "owner": "roblourens",
                        "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                    }
                */
                this.telemetryService.publicLog('searchResultsFinished', { duration: Date.now() - start });
            }
        }
        onSearchCompleted(completed, duration, searchInstanceID, ai) {
            if (!this._searchQuery) {
                throw new Error('onSearchCompleted must be called after a search is started');
            }
            if (ai) {
                this._searchResult.add(this._aiResultQueue, searchInstanceID, true);
                this._aiResultQueue.length = 0;
            }
            else {
                this._searchResult.add(this._resultQueue, searchInstanceID, false);
                this._resultQueue.length = 0;
            }
            this.searchResult.setCachedSearchComplete(completed, ai);
            const options = Object.assign({}, this._searchQuery.contentPattern);
            delete options.pattern;
            const stats = completed && completed.stats;
            const fileSchemeOnly = this._searchQuery.folderQueries.every(fq => fq.folder.scheme === network_1.Schemas.file);
            const otherSchemeOnly = this._searchQuery.folderQueries.every(fq => fq.folder.scheme !== network_1.Schemas.file);
            const scheme = fileSchemeOnly ? network_1.Schemas.file :
                otherSchemeOnly ? 'other' :
                    'mixed';
            /* __GDPR__
                "searchResultsShown" : {
                    "owner": "roblourens",
                    "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "fileCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "options": { "${inline}": [ "${IPatternInfo}" ] },
                    "duration": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "type" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                    "scheme" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" },
                    "searchOnTypeEnabled" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog('searchResultsShown', {
                count: this._searchResult.count(),
                fileCount: this._searchResult.fileCount(),
                options,
                duration,
                type: stats && stats.type,
                scheme,
                searchOnTypeEnabled: this.searchConfig.searchOnType
            });
            return completed;
        }
        onSearchError(e, duration, ai) {
            if (errors.isCancellationError(e)) {
                this.onSearchCompleted((ai ? this.aiSearchCancelledForNewSearch : this.searchCancelledForNewSearch)
                    ? { exit: 1 /* SearchCompletionExitCode.NewSearchStarted */, results: [], messages: [] }
                    : undefined, duration, '', ai);
                if (ai) {
                    this.aiSearchCancelledForNewSearch = false;
                }
                else {
                    this.searchCancelledForNewSearch = false;
                }
            }
        }
        onSearchProgress(p, searchInstanceID, sync = true, ai = false) {
            const targetQueue = ai ? this._aiResultQueue : this._resultQueue;
            if (p.resource) {
                targetQueue.push(p);
                if (sync) {
                    if (targetQueue.length) {
                        this._searchResult.add(targetQueue, searchInstanceID, false, true);
                        targetQueue.length = 0;
                    }
                }
                else {
                    this._startStreamDelay.then(() => {
                        if (targetQueue.length) {
                            this._searchResult.add(targetQueue, searchInstanceID, ai, true);
                            targetQueue.length = 0;
                        }
                    });
                }
            }
        }
        get searchConfig() {
            return this.configurationService.getValue('search');
        }
        cancelSearch(cancelledForNewSearch = false) {
            if (this.currentCancelTokenSource) {
                this.searchCancelledForNewSearch = cancelledForNewSearch;
                this.currentCancelTokenSource.cancel();
                return true;
            }
            return false;
        }
        cancelAISearch(cancelledForNewSearch = false) {
            if (this.currentAICancelTokenSource) {
                this.aiSearchCancelledForNewSearch = cancelledForNewSearch;
                this.currentAICancelTokenSource.cancel();
                return true;
            }
            return false;
        }
        dispose() {
            this.cancelSearch();
            this.cancelAISearch();
            this.searchResult.dispose();
            super.dispose();
        }
    };
    exports.SearchModel = SearchModel;
    exports.SearchModel = SearchModel = __decorate([
        __param(0, search_1.ISearchService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService),
        __param(5, notebookSearch_1.INotebookSearchService),
        __param(6, progress_1.IProgressService)
    ], SearchModel);
    let SearchViewModelWorkbenchService = class SearchViewModelWorkbenchService {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this._searchModel = null;
        }
        get searchModel() {
            if (!this._searchModel) {
                this._searchModel = this.instantiationService.createInstance(SearchModel);
            }
            return this._searchModel;
        }
        set searchModel(searchModel) {
            this._searchModel?.dispose();
            this._searchModel = searchModel;
        }
    };
    exports.SearchViewModelWorkbenchService = SearchViewModelWorkbenchService;
    exports.SearchViewModelWorkbenchService = SearchViewModelWorkbenchService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], SearchViewModelWorkbenchService);
    exports.ISearchViewModelWorkbenchService = (0, instantiation_1.createDecorator)('searchViewModelWorkbenchService');
    /**
     * Can add a range highlight decoration to a model.
     * It will automatically remove it when the model has its decorations changed.
     */
    let RangeHighlightDecorations = class RangeHighlightDecorations {
        static { RangeHighlightDecorations_1 = this; }
        constructor(_modelService) {
            this._modelService = _modelService;
            this._decorationId = null;
            this._model = null;
            this._modelDisposables = new lifecycle_1.DisposableStore();
        }
        removeHighlightRange() {
            if (this._model && this._decorationId) {
                const decorationId = this._decorationId;
                this._model.changeDecorations((accessor) => {
                    accessor.removeDecoration(decorationId);
                });
            }
            this._decorationId = null;
        }
        highlightRange(resource, range, ownerId = 0) {
            let model;
            if (uri_1.URI.isUri(resource)) {
                model = this._modelService.getModel(resource);
            }
            else {
                model = resource;
            }
            if (model) {
                this.doHighlightRange(model, range);
            }
        }
        doHighlightRange(model, range) {
            this.removeHighlightRange();
            model.changeDecorations((accessor) => {
                this._decorationId = accessor.addDecoration(range, RangeHighlightDecorations_1._RANGE_HIGHLIGHT_DECORATION);
            });
            this.setModel(model);
        }
        setModel(model) {
            if (this._model !== model) {
                this.clearModelListeners();
                this._model = model;
                this._modelDisposables.add(this._model.onDidChangeDecorations((e) => {
                    this.clearModelListeners();
                    this.removeHighlightRange();
                    this._model = null;
                }));
                this._modelDisposables.add(this._model.onWillDispose(() => {
                    this.clearModelListeners();
                    this.removeHighlightRange();
                    this._model = null;
                }));
            }
        }
        clearModelListeners() {
            this._modelDisposables.clear();
        }
        dispose() {
            if (this._model) {
                this.removeHighlightRange();
                this._model = null;
            }
            this._modelDisposables.dispose();
        }
        static { this._RANGE_HIGHLIGHT_DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'search-range-highlight',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'rangeHighlight',
            isWholeLine: true
        }); }
    };
    exports.RangeHighlightDecorations = RangeHighlightDecorations;
    exports.RangeHighlightDecorations = RangeHighlightDecorations = RangeHighlightDecorations_1 = __decorate([
        __param(0, model_2.IModelService)
    ], RangeHighlightDecorations);
    function textSearchResultToMatches(rawMatch, fileMatch, isAiContributed) {
        const previewLines = rawMatch.preview.text.split('\n');
        if (Array.isArray(rawMatch.ranges)) {
            return rawMatch.ranges.map((r, i) => {
                const previewRange = rawMatch.preview.matches[i];
                return new Match(fileMatch, previewLines, previewRange, r, isAiContributed);
            });
        }
        else {
            const previewRange = rawMatch.preview.matches;
            const match = new Match(fileMatch, previewLines, previewRange, rawMatch.ranges, isAiContributed);
            return [match];
        }
    }
    // text search to notebook matches
    function textSearchMatchesToNotebookMatches(textSearchMatches, cell) {
        const notebookMatches = [];
        textSearchMatches.forEach((textSearchMatch) => {
            const previewLines = textSearchMatch.preview.text.split('\n');
            if (Array.isArray(textSearchMatch.ranges)) {
                textSearchMatch.ranges.forEach((r, i) => {
                    const previewRange = textSearchMatch.preview.matches[i];
                    const match = new MatchInNotebook(cell, previewLines, previewRange, r, textSearchMatch.webviewIndex);
                    notebookMatches.push(match);
                });
            }
            else {
                const previewRange = textSearchMatch.preview.matches;
                const match = new MatchInNotebook(cell, previewLines, previewRange, textSearchMatch.ranges, textSearchMatch.webviewIndex);
                notebookMatches.push(match);
            }
        });
        return notebookMatches;
    }
    function arrayContainsElementOrParent(element, testArray) {
        do {
            if (testArray.includes(element)) {
                return true;
            }
        } while (!(element.parent() instanceof SearchResult) && (element = element.parent()));
        return false;
    }
    function getFileMatches(matches) {
        const folderMatches = [];
        const fileMatches = [];
        matches.forEach((e) => {
            if (e instanceof FileMatch) {
                fileMatches.push(e);
            }
            else {
                folderMatches.push(e);
            }
        });
        return fileMatches.concat(folderMatches.map(e => e.allDownstreamFileMatches()).flat());
    }
    function mergeSearchResultEvents(events) {
        const retEvent = {
            elements: [],
            added: false,
            removed: false,
        };
        events.forEach((e) => {
            if (e.added) {
                retEvent.added = true;
            }
            if (e.removed) {
                retEvent.removed = true;
            }
            retEvent.elements = retEvent.elements.concat(e.elements);
        });
        return retEvent;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC9icm93c2VyL3NlYXJjaE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErNkNoRyxrREFvRUM7SUFFRCxnREFvQkM7SUFDRCx3Q0FzQkM7SUE2NUJELGdGQWlCQztJQUVELG9FQVFDO0lBNTZFRCxNQUFhLEtBQUs7aUJBRU8sc0JBQWlCLEdBQUcsR0FBRyxDQUFDO1FBUWhELFlBQXNCLE9BQWtCLEVBQVUsaUJBQTJCLEVBQUUsaUJBQStCLEVBQUUsY0FBNEIsRUFBa0IsYUFBc0I7WUFBOUosWUFBTyxHQUFQLE9BQU8sQ0FBVztZQUFVLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBVTtZQUFpRixrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQUNuTCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDaEYsTUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsZUFBZSxLQUFLLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM3RixpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztZQUNqQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxxQkFBWSxDQUFDLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLGNBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUV0RyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksYUFBSyxDQUN0QixjQUFjLENBQUMsZUFBZSxHQUFHLENBQUMsRUFDbEMsY0FBYyxDQUFDLFdBQVcsR0FBRyxDQUFD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