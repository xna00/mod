/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/cursorCommon", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, cursorCommon_1, position_1, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Cursor = void 0;
    /**
     * Represents a single cursor.
    */
    class Cursor {
        constructor(context) {
            this._selTrackedRange = null;
            this._trackSelection = true;
            this._setState(context, new cursorCommon_1.SingleCursorState(new range_1.Range(1, 1, 1, 1), 0 /* SelectionStartKind.Simple */, 0, new position_1.Position(1, 1), 0), new cursorCommon_1.SingleCursorState(new range_1.Range(1, 1, 1, 1), 0 /* SelectionStartKind.Simple */, 0, new position_1.Position(1, 1), 0));
        }
        dispose(context) {
            this._removeTrackedRange(context);
        }
        startTrackingSelection(context) {
            this._trackSelection = true;
            this._updateTrackedRange(context);
        }
        stopTrackingSelection(context) {
            this._trackSelection = false;
            this._removeTrackedRange(context);
        }
        _updateTrackedRange(context) {
            if (!this._trackSelection) {
                // don't track the selection
                return;
            }
            this._selTrackedRange = context.model._setTrackedRange(this._selTrackedRange, this.modelState.selection, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */);
        }
        _removeTrackedRange(context) {
            this._selTrackedRange = context.model._setTrackedRange(this._selTrackedRange, null, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */);
        }
        asCursorState() {
            return new cursorCommon_1.CursorState(this.modelState, this.viewState);
        }
        readSelectionFromMarkers(context) {
            const range = context.model._getTrackedRange(this._selTrackedRange);
            if (this.modelState.selection.isEmpty() && !range.isEmpty()) {
                // Avoid selecting text when recovering from markers
                return selection_1.Selection.fromRange(range.collapseToEnd(), this.modelState.selection.getDirection());
            }
            return selection_1.Selection.fromRange(range, this.modelState.selection.getDirection());
        }
        ensureValidState(context) {
            this._setState(context, this.modelState, this.viewState);
        }
        setState(context, modelState, viewState) {
            this._setState(context, modelState, viewState);
        }
        static _validatePositionWithCache(viewModel, position, cacheInput, cacheOutput) {
            if (position.equals(cacheInput)) {
                return cacheOutput;
            }
            return viewModel.normalizePosition(position, 2 /* PositionAffinity.None */);
        }
        static _validateViewState(viewModel, viewState) {
            const position = viewState.position;
            const sStartPosition = viewState.selectionStart.getStartPosition();
            const sEndPosition = viewState.selectionStart.getEndPosition();
            const validPosition = viewModel.normalizePosition(position, 2 /* PositionAffinity.None */);
            const validSStartPosition = this._validatePositionWithCache(viewModel, sStartPosition, position, validPosition);
            const validSEndPosition = this._validatePositionWithCache(viewModel, sEndPosition, sStartPosition, validSStartPosition);
            if (position.equals(validPosition) && sStartPosition.equals(validSStartPosition) && sEndPosition.equals(validSEndPosition)) {
                // fast path: the state is valid
                return viewState;
            }
            return new cursorCommon_1.SingleCursorState(range_1.Range.fromPositions(validSStartPosition, validSEndPosition), viewState.selectionStartKind, viewState.selectionStartLeftoverVisibleColumns + sStartPosition.column - validSStartPosition.column, validPosition, viewState.leftoverVisibleColumns + position.column - validPosition.column);
        }
        _setState(context, modelState, viewState) {
            if (viewState) {
                viewState = Cursor._validateViewState(context.viewModel, viewState);
            }
            if (!modelState) {
                if (!viewState) {
                    return;
                }
                // We only have the view state => compute the model state
                const selectionStart = context.model.validateRange(context.coordinatesConverter.convertViewRangeToModelRange(viewState.selectionStart));
                const position = context.model.validatePosition(context.coordinatesConverter.convertViewPositionToModelPosition(viewState.position));
                modelState = new cursorCommon_1.SingleCursorState(selectionStart, viewState.selectionStartKind, viewState.selectionStartLeftoverVisibleColumns, position, viewState.leftoverVisibleColumns);
            }
            else {
                // Validate new model state
                const selectionStart = context.model.validateRange(modelState.selectionStart);
                const selectionStartLeftoverVisibleColumns = modelState.selectionStart.equalsRange(selectionStart) ? modelState.selectionStartLeftoverVisibleColumns : 0;
                const position = context.model.validatePosition(modelState.position);
                const leftoverVisibleColumns = modelState.position.equals(position) ? modelState.leftoverVisibleColumns : 0;
                modelState = new cursorCommon_1.SingleCursorState(selectionStart, modelState.selectionStartKind, selectionStartLeftoverVisibleColumns, position, leftoverVisibleColumns);
            }
            if (!viewState) {
                // We only have the model state => compute the view state
                const viewSelectionStart1 = context.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelState.selectionStart.startLineNumber, modelState.selectionStart.startColumn));
                const viewSelectionStart2 = context.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(modelState.selectionStart.endLineNumber, modelState.selectionStart.endColumn));
                const viewSelectionStart = new range_1.Range(viewSelectionStart1.lineNumber, viewSelectionStart1.column, viewSelectionStart2.lineNumber, viewSelectionStart2.column);
                const viewPosition = context.coordinatesConverter.convertModelPositionToViewPosition(modelState.position);
                viewState = new cursorCommon_1.SingleCursorState(viewSelectionStart, modelState.selectionStartKind, modelState.selectionStartLeftoverVisibleColumns, viewPosition, modelState.leftoverVisibleColumns);
            }
            else {
                // Validate new view state
                const viewSelectionStart = context.coordinatesConverter.validateViewRange(viewState.selectionStart, modelState.selectionStart);
                const viewPosition = context.coordinatesConverter.validateViewPosition(viewState.position, modelState.position);
                viewState = new cursorCommon_1.SingleCursorState(viewSelectionStart, modelState.selectionStartKind, modelState.selectionStartLeftoverVisibleColumns, viewPosition, modelState.leftoverVisibleColumns);
            }
            this.modelState = modelState;
            this.viewState = viewState;
            this._updateTrackedRange(context);
        }
    }
    exports.Cursor = Cursor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib25lQ3Vyc29yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2N1cnNvci9vbmVDdXJzb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHOztNQUVFO0lBQ0YsTUFBYSxNQUFNO1FBUWxCLFlBQVksT0FBc0I7WUFDakMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUM3QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUU1QixJQUFJLENBQUMsU0FBUyxDQUNiLE9BQU8sRUFDUCxJQUFJLGdDQUFpQixDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxxQ0FBNkIsQ0FBQyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ2pHLElBQUksZ0NBQWlCLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLHFDQUE2QixDQUFDLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDakcsQ0FBQztRQUNILENBQUM7UUFFTSxPQUFPLENBQUMsT0FBc0I7WUFDcEMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFTSxzQkFBc0IsQ0FBQyxPQUFzQjtZQUNuRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUM1QixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVNLHFCQUFxQixDQUFDLE9BQXNCO1lBQ2xELElBQUksQ0FBQyxlQUFlLEdBQUcsS0FB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