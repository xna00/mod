/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/collections", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, collections_1, event_1, lifecycle_1, types_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookVisibleCellObserver = void 0;
    class NotebookVisibleCellObserver extends lifecycle_1.Disposable {
        get visibleCells() {
            return this._visibleCells;
        }
        constructor(_notebookEditor) {
            super();
            this._notebookEditor = _notebookEditor;
            this._onDidChangeVisibleCells = this._register(new event_1.Emitter());
            this.onDidChangeVisibleCells = this._onDidChangeVisibleCells.event;
            this._viewModelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._visibleCells = [];
            this._register(this._notebookEditor.onDidChangeVisibleRanges(this._updateVisibleCells, this));
            this._register(this._notebookEditor.onDidChangeModel(this._onModelChange, this));
            this._updateVisibleCells();
        }
        _onModelChange() {
            this._viewModelDisposables.clear();
            if (this._notebookEditor.hasModel()) {
                this._viewModelDisposables.add(this._notebookEditor.onDidChangeViewCells(() => this.updateEverything()));
            }
            this.updateEverything();
        }
        updateEverything() {
            this._onDidChangeVisibleCells.fire({ added: [], removed: Array.from(this._visibleCells) });
            this._visibleCells = [];
            this._updateVisibleCells();
        }
        _updateVisibleCells() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const newVisibleCells = (0, notebookRange_1.cellRangesToIndexes)(this._notebookEditor.visibleRanges)
                .map(index => this._notebookEditor.cellAt(index))
                .filter(types_1.isDefined);
            const newVisibleHandles = new Set(newVisibleCells.map(cell => cell.handle));
            const oldVisibleHandles = new Set(this._visibleCells.map(cell => cell.handle));
            const diff = (0, collections_1.diffSets)(oldVisibleHandles, newVisibleHandles);
            const added = diff.added
                .map(handle => this._notebookEditor.getCellByHandle(handle))
                .filter(types_1.isDefined);
            const removed = diff.removed
                .map(handle => this._notebookEditor.getCellByHandle(handle))
                .filter(types_1.isDefined);
            this._visibleCells = newVisibleCells;
            this._onDidChangeVisibleCells.fire({
                added,
                removed
            });
        }
    }
    exports.NotebookVisibleCellObserver = NotebookVisibleCellObserver;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tWaXNpYmxlQ2VsbE9ic2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvY2VsbFN0YXR1c0Jhci9ub3RlYm9va1Zpc2libGVDZWxsT2JzZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQWEsMkJBQTRCLFNBQVEsc0JBQVU7UUFRMUQsSUFBSSxZQUFZO1lBQ2YsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFRCxZQUE2QixlQUFnQztZQUM1RCxLQUFLLEVBQUUsQ0FBQztZQURvQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFYNUMsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBOEIsQ0FBQyxDQUFDO1lBQzdGLDRCQUF1QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFFdEQsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBRXZFLGtCQUFhLEdBQXFCLEVBQUUsQ0FBQztZQVM1QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU8sY0FBYztZQUNyQixJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDbkMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUcsQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3pCLENBQUM7UUFFUyxnQkFBZ0I7WUFDekIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMzRixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU8sbUJBQW1CO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3RDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsSUFBQSxtQ0FBbUIsRUFBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQztpQkFDN0UsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ2hELE1BQU0sQ0FBQyxpQkFBUyxDQUFDLENBQUM7WUFDcEIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sSUFBSSxHQUFHLElBQUEsc0JBQVEsRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRTVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLO2lCQUN0QixHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDM0QsTUFBTSxDQUFDLGlCQUFTLENBQUMsQ0FBQztZQUNwQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTztpQkFDMUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQzNELE1BQU0sQ0FBQyxpQkFBUyxDQUFDLENBQUM7WUFFcEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxlQUFlLENBQUM7WUFDckMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQztnQkFDbEMsS0FBSztnQkFDTCxPQUFPO2FBQ1AsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBNURELGtFQTREQyJ9