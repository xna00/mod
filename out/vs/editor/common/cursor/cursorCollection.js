/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/oneCursor", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, arrays_1, arraysFind_1, cursorCommon_1, oneCursor_1, position_1, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorCollection = void 0;
    class CursorCollection {
        constructor(context) {
            this.context = context;
            this.cursors = [new oneCursor_1.Cursor(context)];
            this.lastAddedCursorIndex = 0;
        }
        dispose() {
            for (const cursor of this.cursors) {
                cursor.dispose(this.context);
            }
        }
        startTrackingSelections() {
            for (const cursor of this.cursors) {
                cursor.startTrackingSelection(this.context);
            }
        }
        stopTrackingSelections() {
            for (const cursor of this.cursors) {
                cursor.stopTrackingSelection(this.context);
            }
        }
        updateContext(context) {
            this.context = context;
        }
        ensureValidState() {
            for (const cursor of this.cursors) {
                cursor.ensureValidState(this.context);
            }
        }
        readSelectionFromMarkers() {
            return this.cursors.map(c => c.readSelectionFromMarkers(this.context));
        }
        getAll() {
            return this.cursors.map(c => c.asCursorState());
        }
        getViewPositions() {
            return this.cursors.map(c => c.viewState.position);
        }
        getTopMostViewPosition() {
            return (0, arraysFind_1.findFirstMinBy)(this.cursors, (0, arrays_1.compareBy)(c => c.viewState.position, position_1.Position.compare)).viewState.position;
        }
        getBottomMostViewPosition() {
            return (0, arraysFind_1.findLastMaxBy)(this.cursors, (0, arrays_1.compareBy)(c => c.viewState.position, position_1.Position.compare)).viewState.position;
        }
        getSelections() {
            return this.cursors.map(c => c.modelState.selection);
        }
        getViewSelections() {
            return this.cursors.map(c => c.viewState.selection);
        }
        setSelections(selections) {
            this.setStates(cursorCommon_1.CursorState.fromModelSelections(selections));
        }
        getPrimaryCursor() {
            return this.cursors[0].asCursorState();
        }
        setStates(states) {
            if (states === null) {
                return;
            }
            this.cursors[0].setState(this.context, states[0].modelState, states[0].viewState);
            this._setSecondaryStates(states.slice(1));
        }
        /**
         * Creates or disposes secondary cursors as necessary to match the number of `secondarySelections`.
         */
        _setSecondaryStates(secondaryStates) {
            const secondaryCursorsLength = this.cursors.length - 1;
            const secondaryStatesLength = secondaryStates.length;
            if (secondaryCursorsLength < secondaryStatesLength) {
                const createCnt = secondaryStatesLength - secondaryCursorsLength;
                for (let i = 0; i < createCnt; i++) {
                    this._addSecondaryCursor();
                }
            }
            else if (secondaryCursorsLength > secondaryStatesLength) {
                const removeCnt = secondaryCursorsLength - secondaryStatesLength;
                for (let i = 0; i < removeCnt; i++) {
                    this._removeSecondaryCursor(this.cursors.length - 2);
                }
            }
            for (let i = 0; i < secondaryStatesLength; i++) {
                this.cursors[i + 1].setState(this.context, secondaryStates[i].modelState, secondaryStates[i].viewState);
            }
        }
        killSecondaryCursors() {
            this._setSecondaryStates([]);
        }
        _addSecondaryCursor() {
            this.cursors.push(new oneCursor_1.Cursor(this.context));
            this.lastAddedCursorIndex = this.cursors.length - 1;
        }
        getLastAddedCursorIndex() {
            if (this.cursors.length === 1 || this.lastAddedCursorIndex === 0) {
                return 0;
            }
            return this.lastAddedCursorIndex;
        }
        _removeSecondaryCursor(removeIndex) {
            if (this.lastAddedCursorIndex >= removeIndex + 1) {
                this.lastAddedCursorIndex--;
            }
            this.cursors[removeIndex + 1].dispose(this.context);
            this.cursors.splice(removeIndex + 1, 1);
        }
        normalize() {
            if (this.cursors.length === 1) {
                return;
            }
            const cursors = this.cursors.slice(0);
            const sortedCursors = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                sortedCursors.push({
                    index: i,
                    selection: cursors[i].modelState.selection,
                });
            }
            sortedCursors.sort((0, arrays_1.compareBy)(s => s.selection, range_1.Range.compareRangesUsingStarts));
            for (let sortedCursorIndex = 0; sortedCursorIndex < sortedCursors.length - 1; sortedCursorIndex++) {
                const current = sortedCursors[sortedCursorIndex];
                const next = sortedCursors[sortedCursorIndex + 1];
                const currentSelection = current.selection;
                const nextSelection = next.selection;
                if (!this.context.cursorConfig.multiCursorMergeOverlapping) {
                    continue;
                }
                let shouldMergeCursors;
                if (nextSelection.isEmpty() || currentSelection.isEmpty()) {
                    // Merge touching cursors if one of them is collapsed
                    shouldMergeCursors = nextSelection.getStartPosition().isBeforeOrEqual(currentSelection.getEndPosition());
                }
                else {
                    // Merge only overlapping cursors (i.e. allow touching ranges)
                    shouldMergeCursors = nextSelection.getStartPosition().isBefore(currentSelection.getEndPosition());
                }
                if (shouldMergeCursors) {
                    const winnerSortedCursorIndex = current.index < next.index ? sortedCursorIndex : sortedCursorIndex + 1;
                    const looserSortedCursorIndex = current.index < next.index ? sortedCursorIndex + 1 : sortedCursorIndex;
                    const looserIndex = sortedCursors[looserSortedCursorIndex].index;
                    const winnerIndex = sortedCursors[winnerSortedCursorIndex].index;
                    const looserSelection = sortedCursors[looserSortedCursorIndex].selection;
                    const winnerSelection = sortedCursors[winnerSortedCursorIndex].selection;
                    if (!looserSelection.equalsSelection(winnerSelection)) {
                        const resultingRange = looserSelection.plusRange(winnerSelection);
                        const looserSelectionIsLTR = (looserSelection.selectionStartLineNumber === looserSelection.startLineNumber && looserSelection.selectionStartColumn === looserSelection.startColumn);
                        const winnerSelectionIsLTR = (winnerSelection.selectionStartLineNumber === winnerSelection.startLineNumber && winnerSelection.selectionStartColumn === winnerSelection.startColumn);
                        // Give more importance to the last added cursor (think Ctrl-dragging + hitting another cursor)
                        let resultingSelectionIsLTR;
                        if (looserIndex === this.lastAddedCursorIndex) {
                            resultingSelectionIsLTR = looserSelectionIsLTR;
                            this.lastAddedCursorIndex = winnerIndex;
                        }
                        else {
                            // Winner takes it all
                            resultingSelectionIsLTR = winnerSelectionIsLTR;
                        }
                        let resultingSelection;
                        if (resultingSelectionIsLTR) {
                            resultingSelection = new selection_1.Selection(resultingRange.startLineNumber, resultingRange.startColumn, resultingRange.endLineNumber, resultingRange.endColumn);
                        }
                        else {
                            resultingSelection = new selection_1.Selection(resultingRange.endLineNumber, resultingRange.endColumn, resultingRange.startLineNumber, resultingRange.startColumn);
                        }
                        sortedCursors[winnerSortedCursorIndex].selection = resultingSelection;
                        const resultingState = cursorCommon_1.CursorState.fromModelSelection(resultingSelection);
                        cursors[winnerIndex].setState(this.context, resultingState.modelState, resultingState.viewState);
                    }
                    for (const sortedCursor of sortedCursors) {
                        if (sortedCursor.index > looserIndex) {
                            sortedCursor.index--;
                        }
                    }
                    cursors.splice(looserIndex, 1);
                    sortedCursors.splice(looserSortedCursorIndex, 1);
                    this._removeSecondaryCursor(looserIndex - 1);
                    sortedCursorIndex--;
                }
            }
        }
    }
    exports.CursorCollection = CursorCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jdXJzb3IvY3Vyc29yQ29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxnQkFBZ0I7UUFjNUIsWUFBWSxPQUFzQjtZQUNqQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxrQkFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU0sT0FBTztZQUNiLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQztRQUVNLHVCQUF1QjtZQUM3QixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQztRQUVNLHNCQUFzQjtZQUM1QixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1QyxDQUFDO1FBQ0YsQ0FBQztRQUVNLGFBQWEsQ0FBQyxPQUFzQjtZQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBRU0sZ0JBQWdCO1lBQ3RCLEtBQUss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