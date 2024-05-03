/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositionSurroundSelectionCommand = exports.SurroundSelectionCommand = void 0;
    class SurroundSelectionCommand {
        constructor(range, charBeforeSelection, charAfterSelection) {
            this._range = range;
            this._charBeforeSelection = charBeforeSelection;
            this._charAfterSelection = charAfterSelection;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(new range_1.Range(this._range.startLineNumber, this._range.startColumn, this._range.startLineNumber, this._range.startColumn), this._charBeforeSelection);
            builder.addTrackedEditOperation(new range_1.Range(this._range.endLineNumber, this._range.endColumn, this._range.endLineNumber, this._range.endColumn), this._charAfterSelection);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const firstOperationRange = inverseEditOperations[0].range;
            const secondOperationRange = inverseEditOperations[1].range;
            return new selection_1.Selection(firstOperationRange.endLineNumber, firstOperationRange.endColumn, secondOperationRange.endLineNumber, secondOperationRange.endColumn - this._charAfterSelection.length);
        }
    }
    exports.SurroundSelectionCommand = SurroundSelectionCommand;
    /**
     * A surround selection command that runs after composition finished.
     */
    class CompositionSurroundSelectionCommand {
        constructor(_position, _text, _charAfter) {
            this._position = _position;
            this._text = _text;
            this._charAfter = _charAfter;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(new range_1.Range(this._position.lineNumber, this._position.column, this._position.lineNumber, this._position.column), this._text + this._charAfter);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const opRange = inverseEditOperations[0].range;
            return new selection_1.Selection(opRange.endLineNumber, opRange.startColumn, opRange.endLineNumber, opRange.endColumn - this._charAfter.length);
        }
    }
    exports.CompositionSurroundSelectionCommand = CompositionSurroundSelectionCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Vycm91bmRTZWxlY3Rpb25Db21tYW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2NvbW1hbmRzL3N1cnJvdW5kU2VsZWN0aW9uQ29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSx3QkFBd0I7UUFLcEMsWUFBWSxLQUFnQixFQUFFLG1CQUEyQixFQUFFLGtCQUEwQjtZQUNwRixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsbUJBQW1CLENBQUM7WUFDaEQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDO1FBQy9DLENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxLQUFpQixFQUFFLE9BQThCO1lBQ3pFLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLGFBQUssQ0FDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQ3ZCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFOUIsT0FBTyxDQUFDLHVCQUF1QixDQUFDLElBQUksYUFBSyxDQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUN6QixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FDckIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRU0sa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxNQUFnQztZQUM1RSxNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQ2hFLE1BQU0sbUJBQW1CLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzNELE1BQU0sb0JBQW9CLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBRTVELE9BQU8sSUFBSSxxQkFBUyxDQUNuQixtQkFBbUIsQ0FBQyxhQUFhLEVBQ2pDLG1CQUFtQixDQUFDLFNBQVMsRUFDN0Isb0JBQW9CLENBQUMsYUFBYSxFQUNsQyxvQkFBb0IsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FDaEUsQ0FBQztRQUNILENBQUM7S0FDRDtJQXZDRCw0REF1Q0M7SUFFRDs7T0FFRztJQUNILE1BQWEsbUNBQW1DO1FBRS9DLFlBQ2tCLFNBQW1CLEVBQ25CLEtBQWEsRUFDYixVQUFrQjtZQUZsQixjQUFTLEdBQVQsU0FBUyxDQUFVO1lBQ25CLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixlQUFVLEdBQVYsVUFBVSxDQUFRO1FBQ2hDLENBQUM7UUFFRSxpQkFBaUIsQ0FBQyxLQUFpQixFQUFFLE9BQThCO1lBQ3pFLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLGFBQUssQ0FDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQ3JCLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUVNLGtCQUFrQixDQUFDLEtBQWlCLEVBQUUsTUFBZ0M7WUFDNUUsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNoRSxNQUFNLE9BQU8sR0FBRyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFL0MsT0FBTyxJQUFJLHFCQUFTLENBQ25CLE9BQU8sQ0FBQyxhQUFhLEVBQ3JCLE9BQU8sQ0FBQyxXQUFXLEVBQ25CLE9BQU8sQ0FBQyxhQUFhLEVBQ3JCLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQzFDLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUE1QkQsa0ZBNEJDIn0=