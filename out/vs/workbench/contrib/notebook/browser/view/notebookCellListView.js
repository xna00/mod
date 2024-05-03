/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/list/listView", "vs/editor/common/model/prefixSumComputer"], function (require, exports, listView_1, prefixSumComputer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellListView = exports.NotebookCellsLayout = void 0;
    class NotebookCellsLayout {
        get paddingTop() {
            return this._paddingTop;
        }
        set paddingTop(paddingTop) {
            this._size = this._size + paddingTop - this._paddingTop;
            this._paddingTop = paddingTop;
        }
        get count() {
            return this._items.length;
        }
        /**
         * Returns the sum of the sizes of all items in the range map.
         */
        get size() {
            return this._size;
        }
        constructor(topPadding) {
            this._items = [];
            this._whitespace = [];
            this._prefixSumComputer = new prefixSumComputer_1.ConstantTimePrefixSumComputer([]);
            this._size = 0;
            this._paddingTop = 0;
            this._paddingTop = topPadding ?? 0;
            this._size = this._paddingTop;
        }
        getWhitespaces() {
            return this._whitespace;
        }
        restoreWhitespace(items) {
            this._whitespace = items;
            this._size = this._paddingTop + this._items.reduce((total, item) => total + item.size, 0) + this._whitespace.reduce((total, ws) => total + ws.size, 0);
        }
        /**
         */
        splice(index, deleteCount, items) {
            const inserts = items ?? [];
            // Perform the splice operation on the items array.
            this._items.splice(index, deleteCount, ...inserts);
            this._size = this._paddingTop + this._items.reduce((total, item) => total + item.size, 0) + this._whitespace.reduce((total, ws) => total + ws.size, 0);
            this._prefixSumComputer.removeValues(index, deleteCount);
            // inserts should also include whitespaces
            const newSizes = [];
            for (let i = 0; i < inserts.length; i++) {
                const insertIndex = i + index;
                const existingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === insertIndex + 1);
                if (existingWhitespaces.length > 0) {
                    newSizes.push(inserts[i].size + existingWhitespaces.reduce((acc, ws) => acc + ws.size, 0));
                }
                else {
                    newSizes.push(inserts[i].size);
                }
            }
            this._prefixSumComputer.insertValues(index, newSizes);
            // Now that the items array has been updated, and the whitespaces are updated elsewhere, if an item is removed/inserted, the accumlated size of the items are all updated.
            // Loop through all items from the index where the splice started, to the end
            for (let i = index; i < this._items.length; i++) {
                const existingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === i + 1);
                if (existingWhitespaces.length > 0) {
                    this._prefixSumComputer.setValue(i, this._items[i].size + existingWhitespaces.reduce((acc, ws) => acc + ws.size, 0));
                }
                else {
                    this._prefixSumComputer.setValue(i, this._items[i].size);
                }
            }
        }
        insertWhitespace(id, afterPosition, size) {
            let priority = 0;
            const existingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === afterPosition);
            if (existingWhitespaces.length > 0) {
                priority = Math.max(...existingWhitespaces.map(ws => ws.priority)) + 1;
            }
            this._whitespace.push({ id, afterPosition: afterPosition, size, priority });
            this._size += size; // Update the total size to include the whitespace
            this._whitespace.sort((a, b) => {
                if (a.afterPosition === b.afterPosition) {
                    return a.priority - b.priority;
                }
                return a.afterPosition - b.afterPosition;
            });
            // find item size of index
            if (afterPosition > 0) {
                const index = afterPosition - 1;
                const itemSize = this._items[index].size;
                const accSize = itemSize + size;
                this._prefixSumComputer.setValue(index, accSize);
            }
        }
        changeOneWhitespace(id, afterPosition, size) {
            const whitespaceIndex = this._whitespace.findIndex(ws => ws.id === id);
            if (whitespaceIndex !== -1) {
                const whitespace = this._whitespace[whitespaceIndex];
                const oldAfterPosition = whitespace.afterPosition;
                whitespace.afterPosition = afterPosition;
                const oldSize = whitespace.size;
                const delta = size - oldSize;
                whitespace.size = size;
                this._size += delta;
                if (oldAfterPosition > 0 && oldAfterPosition <= this._items.length) {
                    const index = oldAfterPosition - 1;
                    const itemSize = this._items[index].size;
                    const accSize = itemSize;
                    this._prefixSumComputer.setValue(index, accSize);
                }
                if (afterPosition > 0 && afterPosition <= this._items.length) {
                    const index = afterPosition - 1;
                    const itemSize = this._items[index].size;
                    const accSize = itemSize + size;
                    this._prefixSumComputer.setValue(index, accSize);
                }
            }
        }
        removeWhitespace(id) {
            const whitespaceIndex = this._whitespace.findIndex(ws => ws.id === id);
            if (whitespaceIndex !== -1) {
                const whitespace = this._whitespace[whitespaceIndex];
                this._whitespace.splice(whitespaceIndex, 1);
                this._size -= whitespace.size; // Reduce the total size by the size of the removed whitespace
                if (whitespace.afterPosition > 0) {
                    const index = whitespace.afterPosition - 1;
                    const itemSize = this._items[index].size;
                    const remainingWhitespaces = this._whitespace.filter(ws => ws.afterPosition === whitespace.afterPosition);
                    const accSize = itemSize + remainingWhitespaces.reduce((acc, ws) => acc + ws.size, 0);
                    this._prefixSumComputer.setValue(index, accSize);
                }
            }
        }
        /**
         * find position of whitespace
         * @param id: id of the whitespace
         * @returns: position in the list view
         */
        getWhitespacePosition(id) {
            const whitespace = this._whitespace.find(ws => ws.id === id);
            if (!whitespace) {
                throw new Error('Whitespace not found');
            }
            const afterPosition = whitespace.afterPosition;
            if (afterPosition === 0) {
                // find all whitespaces at the same position but with higher priority (smaller number)
                const whitespaces = this._whitespace.filter(ws => ws.afterPosition === afterPosition && ws.priority < whitespace.priority);
                return whitespaces.reduce((acc, ws) => acc + ws.size, 0) + this.paddingTop;
            }
            const whitespaceBeforeFirstItem = this._whitespace.filter(ws => ws.afterPosition === 0).reduce((acc, ws) => acc + ws.size, 0);
            // previous item index
            const index = afterPosition - 1;
            const previousItemPosition = this._prefixSumComputer.getPrefixSum(index);
            const previousItemSize = this._items[index].size;
            const previousWhitespace = this._whitespace.filter(ws => ws.afterPosition === afterPosition - 1);
            const whitespaceBefore = previousWhitespace.reduce((acc, ws) => acc + ws.size, 0);
            return previousItemPosition + previousItemSize + whitespaceBeforeFirstItem + this.paddingTop + whitespaceBefore;
        }
        indexAt(position) {
            if (position < 0) {
                return -1;
            }
            const whitespaceBeforeFirstItem = this._whitespace.filter(ws => ws.afterPosition === 0).reduce((acc, ws) => acc + ws.size, 0);
            const offset = position - (this._paddingTop + whitespaceBeforeFirstItem);
            if (offset <= 0) {
                return 0;
            }
            if (offset >= (this._size - this._paddingTop - whitespaceBeforeFirstItem)) {
                return this.count;
            }
            return this._prefixSumComputer.getIndexOf(offset).index;
        }
        indexAfter(position) {
            const index = this.indexAt(position);
            return Math.min(index + 1, this._items.length);
        }
        positionAt(index) {
            if (index < 0) {
                return -1;
            }
            if (this.count === 0) {
                return -1;
            }
            // index is zero based, if index+1 > this.count, then it points to the fictitious element after the last element of this array.
            if (index >= this.count) {
                return -1;
            }
            const whitespaceBeforeFirstItem = this._whitespace.filter(ws => ws.afterPosition === 0).reduce((acc, ws) => acc + ws.size, 0);
            return this._prefixSumComputer.getPrefixSum(index /** count */) + this._paddingTop + whitespaceBeforeFirstItem;
        }
    }
    exports.NotebookCellsLayout = NotebookCellsLayout;
    class NotebookCellListView extends listView_1.ListView {
        constructor() {
            super(...arguments);
            this._lastWhitespaceId = 0;
            this._renderingStack = 0;
        }
        get inRenderingTransaction() {
            return this._renderingStack > 0;
        }
        get notebookRangeMap() {
            return this.rangeMap;
        }
        render(previousRenderRange, renderTop, renderHeight, renderLeft, scrollWidth, updateItemsInDOM) {
            this._renderingStack++;
            super.render(previousRenderRange, renderTop, renderHeight, renderLeft, scrollWidth, updateItemsInDOM);
            this._renderingStack--;
        }
        _rerender(renderTop, renderHeight, inSmoothScrolling) {
            this._renderingStack++;
            super._rerender(renderTop, renderHeight, inSmoothScrolling);
            this._renderingStack--;
        }
        createRangeMap(paddingTop) {
            const existingMap = this.rangeMap;
            if (existingMap) {
                const layout = new NotebookCellsLayout(paddingTop);
                layout.restoreWhitespace(existingMap.getWhitespaces());
                return layout;
            }
            else {
                return new NotebookCellsLayout(paddingTop);
            }
        }
        insertWhitespace(afterPosition, size) {
            const scrollTop = this.scrollTop;
            const id = `${++this._lastWhitespaceId}`;
            const previousRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            const elementPosition = this.elementTop(afterPosition);
            const aboveScrollTop = scrollTop > elementPosition;
            this.notebookRangeMap.insertWhitespace(id, afterPosition, size);
            const newScrolltop = aboveScrollTop ? scrollTop + size : scrollTop;
            this.render(previousRenderRange, newScrolltop, this.lastRenderHeight, undefined, undefined, false);
            this._rerender(newScrolltop, this.renderHeight, false);
            this.eventuallyUpdateScrollDimensions();
            return id;
        }
        changeOneWhitespace(id, newAfterPosition, newSize) {
            this.notebookRangeMap.changeOneWhitespace(id, newAfterPosition, newSize);
            this.eventuallyUpdateScrollDimensions();
        }
        removeWhitespace(id) {
            const scrollTop = this.scrollTop;
            const previousRenderRange = this.getRenderRange(this.lastRenderTop, this.lastRenderHeight);
            const currentPosition = this.notebookRangeMap.getWhitespacePosition(id);
            if (currentPosition > scrollTop) {
                this.notebookRangeMap.removeWhitespace(id);
                this.render(previousRenderRange, scrollTop, this.lastRenderHeight, undefined, undefined, false);
                this._rerender(scrollTop, this.renderHeight, false);
                this.eventuallyUpdateScrollDimensions();
            }
            else {
                this.notebookRangeMap.removeWhitespace(id);
                this.eventuallyUpdateScrollDimensions();
            }
        }
        getWhitespacePosition(id) {
            return this.notebookRangeMap.getWhitespacePosition(id);
        }
    }
    exports.NotebookCellListView = NotebookCellListView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsTGlzdFZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9ub3RlYm9va0NlbGxMaXN0Vmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsbUJBQW1CO1FBTy9CLElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsSUFBSSxVQUFVLENBQUMsVUFBa0I7WUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3hELElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzNCLENBQUM7UUFFRDs7V0FFRztRQUNILElBQUksSUFBSTtZQUNQLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRUQsWUFBWSxVQUFtQjtZQTFCdkIsV0FBTSxHQUFZLEVBQUUsQ0FBQztZQUNyQixnQkFBVyxHQUFrQixFQUFFLENBQUM7WUFDOUIsdUJBQWtCLEdBQWtDLElBQUksaURBQTZCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDNUYsVUFBSyxHQUFHLENBQUMsQ0FBQztZQUNWLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1lBdUJ2QixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsSUFBSSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQy9CLENBQUM7UUFFRCxjQUFjO1lBQ2IsT0FBTyxJQUFJ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