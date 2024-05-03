/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/editOperation", "vs/editor/common/core/range"], function (require, exports, editOperation_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SortLinesCommand = void 0;
    class SortLinesCommand {
        static { this._COLLATOR = null; }
        static getCollator() {
            if (!SortLinesCommand._COLLATOR) {
                SortLinesCommand._COLLATOR = new Intl.Collator();
            }
            return SortLinesCommand._COLLATOR;
        }
        constructor(selection, descending) {
            this.selection = selection;
            this.descending = descending;
            this.selectionId = null;
        }
        getEditOperations(model, builder) {
            const op = sortLines(model, this.selection, this.descending);
            if (op) {
                builder.addEditOperation(op.range, op.text);
            }
            this.selectionId = builder.trackSelection(this.selection);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this.selectionId);
        }
        static canRun(model, selection, descending) {
            if (model === null) {
                return false;
            }
            const data = getSortData(model, selection, descending);
            if (!data) {
                return false;
            }
            for (let i = 0, len = data.before.length; i < len; i++) {
                if (data.before[i] !== data.after[i]) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.SortLinesCommand = SortLinesCommand;
    function getSortData(model, selection, descending) {
        const startLineNumber = selection.startLineNumber;
        let endLineNumber = selection.endLineNumber;
        if (selection.endColumn === 1) {
            endLineNumber--;
        }
        // Nothing to sort if user didn't select anything.
        if (startLineNumber >= endLineNumber) {
            return null;
        }
        const linesToSort = [];
        // Get the contents of the selection to be sorted.
        for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
            linesToSort.push(model.getLineContent(lineNumber));
        }
        let sorted = linesToSort.slice(0);
        sorted.sort(SortLinesCommand.getCollator().compare);
        // If descending, reverse the order.
        if (descending === true) {
            sorted = sorted.reverse();
        }
        return {
            startLineNumber: startLineNumber,
            endLineNumber: endLineNumber,
            before: linesToSort,
            after: sorted
        };
    }
    /**
     * Generate commands for sorting lines on a model.
     */
    function sortLines(model, selection, descending) {
        const data = getSortData(model, selection, descending);
        if (!data) {
            return null;
        }
        return editOperation_1.EditOperation.replace(new range_1.Range(data.startLineNumber, 1, data.endLineNumber, model.getLineMaxColumn(data.endLineNumber)), data.after.join('\n'));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ydExpbmVzQ29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvbGluZXNPcGVyYXRpb25zL2Jyb3dzZXIvc29ydExpbmVzQ29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxnQkFBZ0I7aUJBRWIsY0FBUyxHQUF5QixJQUFJLENBQUM7UUFDL0MsTUFBTSxDQUFDLFdBQVc7WUFDeEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNqQyxnQkFBZ0IsQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEQsQ0FBQztZQUNELE9BQU8sZ0JBQWdCLENBQUMsU0FBUyxDQUFDO1FBQ25DLENBQUM7UUFNRCxZQUFZLFNBQW9CLEVBQUUsVUFBbUI7WUFDcEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7WUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDekIsQ0FBQztRQUVNLGlCQUFpQixDQUFDLEtBQWlCLEVBQUUsT0FBOEI7WUFDekUsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM3RCxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUNSLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRU0sa0JBQWtCLENBQUMsS0FBaUIsRUFBRSxNQUFnQztZQUM1RSxPQUFPLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsV0FBWSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVNLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBd0IsRUFBRSxTQUFvQixFQUFFLFVBQW1CO1lBQ3ZGLElBQUksS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNwQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUV2RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDeEQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDdEMsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7O0lBbkRGLDRDQW9EQztJQUVELFNBQVMsV0FBVyxDQUFDLEtBQWlCLEVBQUUsU0FBb0IsRUFBRSxVQUFtQjtRQUNoRixNQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDO1FBQ2xELElBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUM7UUFFNUMsSUFBSSxTQUFTLENBQUMsU0FBUyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQy9CLGFBQWEsRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRCxrREFBa0Q7UUFDbEQsSUFBSSxlQUFlLElBQUksYUFBYSxFQUFFLENBQUM7WUFDdEMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1FBRWpDLGtEQUFrRDtRQUNsRCxLQUFLLElBQUksVUFBVSxHQUFHLGVBQWUsRUFBRSxVQUFVLElBQUksYUFBYSxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7WUFDbEYsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwRCxvQ0FBb0M7UUFDcEMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDekIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsT0FBTztZQUNOLGVBQWUsRUFBRSxlQUFlO1lBQ2hDLGFBQWEsRUFBRSxhQUFhO1lBQzVCLE1BQU0sRUFBRSxXQUFXO1lBQ25CLEtBQUssRUFBRSxNQUFNO1NBQ2IsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILFNBQVMsU0FBUyxDQUFDLEtBQWlCLEVBQUUsU0FBb0IsRUFBRSxVQUFtQjtRQUM5RSxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUV2RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxPQUFPLDZCQUFhLENBQUMsT0FBTyxDQUMzQixJQUFJLGFBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsRUFDbEcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ3JCLENBQUM7SUFDSCxDQUFDIn0=