/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplaceAllCommand = void 0;
    class ReplaceAllCommand {
        constructor(editorSelection, ranges, replaceStrings) {
            this._editorSelection = editorSelection;
            this._ranges = ranges;
            this._replaceStrings = replaceStrings;
            this._trackedEditorSelectionId = null;
        }
        getEditOperations(model, builder) {
            if (this._ranges.length > 0) {
                // Collect all edit operations
                const ops = [];
                for (let i = 0; i < this._ranges.length; i++) {
                    ops.push({
                        range: this._ranges[i],
                        text: this._replaceStrings[i]
                    });
                }
                // Sort them in ascending order by range starts
                ops.sort((o1, o2) => {
                    return range_1.Range.compareRangesUsingStarts(o1.range, o2.range);
                });
                // Merge operations that touch each other
                const resultOps = [];
                let previousOp = ops[0];
                for (let i = 1; i < ops.length; i++) {
                    if (previousOp.range.endLineNumber === ops[i].range.startLineNumber && previousOp.range.endColumn === ops[i].range.startColumn) {
                        // These operations are one after another and can be merged
                        previousOp.range = previousOp.range.plusRange(ops[i].range);
                        previousOp.text = previousOp.text + ops[i].text;
                    }
                    else {
                        resultOps.push(previousOp);
                        previousOp = ops[i];
                    }
                }
                resultOps.push(previousOp);
                for (const op of resultOps) {
                    builder.addEditOperation(op.range, op.text);
                }
            }
            this._trackedEditorSelectionId = builder.trackSelection(this._editorSelection);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this._trackedEditorSelectionId);
        }
    }
    exports.ReplaceAllCommand = ReplaceAllCommand;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGFjZUFsbENvbW1hbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2ZpbmQvYnJvd3Nlci9yZXBsYWNlQWxsQ29tbWFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBYSxpQkFBaUI7UUFPN0IsWUFBWSxlQUEwQixFQUFFLE1BQWUsRUFBRSxjQUF3QjtZQUNoRixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1lBQ3RDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUM7UUFDdkMsQ0FBQztRQUVNLGlCQUFpQixDQUFDLEtBQWlCLEVBQUUsT0FBOEI7WUFDekUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsOEJBQThCO2dCQUM5QixNQUFNLEdBQUcsR0FBcUIsRUFBRSxDQUFDO2dCQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDOUMsR0FBRyxDQUFDLElBQUksQ0FBQzt3QkFDUixLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7d0JBQ3RCLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztxQkFDN0IsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsK0NBQStDO2dCQUMvQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO29CQUNuQixPQUFPLGFBQUssQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0QsQ0FBQyxDQUFDLENBQUM7Z0JBRUgseUNBQXlDO2dCQUN6QyxNQUFNLFNBQVMsR0FBcUIsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3JDLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxhQUFhLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDaEksMkRBQTJEO3dCQUMzRCxVQUFVLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDNUQsVUFBVSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ2pELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUMzQixVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFM0IsS0FBSyxNQUFNLEVBQUUsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDNUIsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyx5QkFBeUIsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxLQUFpQixFQUFFLE1BQWdDO1lBQzVFLE9BQU8sTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyx5QkFBMEIsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7S0FDRDtJQXhERCw4Q0F3REMifQ==