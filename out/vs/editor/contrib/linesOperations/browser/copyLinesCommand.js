/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CopyLinesCommand = void 0;
    class CopyLinesCommand {
        constructor(selection, isCopyingDown, noop) {
            this._selection = selection;
            this._isCopyingDown = isCopyingDown;
            this._noop = noop || false;
            this._selectionDirection = 0 /* SelectionDirection.LTR */;
            this._selectionId = null;
            this._startLineNumberDelta = 0;
            this._endLineNumberDelta = 0;
        }
        getEditOperations(model, builder) {
            let s = this._selection;
            this._startLineNumberDelta = 0;
            this._endLineNumberDelta = 0;
            if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                this._endLineNumberDelta = 1;
                s = s.setEndPosition(s.endLineNumber - 1, model.getLineMaxColumn(s.endLineNumber - 1));
            }
            const sourceLines = [];
            for (let i = s.startLineNumber; i <= s.endLineNumber; i++) {
                sourceLines.push(model.getLineContent(i));
            }
            const sourceText = sourceLines.join('\n');
            if (sourceText === '') {
                // Duplicating empty line
                if (this._isCopyingDown) {
                    this._startLineNumberDelta++;
                    this._endLineNumberDelta++;
                }
            }
            if (this._noop) {
                builder.addEditOperation(new range_1.Range(s.endLineNumber, model.getLineMaxColumn(s.endLineNumber), s.endLineNumber + 1, 1), s.endLineNumber === model.getLineCount() ? '' : '\n');
            }
            else {
                if (!this._isCopyingDown) {
                    builder.addEditOperation(new range_1.Range(s.endLineNumber, model.getLineMaxColumn(s.endLineNumber), s.endLineNumber, model.getLineMaxColumn(s.endLineNumber)), '\n' + sourceText);
                }
                else {
                    builder.addEditOperation(new range_1.Range(s.startLineNumber, 1, s.startLineNumber, 1), sourceText + '\n');
                }
            }
            this._selectionId = builder.trackSelection(s);
            this._selectionDirection = this._selection.getDirection();
        }
        computeCursorState(model, helper) {
            let result = helper.getTrackedSelection(this._selectionId);
            if (this._startLineNumberDelta !== 0 || this._endLineNumberDelta !== 0) {
                let startLineNumber = result.startLineNumber;
                let startColumn = result.startColumn;
                let endLineNumber = result.endLineNumber;
                let endColumn = result.endColumn;
                if (this._startLineNumberDelta !== 0) {
                    startLineNumber = startLineNumber + this._startLineNumberDelta;
                    startColumn = 1;
                }
                if (this._endLineNumberDelta !== 0) {
                    endLineNumber = endLineNumber + this._endLineNumberDelta;
                    endColumn = 1;
                }
                result = selection_1.Selection.createWithDirection(startLineNumber, startColumn, endLineNumber, endColumn, this._selectionDirection);
            }
            return result;
        }
    }
    exports.CopyLinesCommand = CopyLinesCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weUxpbmVzQ29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvbGluZXNPcGVyYXRpb25zL2Jyb3dzZXIvY29weUxpbmVzQ29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxnQkFBZ0I7UUFXNUIsWUFBWSxTQUFvQixFQUFFLGFBQXNCLEVBQUUsSUFBYztZQUN2RSxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztZQUNwQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxLQUFLLENBQUM7WUFDM0IsSUFBSSxDQUFDLG1CQUFtQixpQ0FBeUIsQ0FBQztZQUNsRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUN6QixJQUFJLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVNLGlCQUFpQixDQUFDLEtBQWlCLEVBQUUsT0FBOEI7WUFDekUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUV4QixJQUFJLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQztnQkFDN0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLGFBQWEsR0FBRyxDQUFD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