/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/cursor/cursorCollection", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorContext", "vs/editor/common/cursor/cursorDeleteOperations", "vs/editor/common/cursor/cursorTypeOperations", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/textModelEvents", "vs/editor/common/viewEvents", "vs/base/common/lifecycle", "vs/editor/common/viewModelEventDispatcher"], function (require, exports, errors_1, strings, cursorCollection_1, cursorCommon_1, cursorContext_1, cursorDeleteOperations_1, cursorTypeOperations_1, range_1, selection_1, textModelEvents_1, viewEvents_1, lifecycle_1, viewModelEventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorsController = void 0;
    class CursorsController extends lifecycle_1.Disposable {
        constructor(model, viewModel, coordinatesConverter, cursorConfig) {
            super();
            this._model = model;
            this._knownModelVersionId = this._model.getVersionId();
            this._viewModel = viewModel;
            this._coordinatesConverter = coordinatesConverter;
            this.context = new cursorContext_1.CursorContext(this._model, this._viewModel, this._coordinatesConverter, cursorConfig);
            this._cursors = new cursorCollection_1.CursorCollection(this.context);
            this._hasFocus = false;
            this._isHandling = false;
            this._compositionState = null;
            this._columnSelectData = null;
            this._autoClosedActions = [];
            this._prevEditOperationType = 0 /* EditOperationType.Other */;
        }
        dispose() {
            this._cursors.dispose();
            this._autoClosedActions = (0, lifecycle_1.dispose)(this._autoClosedActions);
            super.dispose();
        }
        updateConfiguration(cursorConfig) {
            this.context = new cursorContext_1.CursorContext(this._model, this._viewModel, this._coordinatesConverter, cursorConfig);
            this._cursors.updateContext(this.context);
        }
        onLineMappingChanged(eventsCollector) {
            if (this._knownModelVersionId !== this._model.getVersionId()) {
                // There are model change events that I didn't yet receive.
                //
                // This can happen when editing the model, and the view model receives the change events first,
                // and the view model emits line mapping changed events, all before the cursor gets a chance to
                // recover from markers.
                //
                // The model change listener above will be called soon and we'll ensure a valid cursor state there.
                return;
            }
            // Ensure valid state
            this.setStates(eventsCollector, 'viewModel', 0 /* CursorChangeReason.NotSet */, this.getCursorStates());
        }
        setHasFocus(hasFocus) {
            this._hasFocus = hasFocus;
        }
        _validateAutoClosedActions() {
            if (this._autoClosedActions.length > 0) {
                const selections = this._cursors.getSelections();
                for (let i = 0; i < this._autoClosedActions.length; i++) {
                    const autoClosedAction = this._autoClosedActions[i];
                    if (!autoClosedAction.isValid(selections)) {
                        autoClosedAction.dispose();
                        this._autoClosedActions.splice(i, 1);
                        i--;
                    }
                }
            }
        }
        // ------ some getters/setters
        getPrimaryCursorState() {
            return this._cursors.getPrimaryCursor();
        }
        getLastAddedCursorIndex() {
            return this._cursors.getLastAddedCursorIndex();
        }
        getCursorStates() {
            return this._cursors.getAll();
        }
        setStates(eventsCollector, source, reason, states) {
            let reachedMaxCursorCount = false;
            const multiCursorLimit = this.context.cursorConfig.multiCursorLimit;
            if (states !== null && states.length > multiCursorLimit) {
                states = states.slice(0, multiCursorLimit);
                reachedMaxCursorCount = true;
            }
            const oldState = CursorModelState.from(this._model, this);
            this._cursors.setStates(states);
            this._cursors.normalize();
            this._columnSelectData = null;
            this._validateAutoClosedActions();
            return this._emitStateChangedIfNecessary(eventsCollector, source, reason, oldState, reachedMaxCursorCount);
        }
        setCursorColumnSelectData(columnSelectData) {
            this._columnSelectData = columnSelectData;
        }
        revealAll(eventsCollector, source, minimalReveal, verticalType, revealHorizontal, scrollType) {
            const viewPositions = this._cursors.getViewPositions();
            let revealViewRange = null;
            let revealViewSelections = null;
            if (viewPositions.length > 1) {
                revealViewSelections = this._cursors.getViewSelections();
            }
            else {
                revealViewRange = range_1.Range.fromPositions(viewPositions[0], viewPositions[0]);
            }
            eventsCollector.emitViewEvent(new viewEvents_1.ViewRevealRangeRequestEvent(source, minimalReveal, revealViewRange, revealViewSelections, verticalType, revealHorizontal, scrollType));
        }
        revealPrimary(eventsCollector, source, minimalReveal, verticalType, revealHorizontal, scrollType) {
            const primaryCursor = this._cursors.getPrimaryCursor();
            const revealViewSelections = [primaryCursor.viewState.selection];
            eventsCollector.emitViewEvent(new viewEvents_1.ViewRevealRangeRequestEvent(source, minimalReveal, null, revealViewSelections, verticalType, revealHorizontal, scrollType));
        }
        saveState() {
            const result = [];
            const selections = this._cursors.getSelections();
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                result.push({
                    inSelectionMode: !selection.isEmpty(),
                    selectionStart: {
                        lineNumber: selection.selectionStartLineNumber,
                        column: selection.selectionStartColumn,
                    },
                    position: {
                        lineNumber: selection.positionLineNumber,
                        column: selection.positionColumn,
                    }
                });
            }
            return result;
        }
        restoreState(eventsCollector, states) {
            const desiredSelections = [];
            for (let i = 0, len = states.length; i < len; i++) {
                const state = states[i];
                let positionLineNumber = 1;
                let positionColumn = 1;
                // Avoid missing properties on the literal
                if (state.position && state.position.lineNumber) {
                    positionLineNumber = state.position.lineNumber;
                }
                if (state.position && state.position.column) {
                    positionColumn = state.position.column;
                }
                let selectionStartLineNumber = positionLineNumber;
                let selectionStartColumn = positionColumn;
                // Avoid missing properties on the literal
                if (state.selectionStart && state.selectionStart.lineNumber) {
                    selectionStartLineNumber = state.selectionStart.lineNumber;
                }
                if (state.selectionStart && state.selectionStart.column) {
                    selectionStartColumn = state.selectionStart.column;
                }
                desiredSelections.push({
                    selectionStartLineNumber: selectionStartLineNumber,
                    selectionStartColumn: selectionStartColumn,
                    positionLineNumber: positionLineNumber,
                    positionColumn: positionColumn
                });
            }
            this.setStates(eventsCollector, 'restoreState', 0 /* CursorChangeReason.NotSet */, cursorCommon_1.CursorState.fromModelSelections(desiredSelections));
            this.revealAll(eventsCollector, 'restoreState', false, 0 /* VerticalRevealType.Simple */, true, 1 /* editorCommon.ScrollType.Immediate */);
        }
        onModelContentChanged(eventsCollector, event) {
            if (event instanceof textModelEvents_1.ModelInjectedTextChangedEvent) {
                // If injected texts change, the view positions of all cursors need to be updated.
                if (this._isHandling) {
                    // The view positions will be updated when handling finishes
                    return;
                }
                // setStates might remove markers, which could trigger a decoration change.
                // If there are injected text decorations for that line, `onModelContentChanged` is emitted again
                // and an endless recursion happens.
                // _isHandling prevents that.
                this._isHandling = true;
                try {
                    this.setStates(eventsCollector, 'modelChange', 0 /* CursorChangeReason.NotSet */, this.getCursorStates());
                }
                finally {
                    this._isHandling = false;
                }
            }
            else {
                const e = event.rawContentChangedEvent;
                this._knownModelVersionId = e.versionId;
                if (this._isHandling) {
                    return;
                }
                const hadFlushEvent = e.containsEvent(1 /* RawContentChangedType.Flush */);
                this._prevEditOperationType = 0 /* EditOperationType.Other */;
                if (hadFlushEvent) {
                    // a model.setValue() was called
                    this._cursors.dispose();
                    this._cursors = new cursorCollection_1.CursorCollection(this.context);
                    this._validateAutoClosedActions();
                    this._emitStateChangedIfNecessary(eventsCollector, 'model', 1 /* CursorChangeReason.ContentFlush */, null, false);
                }
                else {
                    if (this._hasFocus && e.resultingSelection && e.resultingSelection.length > 0) {
                        const cursorState = cursorCommon_1.CursorState.fromModelSelections(e.resultingSelection);
                        if (this.setStates(eventsCollector, 'modelChange', e.isUndoing ? 5 /* CursorChangeReason.Undo */ : e.isRedoing ? 6 /* CursorChangeReason.Redo */ : 2 /* CursorChangeReason.RecoverFromMarkers */, cursorState)) {
                            this.revealAll(eventsCollector, 'modelChange', false, 0 /* VerticalRevealType.Simple */, true, 0 /* editorCommon.ScrollType.Smooth */);
                        }
                    }
                    else {
                        const selectionsFromMarkers = this._cursors.readSelectionFromMarkers();
                        this.setStates(eventsCollector, 'modelChange', 2 /* CursorChangeReason.RecoverFromMarkers */, cursorCommon_1.CursorState.fromModelSelections(selectionsFromMarkers));
                    }
                }
            }
        }
        getSelection() {
            return this._cursors.getPrimaryCursor().modelState.selection;
        }
        getTopMostViewPosition() {
            return this._cursors.getTopMostViewPosition();
        }
        getBottomMostViewPosition() {
            return this._cursors.getBottomMostViewPosition();
        }
        getCursorColumnSelectData() {
            if (this._columnSelectData) {
                return this._columnSelectData;
            }
            const primaryCursor = this._cursors.getPrimaryCursor();
            const viewSelectionStart = primaryCursor.viewState.selectionStart.getStartPosition();
            const viewPosition = primaryCursor.viewState.position;
            return {
                isReal: false,
                fromViewLineNumber: viewSelectionStart.lineNumber,
                fromViewVisualColumn: this.context.cursorConfig.visibleColumnFromColumn(this._viewModel, viewSelectionStart),
                toViewLineNumber: viewPosition.lineNumber,
                toViewVisualColumn: this.context.cursorConfig.visibleColumnFromColumn(this._viewModel, viewPosition),
            };
        }
        getSelections() {
            return this._cursors.getSelections();
        }
        getPosition() {
            return this._cursors.getPrimaryCursor().modelState.position;
        }
        setSelections(eventsCollector, source, selections, reason) {
            this.setStates(eventsCollector, source, reason, cursorCommon_1.CursorState.fromModelSelections(selections));
        }
        getPrevEditOperationType() {
            return this._prevEditOperationType;
        }
        setPrevEditOperationType(type) {
            this._prevEditOperationType = type;
        }
        // ------ auxiliary handling logic
        _pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges) {
            const autoClosedCharactersDeltaDecorations = [];
            const autoClosedEnclosingDeltaDecorations = [];
            for (let i = 0, len = autoClosedCharactersRanges.length; i < len; i++) {
                autoClosedCharactersDeltaDecorations.push({
                    range: autoClosedCharactersRanges[i],
                    options: {
                        description: 'auto-closed-character',
                        inlineClassName: 'auto-closed-character',
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
                    }
                });
                autoClosedEnclosingDeltaDecorations.push({
                    range: autoClosedEnclosingRanges[i],
                    options: {
                        description: 'auto-closed-enclosing',
                        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */
                    }
                });
            }
            const autoClosedCharactersDecorations = this._model.deltaDecorations([], autoClosedCharactersDeltaDecorations);
            const autoClosedEnclosingDecorations = this._model.deltaDecorations([], autoClosedEnclosingDeltaDecorations);
            this._autoClosedActions.push(new AutoClosedAction(this._model, autoClosedCharactersDecorations, autoClosedEnclosingDecorations));
        }
        _executeEditOperation(opResult) {
            if (!opResult) {
                // Nothing to execute
                return;
            }
            if (opResult.shouldPushStackElementBefore) {
                this._model.pushStackElement();
            }
            const result = CommandExecutor.executeCommands(this._model, this._cursors.getSelections(), opResult.commands);
            if (result) {
                // The commands were applied correctly
                this._interpretCommandResult(result);
                // Check for auto-closing closed characters
                const autoClosedCharactersRanges = [];
                const autoClosedEnclosingRanges = [];
                for (let i = 0; i < opResult.commands.length; i++) {
                    const command = opResult.commands[i];
                    if (command instanceof cursorTypeOperations_1.TypeWithAutoClosingCommand && command.enclosingRange && command.closeCharacterRange) {
                        autoClosedCharactersRanges.push(command.closeCharacterRange);
                        autoClosedEnclosingRanges.push(command.enclosingRange);
                    }
                }
                if (autoClosedCharactersRanges.length > 0) {
                    this._pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges);
                }
                this._prevEditOperationType = opResult.type;
            }
            if (opResult.shouldPushStackElementAfter) {
                this._model.pushStackElement();
            }
        }
        _interpretCommandResult(cursorState) {
            if (!cursorState || cursorState.length === 0) {
                cursorState = this._cursors.readSelectionFromMarkers();
            }
            this._columnSelectData = null;
            this._cursors.setSelections(cursorState);
            this._cursors.normalize();
        }
        // -----------------------------------------------------------------------------------------------------------
        // ----- emitting events
        _emitStateChangedIfNecessary(eventsCollector, source, reason, oldState, reachedMaxCursorCount) {
            const newState = CursorModelState.from(this._model, this);
            if (newState.equals(oldState)) {
                return false;
            }
            const selections = this._cursors.getSelections();
            const viewSelections = this._cursors.getViewSelections();
            // Let the view get the event first.
            eventsCollector.emitViewEvent(new viewEvents_1.ViewCursorStateChangedEvent(viewSelections, selections, reason));
            // Only after the view has been notified, let the rest of the world know...
            if (!oldState
                || oldState.cursorState.length !== newState.cursorState.length
                || newState.cursorState.some((newCursorState, i) => !newCursorState.modelState.equals(oldState.cursorState[i].modelState))) {
                const oldSelections = oldState ? oldState.cursorState.map(s => s.modelState.selection) : null;
                const oldModelVersionId = oldState ? oldState.modelVersionId : 0;
                eventsCollector.emitOutgoingEvent(new viewModelEventDispatcher_1.CursorStateChangedEvent(oldSelections, selections, oldModelVersionId, newState.modelVersionId, source || 'keyboard', reason, reachedMaxCursorCount));
            }
            return true;
        }
        // -----------------------------------------------------------------------------------------------------------
        // ----- handlers beyond this point
        _findAutoClosingPairs(edits) {
            if (!edits.length) {
                return null;
            }
            const indices = [];
            for (let i = 0, len = edits.length; i < len; i++) {
                const edit = edits[i];
                if (!edit.text || edit.text.indexOf('\n') >= 0) {
                    return null;
                }
                const m = edit.text.match(/([)\]}>'"`])([^)\]}>'"`]*)$/);
                if (!m) {
                    return null;
                }
                const closeChar = m[1];
                const autoClosingPairsCandidates = this.context.cursorConfig.autoClosingPairs.autoClosingPairsCloseSingleChar.get(closeChar);
                if (!autoClosingPairsCandidates || autoClosingPairsCandidates.length !== 1) {
                    return null;
                }
                const openChar = autoClosingPairsCandidates[0].open;
                const closeCharIndex = edit.text.length - m[2].length - 1;
                const openCharIndex = edit.text.lastIndexOf(openChar, closeCharIndex - 1);
                if (openCharIndex === -1) {
                    return null;
                }
                indices.push([openCharIndex, closeCharIndex]);
            }
            return indices;
        }
        executeEdits(eventsCollector, source, edits, cursorStateComputer) {
            let autoClosingIndices = null;
            if (source === 'snippet') {
                autoClosingIndices = this._findAutoClosingPairs(edits);
            }
            if (autoClosingIndices) {
                edits[0]._isTracked = true;
            }
            const autoClosedCharactersRanges = [];
            const autoClosedEnclosingRanges = [];
            const selections = this._model.pushEditOperations(this.getSelections(), edits, (undoEdits) => {
                if (autoClosingIndices) {
                    for (let i = 0, len = autoClosingIndices.length; i < len; i++) {
                        const [openCharInnerIndex, closeCharInnerIndex] = autoClosingIndices[i];
                        const undoEdit = undoEdits[i];
                        const lineNumber = undoEdit.range.startLineNumber;
                        const openCharIndex = undoEdit.range.startColumn - 1 + openCharInnerIndex;
                        const closeCharIndex = undoEdit.range.startColumn - 1 + closeCharInnerIndex;
                        autoClosedCharactersRanges.push(new range_1.Range(lineNumber, closeCharIndex + 1, lineNumber, closeCharIndex + 2));
                        autoClosedEnclosingRanges.push(new range_1.Range(lineNumber, openCharIndex + 1, lineNumber, closeCharIndex + 2));
                    }
                }
                const selections = cursorStateComputer(undoEdits);
                if (selections) {
                    // Don't recover the selection from markers because
                    // we know what it should be.
                    this._isHandling = true;
                }
                return selections;
            });
            if (selections) {
                this._isHandling = false;
                this.setSelections(eventsCollector, source, selections, 0 /* CursorChangeReason.NotSet */);
            }
            if (autoClosedCharactersRanges.length > 0) {
                this._pushAutoClosedAction(autoClosedCharactersRanges, autoClosedEnclosingRanges);
            }
        }
        _executeEdit(callback, eventsCollector, source, cursorChangeReason = 0 /* CursorChangeReason.NotSet */) {
            if (this.context.cursorConfig.readOnly) {
                // we cannot edit when read only...
                return;
            }
            const oldState = CursorModelState.from(this._model, this);
            this._cursors.stopTrackingSelections();
            this._isHandling = true;
            try {
                this._cursors.ensureValidState();
                callback();
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
            this._isHandling = false;
            this._cursors.startTrackingSelections();
            this._validateAutoClosedActions();
            if (this._emitStateChangedIfNecessary(eventsCollector, source, cursorChangeReason, oldState, false)) {
                this.revealAll(eventsCollector, source, false, 0 /* VerticalRevealType.Simple */, true, 0 /* editorCommon.ScrollType.Smooth */);
            }
        }
        getAutoClosedCharacters() {
            return AutoClosedAction.getAllAutoClosedCharacters(this._autoClosedActions);
        }
        startComposition(eventsCollector) {
            this._compositionState = new CompositionState(this._model, this.getSelections());
        }
        endComposition(eventsCollector, source) {
            const compositionOutcome = this._compositionState ? this._compositionState.deduceOutcome(this._model, this.getSelections()) : null;
            this._compositionState = null;
            this._executeEdit(() => {
                if (source === 'keyboard') {
                    // composition finishes, let's check if we need to auto complete if necessary.
                    this._executeEditOperation(cursorTypeOperations_1.TypeOperations.compositionEndWithInterceptors(this._prevEditOperationType, this.context.cursorConfig, this._model, compositionOutcome, this.getSelections(), this.getAutoClosedCharacters()));
                }
            }, eventsCollector, source);
        }
        type(eventsCollector, text, source) {
            this._executeEdit(() => {
                if (source === 'keyboard') {
                    // If this event is coming straight from the keyboard, look for electric characters and enter
                    const len = text.length;
                    let offset = 0;
                    while (offset < len) {
                        const charLength = strings.nextCharLength(text, offset);
                        const chr = text.substr(offset, charLength);
                        // Here we must interpret each typed character individually
                        this._executeEditOperation(cursorTypeOperations_1.TypeOperations.typeWithInterceptors(!!this._compositionState, this._prevEditOperationType, this.context.cursorConfig, this._model, this.getSelections(), this.getAutoClosedCharacters(), chr));
                        offset += charLength;
                    }
                }
                else {
                    this._executeEditOperation(cursorTypeOperations_1.TypeOperations.typeWithoutInterceptors(this._prevEditOperationType, this.context.cursorConfig, this._model, this.getSelections(), text));
                }
            }, eventsCollector, source);
        }
        compositionType(eventsCollector, text, replacePrevCharCnt, replaceNextCharCnt, positionDelta, source) {
            if (text.length === 0 && replacePrevCharCnt === 0 && replaceNextCharCnt === 0) {
                // this edit is a no-op
                if (positionDelta !== 0) {
                    // but it still wants to move the cursor
                    const newSelections = this.getSelections().map(selection => {
                        const position = selection.getPosition();
                        return new selection_1.Selection(position.lineNumber, position.column + positionDelta, position.lineNumber, position.column + positionDelta);
                    });
                    this.setSelections(eventsCollector, source, newSelections, 0 /* CursorChangeReason.NotSet */);
                }
                return;
            }
            this._executeEdit(() => {
                this._executeEditOperation(cursorTypeOperations_1.TypeOperations.compositionType(this._prevEditOperationType, this.context.cursorConfig, this._model, this.getSelections(), text, replacePrevCharCnt, replaceNextCharCnt, positionDelta));
            }, eventsCollector, source);
        }
        paste(eventsCollector, text, pasteOnNewLine, multicursorText, source) {
            this._executeEdit(() => {
                this._executeEditOperation(cursorTypeOperations_1.TypeOperations.paste(this.context.cursorConfig, this._model, this.getSelections(), text, pasteOnNewLine, multicursorText || []));
            }, eventsCollector, source, 4 /* CursorChangeReason.Paste */);
        }
        cut(eventsCollector, source) {
            this._executeEdit(() => {
                this._executeEditOperation(cursorDeleteOperations_1.DeleteOperations.cut(this.context.cursorConfig, this._model, this.getSelections()));
            }, eventsCollector, source);
        }
        executeCommand(eventsCollector, command, source) {
            this._executeEdit(() => {
                this._cursors.killSecondaryCursors();
                this._executeEditOperation(new cursorCommon_1.EditOperationResult(0 /* EditOperationType.Other */, [command], {
                    shouldPushStackElementBefore: false,
                    shouldPushStackElementAfter: false
                }));
            }, eventsCollector, source);
        }
        executeCommands(eventsCollector, commands, source) {
            this._executeEdit(() => {
                this._executeEditOperation(new cursorCommon_1.EditOperationResult(0 /* EditOperationType.Other */, commands, {
                    shouldPushStackElementBefore: false,
                    shouldPushStackElementAfter: false
                }));
            }, eventsCollector, source);
        }
    }
    exports.CursorsController = CursorsController;
    /**
     * A snapshot of the cursor and the model state
     */
    class CursorModelState {
        static from(model, cursor) {
            return new CursorModelState(model.getVersionId(), cursor.getCursorStates());
        }
        constructor(modelVersionId, cursorState) {
            this.modelVersionId = modelVersionId;
            this.cursorState = cursorState;
        }
        equals(other) {
            if (!other) {
                return false;
            }
            if (this.modelVersionId !== other.modelVersionId) {
                return false;
            }
            if (this.cursorState.length !== other.cursorState.length) {
                return false;
            }
            for (let i = 0, len = this.cursorState.length; i < len; i++) {
                if (!this.cursorState[i].equals(other.cursorState[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class AutoClosedAction {
        static getAllAutoClosedCharacters(autoClosedActions) {
            let autoClosedCharacters = [];
            for (const autoClosedAction of autoClosedActions) {
                autoClosedCharacters = autoClosedCharacters.concat(autoClosedAction.getAutoClosedCharactersRanges());
            }
            return autoClosedCharacters;
        }
        constructor(model, autoClosedCharactersDecorations, autoClosedEnclosingDecorations) {
            this._model = model;
            this._autoClosedCharactersDecorations = autoClosedCharactersDecorations;
            this._autoClosedEnclosingDecorations = autoClosedEnclosingDecorations;
        }
        dispose() {
            this._autoClosedCharactersDecorations = this._model.deltaDecorations(this._autoClosedCharactersDecorations, []);
            this._autoClosedEnclosingDecorations = this._model.deltaDecorations(this._autoClosedEnclosingDecorations, []);
        }
        getAutoClosedCharactersRanges() {
            const result = [];
            for (let i = 0; i < this._autoClosedCharactersDecorations.length; i++) {
                const decorationRange = this._model.getDecorationRange(this._autoClosedCharactersDecorations[i]);
                if (decorationRange) {
                    result.push(decorationRange);
                }
            }
            return result;
        }
        isValid(selections) {
            const enclosingRanges = [];
            for (let i = 0; i < this._autoClosedEnclosingDecorations.length; i++) {
                const decorationRange = this._model.getDecorationRange(this._autoClosedEnclosingDecorations[i]);
                if (decorationRange) {
                    enclosingRanges.push(decorationRange);
                    if (decorationRange.startLineNumber !== decorationRange.endLineNumber) {
                        // Stop tracking if the range becomes multiline...
                        return false;
                    }
                }
            }
            enclosingRanges.sort(range_1.Range.compareRangesUsingStarts);
            selections.sort(range_1.Range.compareRangesUsingStarts);
            for (let i = 0; i < selections.length; i++) {
                if (i >= enclosingRanges.length) {
                    return false;
                }
                if (!enclosingRanges[i].strictContainsRange(selections[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class CommandExecutor {
        static executeCommands(model, selectionsBefore, commands) {
            const ctx = {
                model: model,
                selectionsBefore: selectionsBefore,
                trackedRanges: [],
                trackedRangesDirection: []
            };
            const result = this._innerExecuteCommands(ctx, commands);
            for (let i = 0, len = ctx.trackedRanges.length; i < len; i++) {
                ctx.model._setTrackedRange(ctx.trackedRanges[i], null, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */);
            }
            return result;
        }
        static _innerExecuteCommands(ctx, commands) {
            if (this._arrayIsEmpty(commands)) {
                return null;
            }
            const commandsData = this._getEditOperations(ctx, commands);
            if (commandsData.operations.length === 0) {
                return null;
            }
            const rawOperations = commandsData.operations;
            const loserCursorsMap = this._getLoserCursorMap(rawOperations);
            if (loserCursorsMap.hasOwnProperty('0')) {
                // These commands are very messed up
                console.warn('Ignoring commands');
                return null;
            }
            // Remove operations belonging to losing cursors
            const filteredOperations = [];
            for (let i = 0, len = rawOperations.length; i < len; i++) {
                if (!loserCursorsMap.hasOwnProperty(rawOperations[i].identifier.major.toString())) {
                    filteredOperations.push(rawOperations[i]);
                }
            }
            // TODO@Alex: find a better way to do this.
            // give the hint that edit operations are tracked to the model
            if (commandsData.hadTrackedEditOperation && filteredOperations.length > 0) {
                filteredOperations[0]._isTracked = true;
            }
            let selectionsAfter = ctx.model.pushEditOperations(ctx.selectionsBefore, filteredOperations, (inverseEditOperations) => {
                const groupedInverseEditOperations = [];
                for (let i = 0; i < ctx.selectionsBefore.length; i++) {
                    groupedInverseEditOperations[i] = [];
                }
                for (const op of inverseEditOperations) {
                    if (!op.identifier) {
                        // perhaps auto whitespace trim edits
                        continue;
                    }
                    groupedInverseEditOperations[op.identifier.major].push(op);
                }
                const minorBasedSorter = (a, b) => {
                    return a.identifier.minor - b.identifier.minor;
                };
                const cursorSelections = [];
                for (let i = 0; i < ctx.selectionsBefore.length; i++) {
                    if (groupedInverseEditOperations[i].length > 0) {
                        groupedInverseEditOperations[i].sort(minorBasedSorter);
                        cursorSelections[i] = commands[i].computeCursorState(ctx.model, {
                            getInverseEditOperations: () => {
                                return groupedInverseEditOperations[i];
                            },
                            getTrackedSelection: (id) => {
                                const idx = parseInt(id, 10);
                                const range = ctx.model._getTrackedRange(ctx.trackedRanges[idx]);
                                if (ctx.trackedRangesDirection[idx] === 0 /* SelectionDirection.LTR */) {
                                    return new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
                                }
                                return new selection_1.Selection(range.endLineNumber, range.endColumn, range.startLineNumber, range.startColumn);
                            }
                        });
                    }
                    else {
                        cursorSelections[i] = ctx.selectionsBefore[i];
                    }
                }
                return cursorSelections;
            });
            if (!selectionsAfter) {
                selectionsAfter = ctx.selectionsBefore;
            }
            // Extract losing cursors
            const losingCursors = [];
            for (const losingCursorIndex in loserCursorsMap) {
                if (loserCursorsMap.hasOwnProperty(losingCursorIndex)) {
                    losingCursors.push(parseInt(losingCursorIndex, 10));
                }
            }
            // Sort losing cursors descending
            losingCursors.sort((a, b) => {
                return b - a;
            });
            // Remove losing cursors
            for (const losingCursor of losingCursors) {
                selectionsAfter.splice(losingCursor, 1);
            }
            return selectionsAfter;
        }
        static _arrayIsEmpty(commands) {
            for (let i = 0, len = commands.length; i < len; i++) {
                if (commands[i]) {
                    return false;
                }
            }
            return true;
        }
        static _getEditOperations(ctx, commands) {
            let operations = [];
            let hadTrackedEditOperation = false;
            for (let i = 0, len = commands.length; i < len; i++) {
                const command = commands[i];
                if (command) {
                    const r = this._getEditOperationsFromCommand(ctx, i, command);
                    operations = operations.concat(r.operations);
                    hadTrackedEditOperation = hadTrackedEditOperation || r.hadTrackedEditOperation;
                }
            }
            return {
                operations: operations,
                hadTrackedEditOperation: hadTrackedEditOperation
            };
        }
        static _getEditOperationsFromCommand(ctx, majorIdentifier, command) {
            // This method acts as a transaction, if the command fails
            // everything it has done is ignored
            const operations = [];
            let operationMinor = 0;
            const addEditOperation = (range, text, forceMoveMarkers = false) => {
                if (range_1.Range.isEmpty(range) && text === '') {
                    // This command wants to add a no-op => no thank you
                    return;
                }
                operations.push({
                    identifier: {
                        major: majorIdentifier,
                        minor: operationMinor++
                    },
                    range: range,
                    text: text,
                    forceMoveMarkers: forceMoveMarkers,
                    isAutoWhitespaceEdit: command.insertsAutoWhitespace
                });
            };
            let hadTrackedEditOperation = false;
            const addTrackedEditOperation = (selection, text, forceMoveMarkers) => {
                hadTrackedEditOperation = true;
                addEditOperation(selection, text, forceMoveMarkers);
            };
            const trackSelection = (_selection, trackPreviousOnEmpty) => {
                const selection = selection_1.Selection.liftSelection(_selection);
                let stickiness;
                if (selection.isEmpty()) {
                    if (typeof trackPreviousOnEmpty === 'boolean') {
                        if (trackPreviousOnEmpty) {
                            stickiness = 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */;
                        }
                        else {
                            stickiness = 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */;
                        }
                    }
                    else {
                        // Try to lock it with surrounding text
                        const maxLineColumn = ctx.model.getLineMaxColumn(selection.startLineNumber);
                        if (selection.startColumn === maxLineColumn) {
                            stickiness = 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */;
                        }
                        else {
                            stickiness = 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */;
                        }
                    }
                }
                else {
                    stickiness = 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
                }
                const l = ctx.trackedRanges.length;
                const id = ctx.model._setTrackedRange(null, selection, stickiness);
                ctx.trackedRanges[l] = id;
                ctx.trackedRangesDirection[l] = selection.getDirection();
                return l.toString();
            };
            const editOperationBuilder = {
                addEditOperation: addEditOperation,
                addTrackedEditOperation: addTrackedEditOperation,
                trackSelection: trackSelection
            };
            try {
                command.getEditOperations(ctx.model, editOperationBuilder);
            }
            catch (e) {
                // TODO@Alex use notification service if this should be user facing
                // e.friendlyMessage = nls.localize('corrupt.commands', "Unexpected exception while executing command.");
                (0, errors_1.onUnexpectedError)(e);
                return {
                    operations: [],
                    hadTrackedEditOperation: false
                };
            }
            return {
                operations: operations,
                hadTrackedEditOperation: hadTrackedEditOperation
            };
        }
        static _getLoserCursorMap(operations) {
            // This is destructive on the array
            operations = operations.slice(0);
            // Sort operations with last one first
            operations.sort((a, b) => {
                // Note the minus!
                return -(range_1.Range.compareRangesUsingEnds(a.range, b.range));
            });
            // Operations can not overlap!
            const loserCursorsMap = {};
            for (let i = 1; i < operations.length; i++) {
                const previousOp = operations[i - 1];
                const currentOp = operations[i];
                if (range_1.Range.getStartPosition(previousOp.range).isBefore(range_1.Range.getEndPosition(currentOp.range))) {
                    let loserMajor;
                    if (previousOp.identifier.major > currentOp.identifier.major) {
                        // previousOp loses the battle
                        loserMajor = previousOp.identifier.major;
                    }
                    else {
                        loserMajor = currentOp.identifier.major;
                    }
                    loserCursorsMap[loserMajor.toString()] = true;
                    for (let j = 0; j < operations.length; j++) {
                        if (operations[j].identifier.major === loserMajor) {
                            operations.splice(j, 1);
                            if (j < i) {
                                i--;
                            }
                            j--;
                        }
                    }
                    if (i > 0) {
                        i--;
                    }
                }
            }
            return loserCursorsMap;
        }
    }
    class CompositionLineState {
        constructor(text, startSelection, endSelection) {
            this.text = text;
            this.startSelection = startSelection;
            this.endSelection = endSelection;
        }
    }
    class CompositionState {
        static _capture(textModel, selections) {
            const result = [];
            for (const selection of selections) {
                if (selection.startLineNumber !== selection.endLineNumber) {
                    return null;
                }
                result.push(new CompositionLineState(textModel.getLineContent(selection.startLineNumber), selection.startColumn - 1, selection.endColumn - 1));
            }
            return result;
        }
        constructor(textModel, selections) {
            this._original = CompositionState._capture(textModel, selections);
        }
        /**
         * Returns the inserted text during this composition.
         * If the composition resulted in existing text being changed (i.e. not a pure insertion) it returns null.
         */
        deduceOutcome(textModel, selections) {
            if (!this._original) {
                return null;
            }
            const current = CompositionState._capture(textModel, selections);
            if (!current) {
                return null;
            }
            if (this._original.length !== current.length) {
                return null;
            }
            const result = [];
            for (let i = 0, len = this._original.length; i < len; i++) {
                result.push(CompositionState._deduceOutcome(this._original[i], current[i]));
            }
            return result;
        }
        static _deduceOutcome(original, current) {
            const commonPrefix = Math.min(original.startSelection, current.startSelection, strings.commonPrefixLength(original.text, current.text));
            const commonSuffix = Math.min(original.text.length - original.endSelection, current.text.length - current.endSelection, strings.commonSuffixLength(original.text, current.text));
            const deletedText = original.text.substring(commonPrefix, original.text.length - commonSuffix);
            const insertedText = current.text.substring(commonPrefix, current.text.length - commonSuffix);
            return new cursorTypeOperations_1.CompositionOutcome(deletedText, original.startSelection - commonPrefix, original.endSelection - commonPrefix, insertedText, current.startSelection - commonPrefix, current.endSelection - commonPrefix);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvci9jdXJzb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxNQUFhLGlCQUFrQixTQUFRLHNCQUFVO1FBZ0JoRCxZQUFZLEtBQWlCLEVBQUUsU0FBNkIsRUFBRSxvQkFBMkMsRUFBRSxZQUFpQztZQUMzSSxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3ZELElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQztZQUNsRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksNkJBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3pHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbkQsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUM5QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLHNCQUFzQixrQ0FBMEIsQ0FBQztRQUN2RCxDQUFDO1FBRWUsT0FBTztZ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