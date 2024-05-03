/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/selection"], function (require, exports, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InPlaceReplaceCommand = void 0;
    class InPlaceReplaceCommand {
        constructor(editRange, originalSelection, text) {
            this._editRange = editRange;
            this._originalSelection = originalSelection;
            this._text = text;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._editRange, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            if (!this._originalSelection.isEmpty()) {
                // Preserve selection and extends to typed text
                return new selection_1.Selection(srcRange.endLineNumber, srcRange.endColumn - this._text.length, srcRange.endLineNumber, srcRange.endColumn);
            }
            return new selection_1.Selection(srcRange.endLineNumber, Math.min(this._originalSelection.positionColumn, srcRange.endColumn), srcRange.endLineNumber, Math.min(this._originalSelection.positionColumn, srcRange.endColumn));
        }
    }
    exports.InPlaceReplaceCommand = InPlaceReplaceCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5QbGFjZVJlcGxhY2VDb21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pblBsYWNlUmVwbGFjZS9icm93c2VyL2luUGxhY2VSZXBsYWNlQ29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxxQkFBcUI7UUFNakMsWUFBWSxTQUFnQixFQUFFLGlCQUE0QixFQUFFLElBQVk7WUFDdkUsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGlCQUFpQixDQUFDO1lBQzVDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ25CLENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxLQUFpQixFQUFFLE9BQThCO1lBQ3pFLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRU0sa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxNQUFnQztZQUM1RSxNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ2hFLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUVoRCxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7Z0JBQ3hDLCtDQUErQztnQkFDL0MsT0FBTyxJQUFJLHFCQUFTLENBQ25CLFFBQVEsQ0FBQyxhQUFhLEVBQ3RCLFFBQVEsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQ3RDLFFBQVEsQ0FBQyxhQUFhLEVBQ3RCLFFBQVEsQ0FBQyxTQUFTLENBQ2xCLENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxJQUFJLHFCQUFTLENBQ25CLFFBQVEsQ0FBQyxhQUFhLEVBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQ3BFLFFBQVEsQ0FBQyxhQUFhLEVBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQ3BFLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFyQ0Qsc0RBcUNDIn0=