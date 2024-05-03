/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, notebookCommon_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JoinCellEdit = void 0;
    class JoinCellEdit {
        constructor(resource, index, direction, cell, selections, inverseRange, insertContent, removedCell, editingDelegate) {
            this.resource = resource;
            this.index = index;
            this.direction = direction;
            this.cell = cell;
            this.selections = selections;
            this.inverseRange = inverseRange;
            this.insertContent = insertContent;
            this.removedCell = removedCell;
            this.editingDelegate = editingDelegate;
            this.type = 0 /* UndoRedoElementType.Resource */;
            this.label = 'Join Cell';
            this.code = 'undoredo.textBufferEdit';
            this._deletedRawCell = this.removedCell.model;
        }
        async undo() {
            if (!this.editingDelegate.insertCell || !this.editingDelegate.createCellViewModel) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            this.cell.textModel?.applyEdits([
                { range: this.inverseRange, text: '' }
            ]);
            this.cell.setSelections(this.selections);
            const cell = this.editingDelegate.createCellViewModel(this._deletedRawCell);
            if (this.direction === 'above') {
                this.editingDelegate.insertCell(this.index, this._deletedRawCell, { kind: notebookCommon_1.SelectionStateType.Handle, primary: cell.handle, selections: [cell.handle] });
                cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
            else {
                this.editingDelegate.insertCell(this.index, cell.model, { kind: notebookCommon_1.SelectionStateType.Handle, primary: this.cell.handle, selections: [this.cell.handle] });
                this.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
        async redo() {
            if (!this.editingDelegate.deleteCell) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            await this.cell.resolveTextModel();
            this.cell.textModel?.applyEdits([
                { range: this.inverseRange, text: this.insertContent }
            ]);
            this.editingDelegate.deleteCell(this.index, { kind: notebookCommon_1.SelectionStateType.Handle, primary: this.cell.handle, selections: [this.cell.handle] });
            this.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
        }
    }
    exports.JoinCellEdit = JoinCellEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEVkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld01vZGVsL2NlbGxFZGl0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBYSxZQUFZO1FBS3hCLFlBQ1EsUUFBYSxFQUNaLEtBQWEsRUFDYixTQUE0QixFQUM1QixJQUF1QixFQUN2QixVQUF1QixFQUN2QixZQUFtQixFQUNuQixhQUFxQixFQUNyQixXQUE4QixFQUM5QixlQUF5QztZQVIxQyxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ1osVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBQzVCLFNBQUksR0FBSixJQUFJLENBQW1CO1lBQ3ZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdkIsaUJBQVksR0FBWixZQUFZLENBQU87WUFDbkIsa0JBQWEsR0FBYixhQUFhLENBQVE7WUFDckIsZ0JBQVcsR0FBWCxXQUFXLENBQW1CO1lBQzlCLG9CQUFlLEdBQWYsZUFBZSxDQUEwQjtZQWJsRCxTQUFJLHdDQUE4RDtZQUNsRSxVQUFLLEdBQVcsV0FBVyxDQUFDO1lBQzVCLFNBQUksR0FBVyx5QkFBeUIsQ0FBQztZQWF4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1FBQy9DLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSTtZQUNULElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDbkYsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUVuQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7Z0JBQy9CLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTthQUN0QyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDNUUsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUNBQWtCLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hKLElBQUksQ0FBQyxTQUFTLEdBQUcsK0JBQWEsQ0FBQyxNQUFNLENBQUM7WUFDdkMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxtQ0FBa0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN4SixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRywrQkFBYSxDQUFDLE1BQU0sQ0FBQztZQUM1QyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJO1lBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztZQUN2RSxDQUFDO1lBRUQsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDO2dCQUMvQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFO2FBQ3RELENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUNBQWtCLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1SSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRywrQkFBYSxDQUFDLE1BQU0sQ0FBQztRQUM1QyxDQUFDO0tBQ0Q7SUF2REQsb0NBdURDIn0=