/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveCaretCommand = void 0;
    class MoveCaretCommand {
        constructor(selection, isMovingLeft) {
            this._selection = selection;
            this._isMovingLeft = isMovingLeft;
        }
        getEditOperations(model, builder) {
            if (this._selection.startLineNumber !== this._selection.endLineNumber || this._selection.isEmpty()) {
                return;
            }
            const lineNumber = this._selection.startLineNumber;
            const startColumn = this._selection.startColumn;
            const endColumn = this._selection.endColumn;
            if (this._isMovingLeft && startColumn === 1) {
                return;
            }
            if (!this._isMovingLeft && endColumn === model.getLineMaxColumn(lineNumber)) {
                return;
            }
            if (this._isMovingLeft) {
                const rangeBefore = new range_1.Range(lineNumber, startColumn - 1, lineNumber, startColumn);
                const charBefore = model.getValueInRange(rangeBefore);
                builder.addEditOperation(rangeBefore, null);
                builder.addEditOperation(new range_1.Range(lineNumber, endColumn, lineNumber, endColumn), charBefore);
            }
            else {
                const rangeAfter = new range_1.Range(lineNumber, endColumn, lineNumber, endColumn + 1);
                const charAfter = model.getValueInRange(rangeAfter);
                builder.addEditOperation(rangeAfter, null);
                builder.addEditOperation(new range_1.Range(lineNumber, startColumn, lineNumber, startColumn), charAfter);
            }
        }
        computeCursorState(model, helper) {
            if (this._isMovingLeft) {
                return new selection_1.Selection(this._selection.startLineNumber, this._selection.startColumn - 1, this._selection.endLineNumber, this._selection.endColumn - 1);
            }
            else {
                return new selection_1.Selection(this._selection.startLineNumber, this._selection.startColumn + 1, this._selection.endLineNumber, this._selection.endColumn + 1);
            }
        }
    }
    exports.MoveCaretCommand = MoveCaretCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZUNhcmV0Q29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY2FyZXRPcGVyYXRpb25zL2Jyb3dzZXIvbW92ZUNhcmV0Q29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxnQkFBZ0I7UUFLNUIsWUFBWSxTQUFvQixFQUFFLFlBQXFCO1lBQ3RELElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1FBQ25DLENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxLQUFpQixFQUFFLE9BQThCO1lBQ3pFLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEtBQUssSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO2dCQUNwRyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDO1lBQ25ELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO1lBQ2hELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO1lBQzVDLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzdDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksU0FBUyxLQUFLLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUM3RSxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixNQUFNLFdBQVcsR0FBRyxJQUFJLGFBQUssQ0FBQyxVQUFVLEVBQUUsV0FBVyxHQUFHLENBQUMsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQ3BGLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3RELE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGFBQUssQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMvRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxVQUFVLEdBQUcsSUFBSSxhQUFLLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRCxPQUFPLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxhQUFLLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbEcsQ0FBQztRQUNGLENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxLQUFpQixFQUFFLE1BQWdDO1lBQzVFLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixPQUFPLElBQUkscUJBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEosQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sSUFBSSxxQkFBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0SixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBNUNELDRDQTRDQyJ9