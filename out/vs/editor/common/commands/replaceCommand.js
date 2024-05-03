/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/selection"], function (require, exports, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplaceCommandThatPreservesSelection = exports.ReplaceCommandWithOffsetCursorState = exports.ReplaceCommandWithoutChangingPosition = exports.ReplaceCommandThatSelectsText = exports.ReplaceCommand = void 0;
    class ReplaceCommand {
        constructor(range, text, insertsAutoWhitespace = false) {
            this._range = range;
            this._text = text;
            this.insertsAutoWhitespace = insertsAutoWhitespace;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromPositions(srcRange.getEndPosition());
        }
    }
    exports.ReplaceCommand = ReplaceCommand;
    class ReplaceCommandThatSelectsText {
        constructor(range, text) {
            this._range = range;
            this._text = text;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromRange(srcRange, 0 /* SelectionDirection.LTR */);
        }
    }
    exports.ReplaceCommandThatSelectsText = ReplaceCommandThatSelectsText;
    class ReplaceCommandWithoutChangingPosition {
        constructor(range, text, insertsAutoWhitespace = false) {
            this._range = range;
            this._text = text;
            this.insertsAutoWhitespace = insertsAutoWhitespace;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromPositions(srcRange.getStartPosition());
        }
    }
    exports.ReplaceCommandWithoutChangingPosition = ReplaceCommandWithoutChangingPosition;
    class ReplaceCommandWithOffsetCursorState {
        constructor(range, text, lineNumberDeltaOffset, columnDeltaOffset, insertsAutoWhitespace = false) {
            this._range = range;
            this._text = text;
            this._columnDeltaOffset = columnDeltaOffset;
            this._lineNumberDeltaOffset = lineNumberDeltaOffset;
            this.insertsAutoWhitespace = insertsAutoWhitespace;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromPositions(srcRange.getEndPosition().delta(this._lineNumberDeltaOffset, this._columnDeltaOffset));
        }
    }
    exports.ReplaceCommandWithOffsetCursorState = ReplaceCommandWithOffsetCursorState;
    class ReplaceCommandThatPreservesSelection {
        constructor(editRange, text, initialSelection, forceMoveMarkers = false) {
            this._range = editRange;
            this._text = text;
            this._initialSelection = initialSelection;
            this._forceMoveMarkers = forceMoveMarkers;
            this._selectionId = null;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text, this._forceMoveMarkers);
            this._selectionId = builder.trackSelection(this._initialSelection);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        }
    }
    exports.ReplaceCommandThatPreservesSelection = ReplaceCommandThatPreservesSelection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZUNvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29tbWFuZHMvcmVwbGFjZUNvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsY0FBYztRQU0xQixZQUFZLEtBQVksRUFBRSxJQUFZLEVBQUUsd0JBQWlDLEtBQUs7WUFDN0UsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDO1FBQ3BELENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxLQUFpQixFQUFFLE9BQThCO1lBQ3pFLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRU0sa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxNQUFnQztZQUM1RSxNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ2hFLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNoRCxPQUFPLHFCQUFTLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQzNELENBQUM7S0FDRDtJQXJCRCx3Q0FxQkM7SUFFRCxNQUFhLDZCQUE2QjtRQUt6QyxZQUFZLEtBQVksRUFBRSxJQUFZO1lBQ3JDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ25CLENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxLQUFpQixFQUFFLE9B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