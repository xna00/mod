/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellMetadataEdit = exports.SpliceCellsEdit = exports.MoveCellEdit = void 0;
    class MoveCellEdit {
        get label() {
            return this.length === 1 ? 'Move Cell' : 'Move Cells';
        }
        constructor(resource, fromIndex, length, toIndex, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.fromIndex = fromIndex;
            this.length = length;
            this.toIndex = toIndex;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.code = 'undoredo.textBufferEdit';
        }
        undo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.toIndex, this.length, this.fromIndex, this.endSelections, this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.fromIndex, this.length, this.toIndex, this.beforedSelections, this.endSelections);
        }
    }
    exports.MoveCellEdit = MoveCellEdit;
    class SpliceCellsEdit {
        get label() {
            // Compute the most appropriate labels
            if (this.diffs.length === 1 && this.diffs[0][1].length === 0) {
                return this.diffs[0][2].length > 1 ? 'Insert Cells' : 'Insert Cell';
            }
            if (this.diffs.length === 1 && this.diffs[0][2].length === 0) {
                return this.diffs[0][1].length > 1 ? 'Delete Cells' : 'Delete Cell';
            }
            // Default to Insert Cell
            return 'Insert Cell';
        }
        constructor(resource, diffs, editingDelegate, beforeHandles, endHandles) {
            this.resource = resource;
            this.diffs = diffs;
            this.editingDelegate = editingDelegate;
            this.beforeHandles = beforeHandles;
            this.endHandles = endHandles;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.code = 'undoredo.textBufferEdit';
        }
        undo() {
            if (!this.editingDelegate.replaceCell) {
                throw new Error('Notebook Replace Cell not implemented for Undo/Redo');
            }
            this.diffs.forEach(diff => {
                this.editingDelegate.replaceCell(diff[0], diff[2].length, diff[1], this.beforeHandles);
            });
        }
        redo() {
            if (!this.editingDelegate.replaceCell) {
                throw new Error('Notebook Replace Cell not implemented for Undo/Redo');
            }
            this.diffs.reverse().forEach(diff => {
                this.editingDelegate.replaceCell(diff[0], diff[1].length, diff[2], this.endHandles);
            });
        }
    }
    exports.SpliceCellsEdit = SpliceCellsEdit;
    class CellMetadataEdit {
        constructor(resource, index, oldMetadata, newMetadata, editingDelegate) {
            this.resource = resource;
            this.index = index;
            this.oldMetadata = oldMetadata;
            this.newMetadata = newMetadata;
            this.editingDelegate = editingDelegate;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.label = 'Update Cell Metadata';
            this.code = 'undoredo.textBufferEdit';
        }
        undo() {
            if (!this.editingDelegate.updateCellMetadata) {
                return;
            }
            this.editingDelegate.updateCellMetadata(this.index, this.oldMetadata);
        }
        redo() {
            if (!this.editingDelegate.updateCellMetadata) {
                return;
            }
            this.editingDelegate.updateCellMetadata(this.index, this.newMetadata);
        }
    }
    exports.CellMetadataEdit = CellMetadataEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEVkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9tb2RlbC9jZWxsRWRpdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQWEsWUFBWTtRQUV4QixJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztRQUN2RCxDQUFDO1FBR0QsWUFDUSxRQUFhLEVBQ1osU0FBaUIsRUFDakIsTUFBYyxFQUNkLE9BQWUsRUFDZixlQUF5QyxFQUN6QyxpQkFBOEMsRUFDOUMsYUFBMEM7WUFOM0MsYUFBUSxHQUFSLFFBQVEsQ0FBSztZQUNaLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFDZixvQkFBZSxHQUFmLGVBQWUsQ0FBMEI7WUFDekMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUE2QjtZQUM5QyxrQkFBYSxHQUFiLGFBQWEsQ0FBNkI7WUFibkQsU0FBSSx3Q0FBOEQ7WUFJbEUsU0FBSSxHQUFXLHlCQUF5QixDQUFDO1FBV3pDLENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJ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