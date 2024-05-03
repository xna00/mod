/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/common/config/editorOptions", "vs/editor/common/cursor/cursor", "vs/editor/common/cursorCommon", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/textModelEvents", "vs/editor/common/languages", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/textToHtmlTokenizer", "vs/editor/common/viewEvents", "vs/editor/common/viewLayout/viewLayout", "vs/editor/common/viewModel/minimapTokensColorTracker", "vs/editor/common/viewModel", "vs/editor/common/viewModel/viewModelDecorations", "vs/editor/common/viewModelEventDispatcher", "vs/editor/common/viewModel/viewModelLines", "vs/editor/common/viewModel/glyphLanesModel"], function (require, exports, arrays_1, async_1, color_1, lifecycle_1, platform, strings, editorOptions_1, cursor_1, cursorCommon_1, position_1, range_1, textModelEvents, languages_1, modesRegistry_1, textToHtmlTokenizer_1, viewEvents, viewLayout_1, minimapTokensColorTracker_1, viewModel_1, viewModelDecorations_1, viewModelEventDispatcher_1, viewModelLines_1, glyphLanesModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModel = void 0;
    const USE_IDENTITY_LINES_COLLECTION = true;
    class ViewModel extends lifecycle_1.Disposable {
        constructor(editorId, configuration, model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, scheduleAtNextAnimationFrame, languageConfigurationService, _themeService, _attachedView) {
            super();
            this.languageConfigurationService = languageConfigurationService;
            this._themeService = _themeService;
            this._attachedView = _attachedView;
            this.hiddenAreasModel = new HiddenAreasModel();
            this.previousHiddenAreas = [];
            this._editorId = editorId;
            this._configuration = configuration;
            this.model = model;
            this._eventDispatcher = new viewModelEventDispatcher_1.ViewModelEventDispatcher();
            this.onEvent = this._eventDispatcher.onEvent;
            this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
            this._updateConfigurationViewLineCount = this._register(new async_1.RunOnceScheduler(() => this._updateConfigurationViewLineCountNow(), 0));
            this._hasFocus = false;
            this._viewportStart = ViewportStart.create(this.model);
            this.glyphLanes = new glyphLanesModel_1.GlyphMarginLanesModel(0);
            if (USE_IDENTITY_LINES_COLLECTION && this.model.isTooLargeForTokenization()) {
                this._lines = new viewModelLines_1.ViewModelLinesFromModelAsIs(this.model);
            }
            else {
                const options = this._configuration.options;
                const fontInfo = options.get(50 /* EditorOption.fontInfo */);
                const wrappingStrategy = options.get(139 /* EditorOption.wrappingStrategy */);
                const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
                const wrappingIndent = options.get(138 /* EditorOption.wrappingIndent */);
                const wordBreak = options.get(129 /* EditorOption.wordBreak */);
                this._lines = new viewModelLines_1.ViewModelLinesFromProjectedModel(this._editorId, this.model, domLineBreaksComputerFactory, monospaceLineBreaksComputerFactory, fontInfo, this.model.getOptions().tabSize, wrappingStrategy, wrappingInfo.wrappingColumn, wrappingIndent, wordBreak);
            }
            this.coordinatesConverter = this._lines.createCoordinatesConverter();
            this._cursor = this._register(new cursor_1.CursorsController(model, this, this.coordinatesConverter, this.cursorConfig));
            this.viewLayout = this._register(new viewLayout_1.ViewLayout(this._configuration, this.getLineCount(), scheduleAtNextAnimationFrame));
            this._register(this.viewLayout.onDidScroll((e) => {
                if (e.scrollTopChanged) {
                    this._handleVisibleLinesChanged();
                }
                if (e.scrollTopChanged) {
                    this._viewportStart.invalidate();
                }
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewScrollChangedEvent(e));
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ScrollChangedEvent(e.oldScrollWidth, e.oldScrollLeft, e.oldScrollHeight, e.oldScrollTop, e.scrollWidth, e.scrollLeft, e.scrollHeight, e.scrollTop));
            }));
            this._register(this.viewLayout.onDidContentSizeChange((e) => {
                this._eventDispatcher.emitOutgoingEvent(e);
            }));
            this._decorations = new viewModelDecorations_1.ViewModelDecorations(this._editorId, this.model, this._configuration, this._lines, this.coordinatesConverter);
            this._registerModelEvents();
            this._register(this._configuration.onDidChangeFast((e) => {
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    this._onConfigurationChanged(eventsCollector, e);
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
            }));
            this._register(minimapTokensColorTracker_1.MinimapTokensColorTracker.getInstance().onDidChange(() => {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewTokensColorsChangedEvent());
            }));
            this._register(this._themeService.onDidColorThemeChange((theme) => {
                this._invalidateDecorationsColorCache();
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewThemeChangedEvent(theme));
            }));
            this._updateConfigurationViewLineCountNow();
        }
        dispose() {
            // First remove listeners, as disposing the lines might end up sending
            // model decoration changed events ... and we no longer care about them ...
            super.dispose();
            this._decorations.dispose();
            this._lines.dispose();
            this._viewportStart.dispose();
            this._eventDispatcher.dispose();
        }
        createLineBreaksComputer() {
            return this._lines.createLineBreaksComputer();
        }
        addViewEventHandler(eventHandler) {
            this._eventDispatcher.addViewEventHandler(eventHandler);
        }
        removeViewEventHandler(eventHandler) {
            this._eventDispatcher.removeViewEventHandler(eventHandler);
        }
        _updateConfigurationViewLineCountNow() {
            this._configuration.setViewLineCount(this._lines.getViewLineCount());
        }
        getModelVisibleRanges() {
            const linesViewportData = this.viewLayout.getLinesViewportData();
            const viewVisibleRange = new range_1.Range(linesViewportData.startLineNumber, this.getLineMinColumn(linesViewportData.startLineNumber), linesViewportData.endLineNumber, this.getLineMaxColumn(linesViewportData.endLineNumber));
            const modelVisibleRanges = this._toModelVisibleRanges(viewVisibleRange);
            return modelVisibleRanges;
        }
        visibleLinesStabilized() {
            const modelVisibleRanges = this.getModelVisibleRanges();
            this._attachedView.setVisibleLines(modelVisibleRanges, true);
        }
        _handleVisibleLinesChanged() {
            const modelVisibleRanges = this.getModelVisibleRanges();
            this._attachedView.setVisibleLines(modelVisibleRanges, false);
        }
        setHasFocus(hasFocus) {
            this._hasFocus = hasFocus;
            this._cursor.setHasFocus(hasFocus);
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewFocusChangedEvent(hasFocus));
            this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.FocusChangedEvent(!hasFocus, hasFocus));
        }
        onCompositionStart() {
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewCompositionStartEvent());
        }
        onCompositionEnd() {
            this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewCompositionEndEvent());
        }
        _captureStableViewport() {
            // We might need to restore the current start view range, so save it (if available)
            // But only if the scroll position is not at the top of the file
            if (this._viewportStart.isValid && this.viewLayout.getCurrentScrollTop() > 0) {
                const previousViewportStartViewPosition = new position_1.Position(this._viewportStart.viewLineNumber, this.getLineMinColumn(this._viewportStart.viewLineNumber));
                const previousViewportStartModelPosition = this.coordinatesConverter.convertViewPositionToModelPosition(previousViewportStartViewPosition);
                return new StableViewport(previousViewportStartModelPosition, this._viewportStart.startLineDelta);
            }
            return new StableViewport(null, 0);
        }
        _onConfigurationChanged(eventsCollector, e) {
            const stableViewport = this._captureStableViewport();
            const options = this._configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const wrappingStrategy = options.get(139 /* EditorOption.wrappingStrategy */);
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const wrappingIndent = options.get(138 /* EditorOption.wrappingIndent */);
            const wordBreak = options.get(129 /* EditorOption.wordBreak */);
            if (this._lines.setWrappingSettings(fontInfo, wrappingStrategy, wrappingInfo.wrappingColumn, wrappingIndent, wordBreak)) {
                eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                this._cursor.onLineMappingChanged(eventsCollector);
                this._decorations.onLineMappingChanged();
                this.viewLayout.onFlushed(this.getLineCount());
                this._updateConfigurationViewLineCount.schedule();
            }
            if (e.hasChanged(91 /* EditorOption.readOnly */)) {
                // Must read again all decorations due to readOnly filtering
                this._decorations.reset();
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
            }
            if (e.hasChanged(98 /* EditorOption.renderValidationDecorations */)) {
                this._decorations.reset();
                eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
            }
            eventsCollector.emitViewEvent(new viewEvents.ViewConfigurationChangedEvent(e));
            this.viewLayout.onConfigurationChanged(e);
            stableViewport.recoverViewportStart(this.coordinatesConverter, this.viewLayout);
            if (cursorCommon_1.CursorConfiguration.shouldRecreate(e)) {
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
            }
        }
        _registerModelEvents() {
            this._register(this.model.onDidChangeContentOrInjectedText((e) => {
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    let hadOtherModelChange = false;
                    let hadModelLineChangeThatChangedLineMapping = false;
                    const changes = (e instanceof textModelEvents.InternalModelContentChangeEvent ? e.rawContentChangedEvent.changes : e.changes);
                    const versionId = (e instanceof textModelEvents.InternalModelContentChangeEvent ? e.rawContentChangedEvent.versionId : null);
                    // Do a first pass to compute line mappings, and a second pass to actually interpret them
                    const lineBreaksComputer = this._lines.createLineBreaksComputer();
                    for (const change of changes) {
                        switch (change.changeType) {
                            case 4 /* textModelEvents.RawContentChangedType.LinesInserted */: {
                                for (let lineIdx = 0; lineIdx < change.detail.length; lineIdx++) {
                                    const line = change.detail[lineIdx];
                                    let injectedText = change.injectedTexts[lineIdx];
                                    if (injectedText) {
                                        injectedText = injectedText.filter(element => (!element.ownerId || element.ownerId === this._editorId));
                                    }
                                    lineBreaksComputer.addRequest(line, injectedText, null);
                                }
                                break;
                            }
                            case 2 /* textModelEvents.RawContentChangedType.LineChanged */: {
                                let injectedText = null;
                                if (change.injectedText) {
                                    injectedText = change.injectedText.filter(element => (!element.ownerId || element.ownerId === this._editorId));
                                }
                                lineBreaksComputer.addRequest(change.detail, injectedText, null);
                                break;
                            }
                        }
                    }
                    const lineBreaks = lineBreaksComputer.finalize();
                    const lineBreakQueue = new arrays_1.ArrayQueue(lineBreaks);
                    for (const change of changes) {
                        switch (change.changeType) {
                            case 1 /* textModelEvents.RawContentChangedType.Flush */: {
                                this._lines.onModelFlushed();
                                eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                                this._decorations.reset();
                                this.viewLayout.onFlushed(this.getLineCount());
                                hadOtherModelChange = true;
                                break;
                            }
                            case 3 /* textModelEvents.RawContentChangedType.LinesDeleted */: {
                                const linesDeletedEvent = this._lines.onModelLinesDeleted(versionId, change.fromLineNumber, change.toLineNumber);
                                if (linesDeletedEvent !== null) {
                                    eventsCollector.emitViewEvent(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 4 /* textModelEvents.RawContentChangedType.LinesInserted */: {
                                const insertedLineBreaks = lineBreakQueue.takeCount(change.detail.length);
                                const linesInsertedEvent = this._lines.onModelLinesInserted(versionId, change.fromLineNumber, change.toLineNumber, insertedLineBreaks);
                                if (linesInsertedEvent !== null) {
                                    eventsCollector.emitViewEvent(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                hadOtherModelChange = true;
                                break;
                            }
                            case 2 /* textModelEvents.RawContentChangedType.LineChanged */: {
                                const changedLineBreakData = lineBreakQueue.dequeue();
                                const [lineMappingChanged, linesChangedEvent, linesInsertedEvent, linesDeletedEvent] = this._lines.onModelLineChanged(versionId, change.lineNumber, changedLineBreakData);
                                hadModelLineChangeThatChangedLineMapping = lineMappingChanged;
                                if (linesChangedEvent) {
                                    eventsCollector.emitViewEvent(linesChangedEvent);
                                }
                                if (linesInsertedEvent) {
                                    eventsCollector.emitViewEvent(linesInsertedEvent);
                                    this.viewLayout.onLinesInserted(linesInsertedEvent.fromLineNumber, linesInsertedEvent.toLineNumber);
                                }
                                if (linesDeletedEvent) {
                                    eventsCollector.emitViewEvent(linesDeletedEvent);
                                    this.viewLayout.onLinesDeleted(linesDeletedEvent.fromLineNumber, linesDeletedEvent.toLineNumber);
                                }
                                break;
                            }
                            case 5 /* textModelEvents.RawContentChangedType.EOLChanged */: {
                                // Nothing to do. The new version will be accepted below
                                break;
                            }
                        }
                    }
                    if (versionId !== null) {
                        this._lines.acceptVersionId(versionId);
                    }
                    this.viewLayout.onHeightMaybeChanged();
                    if (!hadOtherModelChange && hadModelLineChangeThatChangedLineMapping) {
                        eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                        this._cursor.onLineMappingChanged(eventsCollector);
                        this._decorations.onLineMappingChanged();
                    }
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
                // Update the configuration and reset the centered view line
                const viewportStartWasValid = this._viewportStart.isValid;
                this._viewportStart.invalidate();
                this._configuration.setModelLineCount(this.model.getLineCount());
                this._updateConfigurationViewLineCountNow();
                // Recover viewport
                if (!this._hasFocus && this.model.getAttachedEditorCount() >= 2 && viewportStartWasValid) {
                    const modelRange = this.model._getTrackedRange(this._viewportStart.modelTrackedRange);
                    if (modelRange) {
                        const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelRange.getStartPosition());
                        const viewPositionTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
                        this.viewLayout.setScrollPosition({ scrollTop: viewPositionTop + this._viewportStart.startLineDelta }, 1 /* ScrollType.Immediate */);
                    }
                }
                try {
                    const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                    if (e instanceof textModelEvents.InternalModelContentChangeEvent) {
                        eventsCollector.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelContentChangedEvent(e.contentChangedEvent));
                    }
                    this._cursor.onModelContentChanged(eventsCollector, e);
                }
                finally {
                    this._eventDispatcher.endEmitViewEvents();
                }
                this._handleVisibleLinesChanged();
            }));
            this._register(this.model.onDidChangeTokens((e) => {
                const viewRanges = [];
                for (let j = 0, lenJ = e.ranges.length; j < lenJ; j++) {
                    const modelRange = e.ranges[j];
                    const viewStartLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.fromLineNumber, 1)).lineNumber;
                    const viewEndLineNumber = this.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelRange.toLineNumber, this.model.getLineMaxColumn(modelRange.toLineNumber))).lineNumber;
                    viewRanges[j] = {
                        fromLineNumber: viewStartLineNumber,
                        toLineNumber: viewEndLineNumber
                    };
                }
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewTokensChangedEvent(viewRanges));
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelTokensChangedEvent(e));
            }));
            this._register(this.model.onDidChangeLanguageConfiguration((e) => {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewLanguageConfigurationEvent());
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelLanguageConfigurationChangedEvent(e));
            }));
            this._register(this.model.onDidChangeLanguage((e) => {
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelLanguageChangedEvent(e));
            }));
            this._register(this.model.onDidChangeOptions((e) => {
                // A tab size change causes a line mapping changed event => all view parts will repaint OK, no further event needed here
                if (this._lines.setTabSize(this.model.getOptions().tabSize)) {
                    try {
                        const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                        eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                        eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                        this._cursor.onLineMappingChanged(eventsCollector);
                        this._decorations.onLineMappingChanged();
                        this.viewLayout.onFlushed(this.getLineCount());
                    }
                    finally {
                        this._eventDispatcher.endEmitViewEvents();
                    }
                    this._updateConfigurationViewLineCount.schedule();
                }
                this.cursorConfig = new cursorCommon_1.CursorConfiguration(this.model.getLanguageId(), this.model.getOptions(), this._configuration, this.languageConfigurationService);
                this._cursor.updateConfiguration(this.cursorConfig);
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelOptionsChangedEvent(e));
            }));
            this._register(this.model.onDidChangeDecorations((e) => {
                this._decorations.onModelDecorationsChanged();
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewDecorationsChangedEvent(e));
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ModelDecorationsChangedEvent(e));
            }));
        }
        setHiddenAreas(ranges, source) {
            this.hiddenAreasModel.setHiddenAreas(source, ranges);
            const mergedRanges = this.hiddenAreasModel.getMergedRanges();
            if (mergedRanges === this.previousHiddenAreas) {
                return;
            }
            this.previousHiddenAreas = mergedRanges;
            const stableViewport = this._captureStableViewport();
            let lineMappingChanged = false;
            try {
                const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                lineMappingChanged = this._lines.setHiddenAreas(mergedRanges);
                if (lineMappingChanged) {
                    eventsCollector.emitViewEvent(new viewEvents.ViewFlushedEvent());
                    eventsCollector.emitViewEvent(new viewEvents.ViewLineMappingChangedEvent());
                    eventsCollector.emitViewEvent(new viewEvents.ViewDecorationsChangedEvent(null));
                    this._cursor.onLineMappingChanged(eventsCollector);
                    this._decorations.onLineMappingChanged();
                    this.viewLayout.onFlushed(this.getLineCount());
                    this.viewLayout.onHeightMaybeChanged();
                }
                const firstModelLineInViewPort = stableViewport.viewportStartModelPosition?.lineNumber;
                const firstModelLineIsHidden = firstModelLineInViewPort && mergedRanges.some(range => range.startLineNumber <= firstModelLineInViewPort && firstModelLineInViewPort <= range.endLineNumber);
                if (!firstModelLineIsHidden) {
                    stableViewport.recoverViewportStart(this.coordinatesConverter, this.viewLayout);
                }
            }
            finally {
                this._eventDispatcher.endEmitViewEvents();
            }
            this._updateConfigurationViewLineCount.schedule();
            if (lineMappingChanged) {
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.HiddenAreasChangedEvent());
            }
        }
        getVisibleRangesPlusViewportAboveBelow() {
            const layoutInfo = this._configuration.options.get(145 /* EditorOption.layoutInfo */);
            const lineHeight = this._configuration.options.get(67 /* EditorOption.lineHeight */);
            const linesAround = Math.max(20, Math.round(layoutInfo.height / lineHeight));
            const partialData = this.viewLayout.getLinesViewportData();
            const startViewLineNumber = Math.max(1, partialData.completelyVisibleStartLineNumber - linesAround);
            const endViewLineNumber = Math.min(this.getLineCount(), partialData.completelyVisibleEndLineNumber + linesAround);
            return this._toModelVisibleRanges(new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber)));
        }
        getVisibleRanges() {
            const visibleViewRange = this.getCompletelyVisibleViewRange();
            return this._toModelVisibleRanges(visibleViewRange);
        }
        getHiddenAreas() {
            return this._lines.getHiddenAreas();
        }
        _toModelVisibleRanges(visibleViewRange) {
            const visibleRange = this.coordinatesConverter.convertViewRangeToModelRange(visibleViewRange);
            const hiddenAreas = this._lines.getHiddenAreas();
            if (hiddenAreas.length === 0) {
                return [visibleRange];
            }
            const result = [];
            let resultLen = 0;
            let startLineNumber = visibleRange.startLineNumber;
            let startColumn = visibleRange.startColumn;
            const endLineNumber = visibleRange.endLineNumber;
            const endColumn = visibleRange.endColumn;
            for (let i = 0, len = hiddenAreas.length; i < len; i++) {
                const hiddenStartLineNumber = hiddenAreas[i].startLineNumber;
                const hiddenEndLineNumber = hiddenAreas[i].endLineNumber;
                if (hiddenEndLineNumber < startLineNumber) {
                    continue;
                }
                if (hiddenStartLineNumber > endLineNumber) {
                    continue;
                }
                if (startLineNumber < hiddenStartLineNumber) {
                    result[resultLen++] = new range_1.Range(startLineNumber, startColumn, hiddenStartLineNumber - 1, this.model.getLineMaxColumn(hiddenStartLineNumber - 1));
                }
                startLineNumber = hiddenEndLineNumber + 1;
                startColumn = 1;
            }
            if (startLineNumber < endLineNumber || (startLineNumber === endLineNumber && startColumn < endColumn)) {
                result[resultLen++] = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
            }
            return result;
        }
        getCompletelyVisibleViewRange() {
            const partialData = this.viewLayout.getLinesViewportData();
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        getCompletelyVisibleViewRangeAtScrollTop(scrollTop) {
            const partialData = this.viewLayout.getLinesViewportDataAtScrollTop(scrollTop);
            const startViewLineNumber = partialData.completelyVisibleStartLineNumber;
            const endViewLineNumber = partialData.completelyVisibleEndLineNumber;
            return new range_1.Range(startViewLineNumber, this.getLineMinColumn(startViewLineNumber), endViewLineNumber, this.getLineMaxColumn(endViewLineNumber));
        }
        saveState() {
            const compatViewState = this.viewLayout.saveState();
            const scrollTop = compatViewState.scrollTop;
            const firstViewLineNumber = this.viewLayout.getLineNumberAtVerticalOffset(scrollTop);
            const firstPosition = this.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(firstViewLineNumber, this.getLineMinColumn(firstViewLineNumber)));
            const firstPositionDeltaTop = this.viewLayout.getVerticalOffsetForLineNumber(firstViewLineNumber) - scrollTop;
            return {
                scrollLeft: compatViewState.scrollLeft,
                firstPosition: firstPosition,
                firstPositionDeltaTop: firstPositionDeltaTop
            };
        }
        reduceRestoreState(state) {
            if (typeof state.firstPosition === 'undefined') {
                // This is a view state serialized by an older version
                return this._reduceRestoreStateCompatibility(state);
            }
            const modelPosition = this.model.validatePosition(state.firstPosition);
            const viewPosition = this.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            const scrollTop = this.viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber) - state.firstPositionDeltaTop;
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: scrollTop
            };
        }
        _reduceRestoreStateCompatibility(state) {
            return {
                scrollLeft: state.scrollLeft,
                scrollTop: state.scrollTopWithoutViewZones
            };
        }
        getTabSize() {
            return this.model.getOptions().tabSize;
        }
        getLineCount() {
            return this._lines.getViewLineCount();
        }
        /**
         * Gives a hint that a lot of requests are about to come in for these line numbers.
         */
        setViewport(startLineNumber, endLineNumber, centeredLineNumber) {
            this._viewportStart.update(this, startLineNumber);
        }
        getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber) {
            return this._lines.getActiveIndentGuide(lineNumber, minLineNumber, maxLineNumber);
        }
        getLinesIndentGuides(startLineNumber, endLineNumber) {
            return this._lines.getViewLinesIndentGuides(startLineNumber, endLineNumber);
        }
        getBracketGuidesInRangeByLine(startLineNumber, endLineNumber, activePosition, options) {
            return this._lines.getViewLinesBracketGuides(startLineNumber, endLineNumber, activePosition, options);
        }
        getLineContent(lineNumber) {
            return this._lines.getViewLineContent(lineNumber);
        }
        getLineLength(lineNumber) {
            return this._lines.getViewLineLength(lineNumber);
        }
        getLineMinColumn(lineNumber) {
            return this._lines.getViewLineMinColumn(lineNumber);
        }
        getLineMaxColumn(lineNumber) {
            return this._lines.getViewLineMaxColumn(lineNumber);
        }
        getLineFirstNonWhitespaceColumn(lineNumber) {
            const result = strings.firstNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 1;
        }
        getLineLastNonWhitespaceColumn(lineNumber) {
            const result = strings.lastNonWhitespaceIndex(this.getLineContent(lineNumber));
            if (result === -1) {
                return 0;
            }
            return result + 2;
        }
        getMinimapDecorationsInRange(range) {
            return this._decorations.getMinimapDecorationsInRange(range);
        }
        getDecorationsInViewport(visibleRange) {
            return this._decorations.getDecorationsViewportData(visibleRange).decorations;
        }
        getInjectedTextAt(viewPosition) {
            return this._lines.getInjectedTextAt(viewPosition);
        }
        getViewportViewLineRenderingData(visibleRange, lineNumber) {
            const allInlineDecorations = this._decorations.getDecorationsViewportData(visibleRange).inlineDecorations;
            const inlineDecorations = allInlineDecorations[lineNumber - visibleRange.startLineNumber];
            return this._getViewLineRenderingData(lineNumber, inlineDecorations);
        }
        getViewLineRenderingData(lineNumber) {
            const inlineDecorations = this._decorations.getInlineDecorationsOnLine(lineNumber);
            return this._getViewLineRenderingData(lineNumber, inlineDecorations);
        }
        _getViewLineRenderingData(lineNumber, inlineDecorations) {
            const mightContainRTL = this.model.mightContainRTL();
            const mightContainNonBasicASCII = this.model.mightContainNonBasicASCII();
            const tabSize = this.getTabSize();
            const lineData = this._lines.getViewLineData(lineNumber);
            if (lineData.inlineDecorations) {
                inlineDecorations = [
                    ...inlineDecorations,
                    ...lineData.inlineDecorations.map(d => d.toInlineDecoration(lineNumber))
                ];
            }
            return new viewModel_1.ViewLineRenderingData(lineData.minColumn, lineData.maxColumn, lineData.content, lineData.continuesWithWrappedLine, mightContainRTL, mightContainNonBasicASCII, lineData.tokens, inlineDecorations, tabSize, lineData.startVisibleColumn);
        }
        getViewLineData(lineNumber) {
            return this._lines.getViewLineData(lineNumber);
        }
        getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed) {
            const result = this._lines.getViewLinesData(startLineNumber, endLineNumber, needed);
            return new viewModel_1.MinimapLinesRenderingData(this.getTabSize(), result);
        }
        getAllOverviewRulerDecorations(theme) {
            const decorations = this.model.getOverviewRulerDecorations(this._editorId, (0, editorOptions_1.filterValidationDecorations)(this._configuration.options));
            const result = new OverviewRulerDecorations();
            for (const decoration of decorations) {
                const decorationOptions = decoration.options;
                const opts = decorationOptions.overviewRuler;
                if (!opts) {
                    continue;
                }
                const lane = opts.position;
                if (lane === 0) {
                    continue;
                }
                const color = opts.getColor(theme.value);
                const viewStartLineNumber = this.coordinatesConverter.getViewLineNumberOfModelPosition(decoration.range.startLineNumber, decoration.range.startColumn);
                const viewEndLineNumber = this.coordinatesConverter.getViewLineNumberOfModelPosition(decoration.range.endLineNumber, decoration.range.endColumn);
                result.accept(color, decorationOptions.zIndex, viewStartLineNumber, viewEndLineNumber, lane);
            }
            return result.asArray;
        }
        _invalidateDecorationsColorCache() {
            const decorations = this.model.getOverviewRulerDecorations();
            for (const decoration of decorations) {
                const opts1 = decoration.options.overviewRuler;
                opts1?.invalidateCachedColor();
                const opts2 = decoration.options.minimap;
                opts2?.invalidateCachedColor();
            }
        }
        getValueInRange(range, eol) {
            const modelRange = this.coordinatesConverter.convertViewRangeToModelRange(range);
            return this.model.getValueInRange(modelRange, eol);
        }
        getValueLengthInRange(range, eol) {
            const modelRange = this.coordinatesConverter.convertViewRangeToModelRange(range);
            return this.model.getValueLengthInRange(modelRange, eol);
        }
        modifyPosition(position, offset) {
            const modelPosition = this.coordinatesConverter.convertViewPositionToModelPosition(position);
            const resultModelPosition = this.model.modifyPosition(modelPosition, offset);
            return this.coordinatesConverter.convertModelPositionToViewPosition(resultModelPosition);
        }
        deduceModelPositionRelativeToViewPosition(viewAnchorPosition, deltaOffset, lineFeedCnt) {
            const modelAnchor = this.coordinatesConverter.convertViewPositionToModelPosition(viewAnchorPosition);
            if (this.model.getEOL().length === 2) {
                // This model uses CRLF, so the delta must take that into account
                if (deltaOffset < 0) {
                    deltaOffset -= lineFeedCnt;
                }
                else {
                    deltaOffset += lineFeedCnt;
                }
            }
            const modelAnchorOffset = this.model.getOffsetAt(modelAnchor);
            const resultOffset = modelAnchorOffset + deltaOffset;
            return this.model.getPositionAt(resultOffset);
        }
        getPlainTextToCopy(modelRanges, emptySelectionClipboard, forceCRLF) {
            const newLineCharacter = forceCRLF ? '\r\n' : this.model.getEOL();
            modelRanges = modelRanges.slice(0);
            modelRanges.sort(range_1.Range.compareRangesUsingStarts);
            let hasEmptyRange = false;
            let hasNonEmptyRange = false;
            for (const range of modelRanges) {
                if (range.isEmpty()) {
                    hasEmptyRange = true;
                }
                else {
                    hasNonEmptyRange = true;
                }
            }
            if (!hasNonEmptyRange) {
                // all ranges are empty
                if (!emptySelectionClipboard) {
                    return '';
                }
                const modelLineNumbers = modelRanges.map((r) => r.startLineNumber);
                let result = '';
                for (let i = 0; i < modelLineNumbers.length; i++) {
                    if (i > 0 && modelLineNumbers[i - 1] === modelLineNumbers[i]) {
                        continue;
                    }
                    result += this.model.getLineContent(modelLineNumbers[i]) + newLineCharacter;
                }
                return result;
            }
            if (hasEmptyRange && emptySelectionClipboard) {
                // mixed empty selections and non-empty selections
                const result = [];
                let prevModelLineNumber = 0;
                for (const modelRange of modelRanges) {
                    const modelLineNumber = modelRange.startLineNumber;
                    if (modelRange.isEmpty()) {
                        if (modelLineNumber !== prevModelLineNumber) {
                            result.push(this.model.getLineContent(modelLineNumber));
                        }
                    }
                    else {
                        result.push(this.model.getValueInRange(modelRange, forceCRLF ? 2 /* EndOfLinePreference.CRLF */ : 0 /* EndOfLinePreference.TextDefined */));
                    }
                    prevModelLineNumber = modelLineNumber;
                }
                return result.length === 1 ? result[0] : result;
            }
            const result = [];
            for (const modelRange of modelRanges) {
                if (!modelRange.isEmpty()) {
                    result.push(this.model.getValueInRange(modelRange, forceCRLF ? 2 /* EndOfLinePreference.CRLF */ : 0 /* EndOfLinePreference.TextDefined */));
                }
            }
            return result.length === 1 ? result[0] : result;
        }
        getRichTextToCopy(modelRanges, emptySelectionClipboard) {
            const languageId = this.model.getLanguageId();
            if (languageId === modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
                return null;
            }
            if (modelRanges.length !== 1) {
                // no multiple selection support at this time
                return null;
            }
            let range = modelRanges[0];
            if (range.isEmpty()) {
                if (!emptySelectionClipboard) {
                    // nothing to copy
                    return null;
                }
                const lineNumber = range.startLineNumber;
                range = new range_1.Range(lineNumber, this.model.getLineMinColumn(lineNumber), lineNumber, this.model.getLineMaxColumn(lineNumber));
            }
            const fontInfo = this._configuration.options.get(50 /* EditorOption.fontInfo */);
            const colorMap = this._getColorMap();
            const hasBadChars = (/[:;\\\/<>]/.test(fontInfo.fontFamily));
            const useDefaultFontFamily = (hasBadChars || fontInfo.fontFamily === editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily);
            let fontFamily;
            if (useDefaultFontFamily) {
                fontFamily = editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            }
            else {
                fontFamily = fontInfo.fontFamily;
                fontFamily = fontFamily.replace(/"/g, '\'');
                const hasQuotesOrIsList = /[,']/.test(fontFamily);
                if (!hasQuotesOrIsList) {
                    const needsQuotes = /[+ ]/.test(fontFamily);
                    if (needsQuotes) {
                        fontFamily = `'${fontFamily}'`;
                    }
                }
                fontFamily = `${fontFamily}, ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`;
            }
            return {
                mode: languageId,
                html: (`<div style="`
                    + `color: ${colorMap[1 /* ColorId.DefaultForeground */]};`
                    + `background-color: ${colorMap[2 /* ColorId.DefaultBackground */]};`
                    + `font-family: ${fontFamily};`
                    + `font-weight: ${fontInfo.fontWeight};`
                    + `font-size: ${fontInfo.fontSize}px;`
                    + `line-height: ${fontInfo.lineHeight}px;`
                    + `white-space: pre;`
                    + `">`
                    + this._getHTMLToCopy(range, colorMap)
                    + '</div>')
            };
        }
        _getHTMLToCopy(modelRange, colorMap) {
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = this.getTabSize();
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = this.model.tokenization.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += (0, textToHtmlTokenizer_1.tokenizeLineToHTML)(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return result;
        }
        _getColorMap() {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
        //#region cursor operations
        getPrimaryCursorState() {
            return this._cursor.getPrimaryCursorState();
        }
        getLastAddedCursorIndex() {
            return this._cursor.getLastAddedCursorIndex();
        }
        getCursorStates() {
            return this._cursor.getCursorStates();
        }
        setCursorStates(source, reason, states) {
            return this._withViewEventsCollector(eventsCollector => this._cursor.setStates(eventsCollector, source, reason, states));
        }
        getCursorColumnSelectData() {
            return this._cursor.getCursorColumnSelectData();
        }
        getCursorAutoClosedCharacters() {
            return this._cursor.getAutoClosedCharacters();
        }
        setCursorColumnSelectData(columnSelectData) {
            this._cursor.setCursorColumnSelectData(columnSelectData);
        }
        getPrevEditOperationType() {
            return this._cursor.getPrevEditOperationType();
        }
        setPrevEditOperationType(type) {
            this._cursor.setPrevEditOperationType(type);
        }
        getSelection() {
            return this._cursor.getSelection();
        }
        getSelections() {
            return this._cursor.getSelections();
        }
        getPosition() {
            return this._cursor.getPrimaryCursorState().modelState.position;
        }
        setSelections(source, selections, reason = 0 /* CursorChangeReason.NotSet */) {
            this._withViewEventsCollector(eventsCollector => this._cursor.setSelections(eventsCollector, source, selections, reason));
        }
        saveCursorState() {
            return this._cursor.saveState();
        }
        restoreCursorState(states) {
            this._withViewEventsCollector(eventsCollector => this._cursor.restoreState(eventsCollector, states));
        }
        _executeCursorEdit(callback) {
            if (this._cursor.context.cursorConfig.readOnly) {
                // we cannot edit when read only...
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ReadOnlyEditAttemptEvent());
                return;
            }
            this._withViewEventsCollector(callback);
        }
        executeEdits(source, edits, cursorStateComputer) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeEdits(eventsCollector, source, edits, cursorStateComputer));
        }
        startComposition() {
            this._executeCursorEdit(eventsCollector => this._cursor.startComposition(eventsCollector));
        }
        endComposition(source) {
            this._executeCursorEdit(eventsCollector => this._cursor.endComposition(eventsCollector, source));
        }
        type(text, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.type(eventsCollector, text, source));
        }
        compositionType(text, replacePrevCharCnt, replaceNextCharCnt, positionDelta, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.compositionType(eventsCollector, text, replacePrevCharCnt, replaceNextCharCnt, positionDelta, source));
        }
        paste(text, pasteOnNewLine, multicursorText, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.paste(eventsCollector, text, pasteOnNewLine, multicursorText, source));
        }
        cut(source) {
            this._executeCursorEdit(eventsCollector => this._cursor.cut(eventsCollector, source));
        }
        executeCommand(command, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeCommand(eventsCollector, command, source));
        }
        executeCommands(commands, source) {
            this._executeCursorEdit(eventsCollector => this._cursor.executeCommands(eventsCollector, commands, source));
        }
        revealAllCursors(source, revealHorizontal, minimalReveal = false) {
            this._withViewEventsCollector(eventsCollector => this._cursor.revealAll(eventsCollector, source, minimalReveal, 0 /* viewEvents.VerticalRevealType.Simple */, revealHorizontal, 0 /* ScrollType.Smooth */));
        }
        revealPrimaryCursor(source, revealHorizontal, minimalReveal = false) {
            this._withViewEventsCollector(eventsCollector => this._cursor.revealPrimary(eventsCollector, source, minimalReveal, 0 /* viewEvents.VerticalRevealType.Simple */, revealHorizontal, 0 /* ScrollType.Smooth */));
        }
        revealTopMostCursor(source) {
            const viewPosition = this._cursor.getTopMostViewPosition();
            const viewRange = new range_1.Range(viewPosition.lineNumber, viewPosition.column, viewPosition.lineNumber, viewPosition.column);
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, false, viewRange, null, 0 /* viewEvents.VerticalRevealType.Simple */, true, 0 /* ScrollType.Smooth */)));
        }
        revealBottomMostCursor(source) {
            const viewPosition = this._cursor.getBottomMostViewPosition();
            const viewRange = new range_1.Range(viewPosition.lineNumber, viewPosition.column, viewPosition.lineNumber, viewPosition.column);
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, false, viewRange, null, 0 /* viewEvents.VerticalRevealType.Simple */, true, 0 /* ScrollType.Smooth */)));
        }
        revealRange(source, revealHorizontal, viewRange, verticalType, scrollType) {
            this._withViewEventsCollector(eventsCollector => eventsCollector.emitViewEvent(new viewEvents.ViewRevealRangeRequestEvent(source, false, viewRange, null, verticalType, revealHorizontal, scrollType)));
        }
        //#endregion
        //#region viewLayout
        changeWhitespace(callback) {
            const hadAChange = this.viewLayout.changeWhitespace(callback);
            if (hadAChange) {
                this._eventDispatcher.emitSingleViewEvent(new viewEvents.ViewZonesChangedEvent());
                this._eventDispatcher.emitOutgoingEvent(new viewModelEventDispatcher_1.ViewZonesChangedEvent());
            }
        }
        //#endregion
        _withViewEventsCollector(callback) {
            try {
                const eventsCollector = this._eventDispatcher.beginEmitViewEvents();
                return callback(eventsCollector);
            }
            finally {
                this._eventDispatcher.endEmitViewEvents();
            }
        }
        normalizePosition(position, affinity) {
            return this._lines.normalizePosition(position, affinity);
        }
        /**
         * Gets the column at which indentation stops at a given line.
         * @internal
        */
        getLineIndentColumn(lineNumber) {
            return this._lines.getLineIndentColumn(lineNumber);
        }
    }
    exports.ViewModel = ViewModel;
    class ViewportStart {
        static create(model) {
            const viewportStartLineTrackedRange = model._setTrackedRange(null, new range_1.Range(1, 1, 1, 1), 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */);
            return new ViewportStart(model, 1, false, viewportStartLineTrackedRange, 0);
        }
        get viewLineNumber() {
            return this._viewLineNumber;
        }
        get isValid() {
            return this._isValid;
        }
        get modelTrackedRange() {
            return this._modelTrackedRange;
        }
        get startLineDelta() {
            return this._startLineDelta;
        }
        constructor(_model, _viewLineNumber, _isValid, _modelTrackedRange, _startLineDelta) {
            this._model = _model;
            this._viewLineNumber = _viewLineNumber;
            this._isValid = _isValid;
            this._modelTrackedRange = _modelTrackedRange;
            this._startLineDelta = _startLineDelta;
        }
        dispose() {
            this._model._setTrackedRange(this._modelTrackedRange, null, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */);
        }
        update(viewModel, startLineNumber) {
            const position = viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(startLineNumber, viewModel.getLineMinColumn(startLineNumber)));
            const viewportStartLineTrackedRange = viewModel.model._setTrackedRange(this._modelTrackedRange, new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column), 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */);
            const viewportStartLineTop = viewModel.viewLayout.getVerticalOffsetForLineNumber(startLineNumber);
            const scrollTop = viewModel.viewLayout.getCurrentScrollTop();
            this._viewLineNumber = startLineNumber;
            this._isValid = true;
            this._modelTrackedRange = viewportStartLineTrackedRange;
            this._startLineDelta = scrollTop - viewportStartLineTop;
        }
        invalidate() {
            this._isValid = false;
        }
    }
    class OverviewRulerDecorations {
        constructor() {
            this._asMap = Object.create(null);
            this.asArray = [];
        }
        accept(color, zIndex, startLineNumber, endLineNumber, lane) {
            const prevGroup = this._asMap[color];
            if (prevGroup) {
                const prevData = prevGroup.data;
                const prevLane = prevData[prevData.length - 3];
                const prevEndLineNumber = prevData[prevData.length - 1];
                if (prevLane === lane && prevEndLineNumber + 1 >= startLineNumber) {
                    // merge into prev
                    if (endLineNumber > prevEndLineNumber) {
                        prevData[prevData.length - 1] = endLineNumber;
                    }
                    return;
                }
                // push
                prevData.push(lane, startLineNumber, endLineNumber);
            }
            else {
                const group = new viewModel_1.OverviewRulerDecorationsGroup(color, zIndex, [lane, startLineNumber, endLineNumber]);
                this._asMap[color] = group;
                this.asArray.push(group);
            }
        }
    }
    class HiddenAreasModel {
        constructor() {
            this.hiddenAreas = new Map();
            this.shouldRecompute = false;
            this.ranges = [];
        }
        setHiddenAreas(source, ranges) {
            const existing = this.hiddenAreas.get(source);
            if (existing && rangeArraysEqual(existing, ranges)) {
                return;
            }
            this.hiddenAreas.set(source, ranges);
            this.shouldRecompute = true;
        }
        /**
         * The returned array is immutable.
        */
        getMergedRanges() {
            if (!this.shouldRecompute) {
                return this.ranges;
            }
            this.shouldRecompute = false;
            const newRanges = Array.from(this.hiddenAreas.values()).reduce((r, hiddenAreas) => mergeLineRangeArray(r, hiddenAreas), []);
            if (rangeArraysEqual(this.ranges, newRanges)) {
                return this.ranges;
            }
            this.ranges = newRanges;
            return this.ranges;
        }
    }
    function mergeLineRangeArray(arr1, arr2) {
        const result = [];
        let i = 0;
        let j = 0;
        while (i < arr1.length && j < arr2.length) {
            const item1 = arr1[i];
            const item2 = arr2[j];
            if (item1.endLineNumber < item2.startLineNumber - 1) {
                result.push(arr1[i++]);
            }
            else if (item2.endLineNumber < item1.startLineNumber - 1) {
                result.push(arr2[j++]);
            }
            else {
                const startLineNumber = Math.min(item1.startLineNumber, item2.startLineNumber);
                const endLineNumber = Math.max(item1.endLineNumber, item2.endLineNumber);
                result.push(new range_1.Range(startLineNumber, 1, endLineNumber, 1));
                i++;
                j++;
            }
        }
        while (i < arr1.length) {
            result.push(arr1[i++]);
        }
        while (j < arr2.length) {
            result.push(arr2[j++]);
        }
        return result;
    }
    function rangeArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }
        for (let i = 0; i < arr1.length; i++) {
            if (!arr1[i].equalsRange(arr2[i])) {
                return false;
            }
        }
        return true;
    }
    /**
     * Maintain a stable viewport by trying to keep the first line in the viewport constant.
     */
    class StableViewport {
        constructor(viewportStartModelPosition, startLineDelta) {
            this.viewportStartModelPosition = viewportStartModelPosition;
            this.startLineDelta = startLineDelta;
        }
        recoverViewportStart(coordinatesConverter, viewLayout) {
            if (!this.viewportStartModelPosition) {
                return;
            }
            const viewPosition = coordinatesConverter.convertModelPositionToViewPosition(this.viewportStartModelPosition);
            const viewPositionTop = viewLayout.getVerticalOffsetForLineNumber(viewPosition.lineNumber);
            viewLayout.setScrollPosition({ scrollTop: viewPositionTop + this.startLineDelta }, 1 /* ScrollType.Immediate */);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld01vZGVsSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWwvdmlld01vZGVsSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3Q2hHLE1BQU0sNkJBQTZCLEdBQUcsSUFBSSxDQUFDO0lBRTNDLE1BQWEsU0FBVSxTQUFRLHNCQUFVO1FBa0J4QyxZQUNDLFFBQWdCLEVBQ2hCLGFBQW1DLEVBQ25DLEtBQWlCLEVBQ2pCLDRCQUF3RCxFQUN4RCxrQ0FBOEQsRUFDOUQsNEJBQW1FLEVBQ2xELDRCQUEyRCxFQUMzRCxhQUE0QixFQUM1QixhQUE0QjtZQUU3QyxLQUFLLEVBQUUsQ0FBQztZQUpTLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFDM0Qsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDNUIsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFrWjdCLHFCQUFnQixHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztZQUNuRCx3QkFBbUIsR0FBcUIsRUFBRSxDQUFDO1lBL1lsRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQ3ZELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztZQUM3QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksa0NBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDekosSUFBSSxDQUFDLGlDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0NBQW9DLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BJLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLHVDQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9DLElBQUksNkJBQTZCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLENBQUM7Z0JBRTdFLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSw0Q0FBMkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFM0QsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO2dCQUM1QyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxnQ0FBdUIsQ0FBQztnQkFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsR0FBRyx5Q0FBK0IsQ0FBQztnQkFDcEUsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcscUNBQTJCLENBQUM7Z0JBQzVELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLHVDQUE2QixDQUFDO2dCQUNoRSxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxrQ0FBd0IsQ0FBQztnQkFFdEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGlEQUFnQyxDQUNqRCxJQUFJLENBQUMsU0FBUyxFQUNkLElBQUksQ0FBQyxLQUFLLEVBQ1YsNEJBQTRCLEVBQzVCLGtDQUFrQyxFQUNsQyxRQUFRLEVBQ1IsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLEVBQy9CLGdCQUFnQixFQUNoQixZQUFZLENBQUMsY0FBYyxFQUMzQixjQUFjLEVBQ2QsU0FBUyxDQUNULENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUVyRSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwwQkFBaUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUVoSCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx1QkFBVSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLDRCQUE0QixDQUFDLENBQUMsQ0FBQztZQUV6SCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hELElBQUksQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQ3hCLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUNuQyxDQUFDO2dCQUNELElBQUksQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2xDLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLElBQUksVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLDZDQUFrQixDQUM3RCxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsWUFBWSxFQUNwRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsU0FBUyxDQUN4RCxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLDJDQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFdEksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFFNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUN4RCxJQUFJLENBQUM7b0JBQ0osTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQ3BFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELENBQUM7d0JBQVMsQ0FBQztvQkFDVixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDM0MsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLHFEQUF5QixDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3ZFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLFVBQVUsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUM7WUFDMUYsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNqRSxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLElBQUksVUFBVSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDeEYsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxDQUFDO1FBQzdDLENBQUM7UUFFZSxPQUFPO1lBQ3RCLHNFQUFzRTtZQUN0RSwyRUFBMkU7WUFDM0UsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBRU0sd0JBQXdCO1lBQzlCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQy9DLENBQUM7UUFFTSxtQkFBbUIsQ0FBQyxZQUE4QjtZQUN4RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVNLHNCQUFzQixDQUFDLFlBQThCO1lBQzNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRU8sb0NBQW9DO1lBQzNDLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVPLHFCQUFxQjtZQUM1QixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUNqRSxNQUFNLGdCQUFnQixHQUFHLElBQUksYUFBSyxDQUNqQyxpQkFBaUIsQ0FBQyxlQUFlLEVBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsRUFDeEQsaUJBQWlCLENBQUMsYUFBYSxFQUMvQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLENBQ3RELENBQUM7WUFDRixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hFLE9BQU8sa0JBQWtCLENBQUM7UUFDM0IsQ0FBQztRQUVNLHNCQUFzQjtZQUM1QixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3hELElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFTywwQkFBMEI7WUFDakMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUN4RCxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRU0sV0FBVyxDQUFDLFFBQWlCO1lBQ25DLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzFGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLDRDQUFpQixDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckYsQ0FBQztRQUVNLGtCQUFrQjtZQUN4QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxVQUFVLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZGLENBQUM7UUFFTSxnQkFBZ0I7WUFDdEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLElBQUksVUFBVSxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBRU8sc0JBQXNCO1lBQzdCLG1GQUFtRjtZQUNuRixnRUFBZ0U7WUFDaEUsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzlFLE1BQU0saUNBQWlDLEdBQUcsSUFBSSxtQkFBUSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RKLE1BQU0sa0NBQWtDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7Z0JBQzNJLE9BQU8sSUFBSSxjQUFjLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNuRyxDQUFDO1lBQ0QsT0FBTyxJQUFJLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVPLHVCQUF1QixDQUFDLGVBQXlDLEVBQUUsQ0FBNEI7WUFDdEcsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDckQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUM7WUFDNUMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUM7WUFDcEQsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsR0FBRyx5Q0FBK0IsQ0FBQztZQUNwRSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxxQ0FBMkIsQ0FBQztZQUM1RCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsR0FBRyx1Q0FBNkIsQ0FBQztZQUNoRSxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxrQ0FBd0IsQ0FBQztZQUV0RCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pILGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRSxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLDJCQUEyQixFQUFFLENBQUMsQ0FBQztnQkFDNUUsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNoRixJQUFJLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUUvQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkQsQ0FBQztZQUVELElBQUksQ0FBQyxDQUFDLFVBQVUsZ0NBQXVCLEVBQUUsQ0FBQztnQkFDekMsNERBQTREO2dCQUM1RCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMxQixlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUVELElBQUksQ0FBQyxDQUFDLFVBQVUsbURBQTBDLEVBQUUsQ0FBQztnQkFDNUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7WUFFRCxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUVoRixJQUFJLGtDQUFtQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksa0NBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7Z0JBQ3pKLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3JELENBQUM7UUFDRixDQUFDO1FBRU8sb0JBQW9CO1lBRTNCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNoRSxJQUFJLENBQUM7b0JBQ0osTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBRXBFLElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDO29CQUNoQyxJQUFJLHdDQUF3QyxHQUFHLEtBQUssQ0FBQztvQkFFckQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLFlBQVksZUFBZSxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzlILE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxZQUFZLGVBQWUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRTdILHlGQUF5RjtvQkFDekYsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7b0JBQ2xFLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7d0JBQzlCLFFBQVEsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDOzRCQUMzQixnRUFBd0QsQ0FBQyxDQUFDLENBQUM7Z0NBQzFELEtBQUssSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDO29DQUNqRSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29DQUNwQyxJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29DQUNqRCxJQUFJLFlBQVksRUFBRSxDQUFDO3dDQUNsQixZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0NBQ3pHLENBQUM7b0NBQ0Qsa0JBQWtCLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0NBQ3pELENBQUM7Z0NBQ0QsTUFBTTs0QkFDUCxDQUFDOzRCQUNELDhEQUFzRCxDQUFDLENBQUMsQ0FBQztnQ0FDeEQsSUFBSSxZQUFZLEdBQThDLElBQUksQ0FBQztnQ0FDbkUsSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7b0NBQ3pCLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0NBQ2hILENBQUM7Z0NBQ0Qsa0JBQWtCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO2dDQUNqRSxNQUFNOzRCQUNQLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUNELE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNqRCxNQUFNLGNBQWMsR0FBRyxJQUFJLG1CQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBRWxELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7d0JBQzlCLFFBQVEsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDOzRCQUMzQix3REFBZ0QsQ0FBQyxDQUFDLENBQUM7Z0NBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7Z0NBQzdCLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO2dDQUNqRSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO2dDQUMxQixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQ0FDL0MsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO2dDQUMzQixNQUFNOzRCQUNQLENBQUM7NEJBQ0QsK0RBQXVELENBQUMsQ0FBQyxDQUFDO2dDQUN6RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dDQUNqSCxJQUFJLGlCQUFpQixLQUFLLElBQUksRUFBRSxDQUFDO29DQUNoQyxlQUFlLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7b0NBQ2pELElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQ0FDbEcsQ0FBQztnQ0FDRCxtQkFBbUIsR0FBRyxJQUFJLENBQUM7Z0NBQzNCLE1BQU07NEJBQ1AsQ0FBQzs0QkFDRCxnRUFBd0QsQ0FBQyxDQUFDLENBQUM7Z0NBQzFELE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dDQUMxRSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2dDQUN2SSxJQUFJLGtCQUFrQixLQUFLLElBQUksRUFBRSxDQUFDO29DQUNqQyxlQUFlLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0NBQ2xELElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQ0FDckcsQ0FBQztnQ0FDRCxtQkFBbUIsR0FBRyxJQUFJLENBQUM7Z0NBQzNCLE1BQU07NEJBQ1AsQ0FBQzs0QkFDRCw4REFBc0QsQ0FBQyxDQUFDLENBQUM7Z0NBQ3hELE1BQU0sb0JBQW9CLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRyxDQUFDO2dDQUN2RCxNQUFNLENBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLENBQUMsR0FDbkYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2dDQUNwRix3Q0FBd0MsR0FBRyxrQkFBa0IsQ0FBQztnQ0FDOUQsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29DQUN2QixlQUFlLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0NBQ2xELENBQUM7Z0NBQ0QsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO29DQUN4QixlQUFlLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0NBQ2xELElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQ0FDckcsQ0FBQztnQ0FDRCxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0NBQ3ZCLGVBQWUsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQ0FDakQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dDQUNsRyxDQUFDO2dDQUNELE1BQU07NEJBQ1AsQ0FBQzs0QkFDRCw2REFBcUQsQ0FBQyxDQUFDLENBQUM7Z0NBQ3ZELHdEQUF3RDtnQ0FDeEQsTUFBTTs0QkFDUCxDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3hDLENBQUM7b0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO29CQUV2QyxJQUFJLENBQUMsbUJBQW1CLElBQUksd0NBQXdDLEVBQUUsQ0FBQzt3QkFDdEUsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQywyQkFBMkIsRUFBRSxDQUFDLENBQUM7d0JBQzVFLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDaEYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDbkQsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO29CQUMxQyxDQUFDO2dCQUNGLENBQUM7d0JBQVMsQ0FBQztvQkFDVixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDM0MsQ0FBQztnQkFFRCw0REFBNEQ7Z0JBQzVELE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUM7Z0JBQzFELElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRSxJQUFJLENBQUMsb0NBQW9DLEVBQUUsQ0FBQztnQkFFNUMsbUJBQW1CO2dCQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxJQUFJLHFCQUFxQixFQUFFLENBQUM7b0JBQzFGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO29CQUN0RixJQUFJLFVBQVUsRUFBRSxDQUFDO3dCQUNoQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsVUFBVSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQzt3QkFDakgsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ2hHLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsRUFBRSxTQUFTLEVBQUUsZUFBZSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLCtCQUF1QixDQUFDO29CQUM5SCxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUNKLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUNwRSxJQUFJLENBQUMsWUFBWSxlQUFlLENBQUMsK0JBQStCLEVBQUUsQ0FBQzt3QkFDbEUsZUFBZSxDQUFDLGlCQUFpQixDQUFDLElBQUksbURBQXdCLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztvQkFDeEYsQ0FBQztvQkFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEQsQ0FBQzt3QkFBUyxDQUFDO29CQUNWLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUMzQyxDQUFDO2dCQUVELElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDakQsTUFBTSxVQUFVLEdBQXVELEVBQUUsQ0FBQztnQkFDMUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDdkQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDL0IsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsSUFBSSxtQkFBUSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7b0JBQ2hKLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLElBQUksbUJBQVEsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7b0JBQy9MLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRzt3QkFDZixjQUFjLEVBQUUsbUJBQW1CO3dCQUNuQyxZQUFZLEVBQUUsaUJBQWlCO3FCQUMvQixDQUFDO2dCQUNILENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLElBQUksVUFBVSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQzdGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGtEQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNoRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxVQUFVLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksa0NBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7Z0JBQ3pKLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxpRUFBc0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDbkQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLGtDQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUN6SixJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLElBQUksb0RBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2xELHdIQUF3SDtnQkFDeEgsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQzdELElBQUksQ0FBQzt3QkFDSixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzt3QkFDcEUsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7d0JBQ2pFLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDO3dCQUM1RSxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLENBQUM7d0JBQ25ELElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzt3QkFDekMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7b0JBQ2hELENBQUM7NEJBQVMsQ0FBQzt3QkFDVixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDM0MsQ0FBQztvQkFDRCxJQUFJLENBQUMsaUNBQWlDLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25ELENBQUM7Z0JBRUQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLGtDQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO2dCQUN6SixJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFcEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLElBQUksbURBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3RELElBQUksQ0FBQyxZQUFZLENBQUMseUJBQXlCLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLElBQUksVUFBVSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLHVEQUE0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFLTSxjQUFjLENBQUMsTUFBZSxFQUFFLE1BQWdCO1lBQ3RELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM3RCxJQUFJLFlBQVksS0FBSyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDL0MsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDO1lBRXhDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBRXJELElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDO1lBQy9CLElBQUksQ0FBQztnQkFDSixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDcEUsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzlELElBQUksa0JBQWtCLEVBQUUsQ0FBQztvQkFDeEIsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7b0JBQ2pFLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDO29CQUM1RSxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ25ELElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztvQkFDekMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7b0JBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDeEMsQ0FBQztnQkFFRCxNQUFNLHdCQUF3QixHQUFHLGNBQWMsQ0FBQywwQkFBMEIsRUFBRSxVQUFVLENBQUM7Z0JBQ3ZGLE1BQU0sc0JBQXNCLEdBQUcsd0JBQXdCLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQUksd0JBQXdCLElBQUksd0JBQXdCLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM1TCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztvQkFDN0IsY0FBYyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2pGLENBQUM7WUFDRixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDM0MsQ0FBQztZQUNELElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUVsRCxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGtEQUF1QixFQUFFLENBQUMsQ0FBQztZQUN4RSxDQUFDO1FBQ0YsQ0FBQztRQUVNLHNDQUFzQztZQUM1QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQzVFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsa0NBQXlCLENBQUM7WUFDNUUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDN0UsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzNELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLGdDQUFnQyxHQUFHLFdBQVcsQ0FBQyxDQUFDO1lBQ3BHLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEVBQUUsV0FBVyxDQUFDLDhCQUE4QixHQUFHLFdBQVcsQ0FBQyxDQUFDO1lBRWxILE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksYUFBSyxDQUMxQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsRUFDL0QsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLENBQzNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxnQkFBZ0I7WUFDdEIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztZQUM5RCxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFTSxjQUFjO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBRU8scUJBQXFCLENBQUMsZ0JBQXVCO1lBQ3BELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyw0QkFBNEIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFakQsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM5QixPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdkIsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFZLEVBQUUsQ0FBQztZQUMzQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbEIsSUFBSSxlQUFlLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBQztZQUNuRCxJQUFJLFdBQVcsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDO1lBQzNDLE1BQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUM7WUFDakQsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQztZQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3hELE1BQU0scUJBQXFCLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztnQkFDN0QsTUFBTSxtQkFBbUIsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO2dCQUV6RCxJQUFJLG1CQUFtQixHQUFHLGVBQWUsRUFBRSxDQUFDO29CQUMzQyxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxxQkFBcUIsR0FBRyxhQUFhLEVBQUUsQ0FBQztvQkFDM0MsU0FBUztnQkFDVixDQUFDO2dCQUVELElBQUksZUFBZSxHQUFHLHFCQUFxQixFQUFFLENBQUM7b0JBQzdDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksYUFBSyxDQUM5QixlQUFlLEVBQUUsV0FBVyxFQUM1QixxQkFBcUIsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsR0FBRyxDQUFDLENBQUMsQ0FDakYsQ0FBQztnQkFDSCxDQUFDO2dCQUNELGVBQWUsR0FBRyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7Z0JBQzFDLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFDakIsQ0FBQztZQUVELElBQUksZUFBZSxHQUFHLGFBQWEsSUFBSSxDQUFDLGVBQWUsS0FBSyxhQUFhLElBQUksV0FBVyxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksYUFBSyxDQUM5QixlQUFlLEVBQUUsV0FBVyxFQUM1QixhQUFhLEVBQUUsU0FBUyxDQUN4QixDQUFDO1lBQ0gsQ0FBQztZQUVELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVNLDZCQUE2QjtZQUNuQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDM0QsTUFBTSxtQkFBbUIsR0FBRyxXQUFXLENBQUMsZ0NBQWdDLENBQUM7WUFDekUsTUFBTSxpQkFBaUIsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUM7WUFFckUsT0FBTyxJQUFJLGFBQUssQ0FDZixtQkFBbUIsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsRUFDL0QsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLENBQzNELENBQUM7UUFDSCxDQUFDO1FBRU0sd0NBQXdDLENBQUMsU0FBaUI7WUFDaEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQywrQkFBK0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRSxNQUFNLG1CQUFtQixHQUFHLFdBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQztZQUN6RSxNQUFNLGlCQUFpQixHQUFHLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQztZQUVyRSxPQUFPLElBQUksYUFBSyxDQUNmLG1CQUFtQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxFQUMvRCxpQkFBaUIsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FDM0QsQ0FBQztRQUNILENBQUM7UUFFTSxTQUFTO1lBQ2YsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUVwRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsU0FBUyxDQUFDO1lBQzVDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyw2QkFBNkIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsSUFBSSxtQkFBUSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsSyxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsOEJBQThCLENBQUMsbUJBQW1CLENBQUMsR0FBRyxTQUFTLENBQUM7WUFFOUcsT0FBTztnQkFDTixVQUFVLEVBQUUsZUFBZSxDQUFDLFVBQVU7Z0JBQ3RDLGFBQWEsRUFBRSxhQUFhO2dCQUM1QixxQkFBcUIsRUFBRSxxQkFBcUI7YUFDNUMsQ0FBQztRQUNILENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxLQUFpQjtZQUMxQyxJQUFJLE9BQU8sS0FBSyxDQUFDLGFBQWEsS0FBSyxXQUFXLEVBQUUsQ0FBQztnQkFDaEQsc0RBQXNEO2dCQUN0RCxPQUFPLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDdkUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2pHLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsOEJBQThCLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQztZQUN4SCxPQUFPO2dCQUNOLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsU0FBUyxFQUFFLFNBQVM7YUFDcEIsQ0FBQztRQUNILENBQUM7UUFFTyxnQ0FBZ0MsQ0FBQyxLQUFpQjtZQUN6RCxPQUFPO2dCQUNOLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsU0FBUyxFQUFFLEtBQUssQ0FBQyx5QkFBMEI7YUFDM0MsQ0FBQztRQUNILENBQUM7UUFFTyxVQUFVO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDeEMsQ0FBQztRQUVNLFlBQVk7WUFDbEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDdkMsQ0FBQztRQUVEOztXQUVHO1FBQ0ksV0FBVyxDQUFDLGVBQXVCLEVBQUUsYUFBcUIsRUFBRSxrQkFBMEI7WUFDNUYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxVQUFrQixFQUFFLGFBQXFCLEVBQUUsYUFBcUI7WUFDM0YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUVNLG9CQUFvQixDQUFDLGVBQXVCLEVBQUUsYUFBcUI7WUFDekUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRU0sNkJBQTZCLENBQUMsZUFBdUIsRUFBRSxhQUFxQixFQUFFLGNBQWdDLEVBQUUsT0FBNEI7WUFDbEosT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLHlCQUF5QixDQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZHLENBQUM7UUFFTSxjQUFjLENBQUMsVUFBa0I7WUFDdkMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFTSxhQUFhLENBQUMsVUFBa0I7WUFDdEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxVQUFrQjtZQUN6QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVNLGdCQUFnQixDQUFDLFVBQWtCO1lBQ3pDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRU0sK0JBQStCLENBQUMsVUFBa0I7WUFDeEQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNoRixJQUFJLE1BQU0sS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNuQixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFDRCxPQUFPLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVNLDhCQUE4QixDQUFDLFVBQWtCO1lBQ3ZELE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDL0UsSUFBSSxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBQ0QsT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLENBQUM7UUFFTSw0QkFBNEIsQ0FBQyxLQUFZO1lBQy9DLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRU0sd0JBQXdCLENBQUMsWUFBbUI7WUFDbEQsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLDBCQUEwQixDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUMvRSxDQUFDO1FBRU0saUJBQWlCLENBQUMsWUFBc0I7WUFDOUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFTSxnQ0FBZ0MsQ0FBQyxZQUFtQixFQUFFLFVBQWtCO1lBQzlFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQztZQUMxRyxNQUFNLGlCQUFpQixHQUFHLG9CQUFvQixDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDMUYsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVNLHdCQUF3QixDQUFDLFVBQWtCO1lBQ2pELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQywwQkFBMEIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRixPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRU8seUJBQXlCLENBQUMsVUFBa0IsRUFBRSxpQkFBcUM7WUFDMUYsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNyRCxNQUFNLHlCQUF5QixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUN6RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekQsSUFBSSxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDaEMsaUJBQWlCLEdBQUc7b0JBQ25CLEdBQUcsaUJBQWlCO29CQUNwQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDckMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUNoQztpQkFDRCxDQUFDO1lBQ0gsQ0FBQztZQUVELE9BQU8sSUFBSSxpQ0FBcUIsQ0FDL0IsUUFBUSxDQUFDLFNBQVMsRUFDbEIsUUFBUSxDQUFDLFNBQVMsRUFDbEIsUUFBUSxDQUFDLE9BQU8sRUFDaEIsUUFBUSxDQUFDLHdCQUF3QixFQUNqQyxlQUFlLEVBQ2YseUJBQXlCLEVBQ3pCLFFBQVEsQ0FBQyxNQUFNLEVBQ2YsaUJBQWlCLEVBQ2pCLE9BQU8sRUFDUCxRQUFRLENBQUMsa0JBQWtCLENBQzNCLENBQUM7UUFDSCxDQUFDO1FBRU0sZUFBZSxDQUFDLFVBQWtCO1lBQ3hDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVNLDRCQUE0QixDQUFDLGVBQXVCLEVBQUUsYUFBcUIsRUFBRSxNQUFpQjtZQUNwRyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEYsT0FBTyxJQUFJLHFDQUF5QixDQUNuQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQ2pCLE1BQU0sQ0FDTixDQUFDO1FBQ0gsQ0FBQztRQUVNLDhCQUE4QixDQUFDLEtBQWtCO1lBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFBLDJDQUEyQixFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNySSxNQUFNLE1BQU0sR0FBRyxJQUFJLHdCQUF3QixFQUFFLENBQUM7WUFDOUMsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxpQkFBaUIsR0FBMkIsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDckUsTUFBTSxJQUFJLEdBQUcsaUJBQWlCLENBQUMsYUFBYSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLElBQUksSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNoQixTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGdDQUFnQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3ZKLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGdDQUFnQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRWpKLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5RixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLENBQUM7UUFFTyxnQ0FBZ0M7WUFDdkMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQzdELEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sS0FBSyxHQUF3QyxVQUFVLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztnQkFDcEYsS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9CLE1BQU0sS0FBSyxHQUFrQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDeEUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUM7WUFDaEMsQ0FBQztRQUNGLENBQUM7UUFFTSxlQUFlLENBQUMsS0FBWSxFQUFFLEdBQXdCO1lBQzVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRU0scUJBQXFCLENBQUMsS0FBWSxFQUFFLEdBQXdCO1lBQ2xFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFTSxjQUFjLENBQUMsUUFBa0IsRUFBRSxNQUFjO1lBQ3ZELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM3RixNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM3RSxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFTSx5Q0FBeUMsQ0FBQyxrQkFBNEIsRUFBRSxXQUFtQixFQUFFLFdBQW1CO1lBQ3RILE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3JHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLGlFQUFpRTtnQkFDakUsSUFBSSxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3JCLFdBQVcsSUFBSSxXQUFXLENBQUM7Z0JBQzVCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxXQUFXLElBQUksV0FBVyxDQUFDO2dCQUM1QixDQUFDO1lBQ0YsQ0FBQztZQUVELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUQsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLEdBQUcsV0FBVyxDQUFDO1lBQ3JELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVNLGtCQUFrQixDQUFDLFdBQW9CLEVBQUUsdUJBQWdDLEVBQUUsU0FBa0I7WUFDbkcsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUVsRSxXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxXQUFXLENBQUMsSUFBSSxDQUFDLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBRWpELElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQztZQUMxQixJQUFJLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUM3QixLQUFLLE1BQU0sS0FBSyxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO29CQUNyQixhQUFhLEdBQUcsSUFBSSxDQUFDO2dCQUN0QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN2Qix1QkFBdUI7Z0JBQ3ZCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUM5QixPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO2dCQUVELE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUVuRSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDbEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM5RCxTQUFTO29CQUNWLENBQUM7b0JBQ0QsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUM7Z0JBQzdFLENBQUM7Z0JBQ0QsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBRUQsSUFBSSxhQUFhLElBQUksdUJBQXVCLEVBQUUsQ0FBQztnQkFDOUMsa0RBQWtEO2dCQUNsRCxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7Z0JBQzVCLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO2dCQUM1QixLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDO29CQUN0QyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO29CQUNuRCxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO3dCQUMxQixJQUFJLGVBQWUsS0FBSyxtQkFBbUIsRUFBRSxDQUFDOzRCQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7d0JBQ3pELENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGtDQUEwQixDQUFDLHdDQUFnQyxDQUFDLENBQUMsQ0FBQztvQkFDN0gsQ0FBQztvQkFDRCxtQkFBbUIsR0FBRyxlQUFlLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBQ0QsT0FBTyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDakQsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFhLEVBQUUsQ0FBQztZQUM1QixLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7b0JBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGtDQUEwQixDQUFDLHdDQUFnQyxDQUFDLENBQUMsQ0FBQztnQkFDN0gsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNqRCxDQUFDO1FBRU0saUJBQWlCLENBQUMsV0FBb0IsRUFBRSx1QkFBZ0M7WUFDOUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM5QyxJQUFJLFVBQVUsS0FBSyxxQ0FBcUIsRUFBRSxDQUFDO2dCQUMxQyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLDZDQUE2QztnQkFDN0MsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxLQUFLLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUM5QixrQkFBa0I7b0JBQ2xCLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBQ0QsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztnQkFDekMsS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDN0gsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUM7WUFDeEUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3JDLE1BQU0sV0FBVyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM3RCxNQUFNLG9CQUFvQixHQUFHLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssb0NBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEcsSUFBSSxVQUFrQixDQUFDO1lBQ3ZCLElBQUksb0JBQW9CLEVBQUUsQ0FBQztnQkFDMUIsVUFBVSxHQUFHLG9DQUFvQixDQUFDLFVBQVUsQ0FBQztZQUM5QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7Z0JBQ2pDLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDNUMsSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDakIsVUFBVSxHQUFHLElBQUksVUFBVSxHQUFHLENBQUM7b0JBQ2hDLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxVQUFVLEdBQUcsR0FBRyxVQUFVLEtBQUssb0NBQW9CLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEUsQ0FBQztZQUVELE9BQU87Z0JBQ04sSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLElBQUksRUFBRSxDQUNMLGNBQWM7c0JBQ1osVUFBVSxRQUFRLG1DQUEyQixHQUFHO3NCQUNoRCxxQkFBcUIsUUFBUSxtQ0FBMkIsR0FBRztzQkFDM0QsZ0JBQWdCLFVBQVUsR0FBRztzQkFDN0IsZ0JBQWdCLFFBQVEsQ0FBQyxVQUFVLEdBQUc7c0JBQ3RDLGNBQWMsUUFBUSxDQUFDLFFBQVEsS0FBSztzQkFDcEMsZ0JBQWdCLFFBQVEsQ0FBQyxVQUFVLEtBQUs7c0JBQ3hDLG1CQUFtQjtzQkFDbkIsSUFBSTtzQkFDSixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUM7c0JBQ3BDLFFBQVEsQ0FDVjthQUNELENBQUM7UUFDSCxDQUFDO1FBRU8sY0FBYyxDQUFDLFVBQWlCLEVBQUUsUUFBa0I7WUFDM0QsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQztZQUNuRCxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQzNDLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUM7WUFDL0MsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUV2QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFFbEMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBRWhCLEtBQUssSUFBSSxVQUFVLEdBQUcsZUFBZSxFQUFFLFVBQVUsSUFBSSxhQUFhLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDbEYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sV0FBVyxHQUFHLENBQUMsVUFBVSxLQUFLLGVBQWUsQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNFLE1BQU0sU0FBUyxHQUFHLENBQUMsVUFBVSxLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUV0RixJQUFJLFdBQVcsS0FBSyxFQUFFLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxJQUFJLE1BQU0sQ0FBQztnQkFDbEIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sSUFBSSxJQUFBLHdDQUFrQixFQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEksQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxZQUFZO1lBQ25CLE1BQU0sUUFBUSxHQUFHLGdDQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3BELE1BQU0sTUFBTSxHQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3JELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxhQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsMkJBQTJCO1FBRXBCLHFCQUFxQjtZQUMzQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUM3QyxDQUFDO1FBQ00sdUJBQXVCO1lBQzdCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQy9DLENBQUM7UUFDTSxlQUFlO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QyxDQUFDO1FBQ00sZUFBZSxDQUFDLE1BQWlDLEVBQUUsTUFBMEIsRUFBRSxNQUFtQztZQUN4SCxPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUgsQ0FBQztRQUNNLHlCQUF5QjtZQUMvQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNqRCxDQUFDO1FBQ00sNkJBQTZCO1lBQ25DLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQy9DLENBQUM7UUFDTSx5QkFBeUIsQ0FBQyxnQkFBbUM7WUFDbkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFDTSx3QkFBd0I7WUFDOUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDaEQsQ0FBQztRQUNNLHdCQUF3QixDQUFDLElBQXVCO1lBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNNLFlBQVk7WUFDbEIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFDTSxhQUFhO1lBQ25CLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBQ00sV0FBVztZQUNqQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQ2pFLENBQUM7UUFDTSxhQUFhLENBQUMsTUFBaUMsRUFBRSxVQUFpQyxFQUFFLE1BQU0sb0NBQTRCO1lBQzVILElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDM0gsQ0FBQztRQUNNLGVBQWU7WUFDckIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFDTSxrQkFBa0IsQ0FBQyxNQUFzQjtZQUMvQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRU8sa0JBQWtCLENBQUMsUUFBNkQ7WUFDdkYsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2hELG1DQUFtQztnQkFDbkMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RSxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQ00sWUFBWSxDQUFDLE1BQWlDLEVBQUUsS0FBdUMsRUFBRSxtQkFBeUM7WUFDeEksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBQzVILENBQUM7UUFDTSxnQkFBZ0I7WUFDdEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFDTSxjQUFjLENBQUMsTUFBa0M7WUFDdkQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDbEcsQ0FBQztRQUNNLElBQUksQ0FBQyxJQUFZLEVBQUUsTUFBa0M7WUFDM0QsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzlGLENBQUM7UUFDTSxlQUFlLENBQUMsSUFBWSxFQUFFLGtCQUEwQixFQUFFLGtCQUEwQixFQUFFLGFBQXFCLEVBQUUsTUFBa0M7WUFDckosSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNoSyxDQUFDO1FBQ00sS0FBSyxDQUFDLElBQVksRUFBRSxjQUF1QixFQUFFLGVBQTZDLEVBQUUsTUFBa0M7WUFDcEksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDaEksQ0FBQztRQUNNLEdBQUcsQ0FBQyxNQUFrQztZQUM1QyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBQ00sY0FBYyxDQUFDLE9BQWlCLEVBQUUsTUFBa0M7WUFDMUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzNHLENBQUM7UUFDTSxlQUFlLENBQUMsUUFBb0IsRUFBRSxNQUFrQztZQUM5RSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDN0csQ0FBQztRQUNNLGdCQUFnQixDQUFDLE1BQWlDLEVBQUUsZ0JBQXlCLEVBQUUsZ0JBQXlCLEtBQUs7WUFDbkgsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSxhQUFhLGdEQUF3QyxnQkFBZ0IsNEJBQW9CLENBQUMsQ0FBQztRQUM3TCxDQUFDO1FBQ00sbUJBQW1CLENBQUMsTUFBaUMsRUFBRSxnQkFBeUIsRUFBRSxnQkFBeUIsS0FBSztZQUN0SCxJQUFJLENBQUMsd0JBQXdCLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUFFLGFBQWEsZ0RBQXdDLGdCQUFnQiw0QkFBb0IsQ0FBQyxDQUFDO1FBQ2pNLENBQUM7UUFDTSxtQkFBbUIsQ0FBQyxNQUFpQztZQUMzRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDM0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxhQUFLLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hILElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsMkJBQTJCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxnREFBd0MsSUFBSSw0QkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDNU4sQ0FBQztRQUNNLHNCQUFzQixDQUFDLE1BQWlDO1lBQzlELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMseUJBQXlCLEVBQUUsQ0FBQztZQUM5RCxNQUFNLFNBQVMsR0FBRyxJQUFJLGFBQUssQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEgsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLGdEQUF3QyxJQUFJLDRCQUFvQixDQUFDLENBQUMsQ0FBQztRQUM1TixDQUFDO1FBQ00sV0FBVyxDQUFDLE1BQWlDLEVBQUUsZ0JBQXlCLEVBQUUsU0FBZ0IsRUFBRSxZQUEyQyxFQUFFLFVBQXNCO1lBQ3JLLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsSUFBSSxVQUFVLENBQUMsMkJBQTJCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDek0sQ0FBQztRQUVELFlBQVk7UUFFWixvQkFBb0I7UUFDYixnQkFBZ0IsQ0FBQyxRQUF1RDtZQUM5RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlELElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGdEQUFxQixFQUFFLENBQUMsQ0FBQztZQUN0RSxDQUFDO1FBQ0YsQ0FBQztRQUNELFlBQVk7UUFFSix3QkFBd0IsQ0FBSSxRQUEwRDtZQUM3RixJQUFJLENBQUM7Z0JBQ0osTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3BFLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUMzQyxDQUFDO1FBQ0YsQ0FBQztRQUVELGlCQUFpQixDQUFDLFFBQWtCLEVBQUUsUUFBMEI7WUFDL0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQ7OztVQUdFO1FBQ0YsbUJBQW1CLENBQUMsVUFBa0I7WUFDckMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BELENBQUM7S0FDRDtJQXRqQ0QsOEJBc2pDQztJQUVELE1BQU0sYUFBYTtRQUVYLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBaUI7WUFDckMsTUFBTSw2QkFBNkIsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyw2REFBcUQsQ0FBQztZQUM5SSxPQUFPLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLDZCQUE2QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCxJQUFXLGNBQWM7WUFDeEIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFXLE9BQU87WUFDakIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxJQUFXLGlCQUFpQjtZQUMzQixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBVyxjQUFjO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO1FBRUQsWUFDa0IsTUFBa0IsRUFDM0IsZUFBdUIsRUFDdkIsUUFBaUIsRUFDakIsa0JBQTBCLEVBQzFCLGVBQXVCO1lBSmQsV0FBTSxHQUFOLE1BQU0sQ0FBWTtZQUMzQixvQkFBZSxHQUFmLGVBQWUsQ0FBUTtZQUN2QixhQUFRLEdBQVIsUUFBUSxDQUFTO1lBQ2pCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBUTtZQUMxQixvQkFBZSxHQUFmLGVBQWUsQ0FBUTtRQUM1QixDQUFDO1FBRUUsT0FBTztZQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksNkRBQXFELENBQUM7UUFDakgsQ0FBQztRQUVNLE1BQU0sQ0FBQyxTQUFxQixFQUFFLGVBQXVCO1lBQzNELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxrQ0FBa0MsQ0FBQyxJQUFJLG1CQUFRLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0osTUFBTSw2QkFBNkIsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLGFBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLDZEQUFxRCxDQUFDO1lBQzNPLE1BQU0sb0JBQW9CLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNsRyxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsVUFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFFN0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7WUFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDckIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLDZCQUE2QixDQUFDO1lBQ3hELElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxHQUFHLG9CQUFvQixDQUFDO1FBQ3pELENBQUM7UUFFTSxVQUFVO1lBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7S0FDRDtJQUVELE1BQU0sd0JBQXdCO1FBQTlCO1lBRWtCLFdBQU0sR0FBdUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6RixZQUFPLEdBQW9DLEVBQUUsQ0FBQztRQXlCeEQsQ0FBQztRQXZCTyxNQUFNLENBQUMsS0FBYSxFQUFFLE1BQWMsRUFBRSxlQUF1QixFQUFFLGFBQXFCLEVBQUUsSUFBWTtZQUN4RyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXJDLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDaEMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxpQkFBaUIsR0FBRyxDQUFDLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ25FLGtCQUFrQjtvQkFDbEIsSUFBSSxhQUFhLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDdkMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDO29CQUMvQyxDQUFDO29CQUNELE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxPQUFPO2dCQUNQLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNyRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxLQUFLLEdBQUcsSUFBSSx5Q0FBNkIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUN2RyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELE1BQU0sZ0JBQWdCO1FBQXRCO1lBQ2tCLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQW9CLENBQUM7WUFDbkQsb0JBQWUsR0FBRyxLQUFLLENBQUM7WUFDeEIsV0FBTSxHQUFZLEVBQUUsQ0FBQztRQTBCOUIsQ0FBQztRQXhCQSxjQUFjLENBQUMsTUFBZSxFQUFFLE1BQWU7WUFDOUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUMsSUFBSSxRQUFRLElBQUksZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFFRDs7VUFFRTtRQUNGLGVBQWU7WUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMzQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDcEIsQ0FBQztZQUNELElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1lBQzdCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1SCxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztLQUNEO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFhLEVBQUUsSUFBYTtRQUN4RCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzNDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEIsSUFBSSxLQUFLLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1RCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEIsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQy9FLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3pFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxhQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osQ0FBQyxFQUFFLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN4QixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUNELE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUN4QixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDeEIsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsSUFBYSxFQUFFLElBQWE7UUFDckQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFFRDs7T0FFRztJQUNILE1BQU0sY0FBYztRQUNuQixZQUNpQiwwQkFBMkMsRUFDM0MsY0FBc0I7WUFEdEIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFpQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBUTtRQUNuQyxDQUFDO1FBRUUsb0JBQW9CLENBQUMsb0JBQTJDLEVBQUUsVUFBc0I7WUFDOUYsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO2dCQUN0QyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzlHLE1BQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0YsVUFBVSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsU0FBUyxFQUFFLGVBQWUsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLCtCQUF1QixDQUFDO1FBQzFHLENBQUM7S0FDRCJ9