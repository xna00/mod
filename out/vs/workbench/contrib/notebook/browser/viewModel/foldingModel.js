/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/editor/contrib/folding/browser/foldingRanges", "vs/editor/contrib/folding/browser/syntaxRangeProvider", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, markdownRenderer_1, event_1, lifecycle_1, marked_1, foldingRanges_1, syntaxRangeProvider_1, notebookCommon_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingModel = void 0;
    exports.updateFoldingStateAtIndex = updateFoldingStateAtIndex;
    exports.getMarkdownHeadersInCell = getMarkdownHeadersInCell;
    const foldingRangeLimit = {
        limit: 5000,
        update: () => { }
    };
    class FoldingModel {
        get regions() {
            return this._regions;
        }
        constructor() {
            this._viewModel = null;
            this._viewModelStore = new lifecycle_1.DisposableStore();
            this._onDidFoldingRegionChanges = new event_1.Emitter();
            this.onDidFoldingRegionChanged = this._onDidFoldingRegionChanges.event;
            this._foldingRangeDecorationIds = [];
            this._regions = new foldingRanges_1.FoldingRegions(new Uint32Array(0), new Uint32Array(0));
        }
        dispose() {
            this._onDidFoldingRegionChanges.dispose();
            this._viewModelStore.dispose();
        }
        detachViewModel() {
            this._viewModelStore.clear();
            this._viewModel = null;
        }
        attachViewModel(model) {
            this._viewModel = model;
            this._viewModelStore.add(this._viewModel.onDidChangeViewCells(() => {
                this.recompute();
            }));
            this._viewModelStore.add(this._viewModel.onDidChangeSelection(() => {
                if (!this._viewModel) {
                    return;
                }
                const indexes = (0, notebookRange_1.cellRangesToIndexes)(this._viewModel.getSelections());
                let changed = false;
                indexes.forEach(index => {
                    let regionIndex = this.regions.findRange(index + 1);
                    while (regionIndex !== -1) {
                        if (this._regions.isCollapsed(regionIndex) && index > this._regions.getStartLineNumber(regionIndex) - 1) {
                            this._regions.setCollapsed(regionIndex, false);
                            changed = true;
                        }
                        regionIndex = this._regions.getParentIndex(regionIndex);
                    }
                });
                if (changed) {
                    this._onDidFoldingRegionChanges.fire();
                }
            }));
            this.recompute();
        }
        getRegionAtLine(lineNumber) {
            if (this._regions) {
                const index = this._regions.findRange(lineNumber);
                if (index >= 0) {
                    return this._regions.toRegion(index);
                }
            }
            return null;
        }
        getRegionsInside(region, filter) {
            const result = [];
            const index = region ? region.regionIndex + 1 : 0;
            const endLineNumber = region ? region.endLineNumber : Number.MAX_VALUE;
            if (filter && filter.length === 2) {
                const levelStack = [];
                for (let i = index, len = this._regions.length; i < len; i++) {
                    const current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        while (levelStack.length > 0 && !current.containedBy(levelStack[levelStack.length - 1])) {
                            levelStack.pop();
                        }
                        levelStack.push(current);
                        if (filter(current, levelStack.length)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            else {
                for (let i = index, len = this._regions.length; i < len; i++) {
                    const current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        if (!filter || filter(current)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return result;
        }
        getAllRegionsAtLine(lineNumber, filter) {
            const result = [];
            if (this._regions) {
                let index = this._regions.findRange(lineNumber);
                let level = 1;
                while (index >= 0) {
                    const current = this._regions.toRegion(index);
                    if (!filter || filter(current, level)) {
                        result.push(current);
                    }
                    level++;
                    index = current.parentIndex;
                }
            }
            return result;
        }
        setCollapsed(index, newState) {
            this._regions.setCollapsed(index, newState);
        }
        recompute() {
            if (!this._viewModel) {
                return;
            }
            const viewModel = this._viewModel;
            const cells = viewModel.viewCells;
            const stack = [];
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (cell.cellKind !== notebookCommon_1.CellKind.Markup || cell.language !== 'markdown') {
                    continue;
                }
                const minDepth = Math.min(7, ...Array.from(getMarkdownHeadersInCell(cell.getText()), header => header.depth));
                if (minDepth < 7) {
                    // header 1 to 6
                    stack.push({ index: i, level: minDepth, endIndex: 0 });
                }
            }
            // calculate folding ranges
            const rawFoldingRanges = stack.map((entry, startIndex) => {
                let end = undefined;
                for (let i = startIndex + 1; i < stack.length; ++i) {
                    if (stack[i].level <= entry.level) {
                        end = stack[i].index - 1;
                        break;
                    }
                }
                const endIndex = end !== undefined ? end : cells.length - 1;
                // one based
                return {
                    start: entry.index + 1,
                    end: endIndex + 1,
                    rank: 1
                };
            }).filter(range => range.start !== range.end);
            const newRegions = (0, syntaxRangeProvider_1.sanitizeRanges)(rawFoldingRanges, foldingRangeLimit);
            // restore collased state
            let i = 0;
            const nextCollapsed = () => {
                while (i < this._regions.length) {
                    const isCollapsed = this._regions.isCollapsed(i);
                    i++;
                    if (isCollapsed) {
                        return i - 1;
                    }
                }
                return -1;
            };
            let k = 0;
            let collapsedIndex = nextCollapsed();
            while (collapsedIndex !== -1 && k < newRegions.length) {
                // get the latest range
                const decRange = viewModel.getTrackedRange(this._foldingRangeDecorationIds[collapsedIndex]);
                if (decRange) {
                    const collasedStartIndex = decRange.start;
                    while (k < newRegions.length) {
                        const startIndex = newRegions.getStartLineNumber(k) - 1;
                        if (collasedStartIndex >= startIndex) {
                            newRegions.setCollapsed(k, collasedStartIndex === startIndex);
                            k++;
                        }
                        else {
                            break;
                        }
                    }
                }
                collapsedIndex = nextCollapsed();
            }
            while (k < newRegions.length) {
                newRegions.setCollapsed(k, false);
                k++;
            }
            const cellRanges = [];
            for (let i = 0; i < newRegions.length; i++) {
                const region = newRegions.toRegion(i);
                cellRanges.push({ start: region.startLineNumber - 1, end: region.endLineNumber - 1 });
            }
            // remove old tracked ranges and add new ones
            // TODO@rebornix, implement delta
            this._foldingRangeDecorationIds.forEach(id => viewModel.setTrackedRange(id, null, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */));
            this._foldingRangeDecorationIds = cellRanges.map(region => viewModel.setTrackedRange(null, region, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */)).filter(str => str !== null);
            this._regions = newRegions;
            this._onDidFoldingRegionChanges.fire();
        }
        getMemento() {
            const collapsedRanges = [];
            let i = 0;
            while (i < this._regions.length) {
                const isCollapsed = this._regions.isCollapsed(i);
                if (isCollapsed) {
                    const region = this._regions.toRegion(i);
                    collapsedRanges.push({ start: region.startLineNumber - 1, end: region.endLineNumber - 1 });
                }
                i++;
            }
            return collapsedRanges;
        }
        applyMemento(state) {
            if (!this._viewModel) {
                return false;
            }
            let i = 0;
            let k = 0;
            while (k < state.length && i < this._regions.length) {
                // get the latest range
                const decRange = this._viewModel.getTrackedRange(this._foldingRangeDecorationIds[i]);
                if (decRange) {
                    const collasedStartIndex = state[k].start;
                    while (i < this._regions.length) {
                        const startIndex = this._regions.getStartLineNumber(i) - 1;
                        if (collasedStartIndex >= startIndex) {
                            this._regions.setCollapsed(i, collasedStartIndex === startIndex);
                            i++;
                        }
                        else {
                            break;
                        }
                    }
                }
                k++;
            }
            while (i < this._regions.length) {
                this._regions.setCollapsed(i, false);
                i++;
            }
            return true;
        }
    }
    exports.FoldingModel = FoldingModel;
    function updateFoldingStateAtIndex(foldingModel, index, collapsed) {
        const range = foldingModel.regions.findRange(index + 1);
        foldingModel.setCollapsed(range, collapsed);
    }
    function* getMarkdownHeadersInCell(cellContent) {
        for (const token of marked_1.marked.lexer(cellContent, { gfm: true })) {
            if (token.type === 'heading') {
                yield {
                    depth: token.depth,
                    text: (0, markdownRenderer_1.renderMarkdownAsPlaintext)({ value: token.raw }).trim()
                };
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ01vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXdNb2RlbC9mb2xkaW5nTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa1RoRyw4REFHQztJQUVELDREQVNDO0lBL1NELE1BQU0saUJBQWlCLEdBQXlCO1FBQy9DLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7S0FDakIsQ0FBQztJQUVGLE1BQWEsWUFBWTtRQUl4QixJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQU9EO1lBWlEsZUFBVSxHQUE4QixJQUFJLENBQUM7WUFDcEMsb0JBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQU14QywrQkFBMEIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3pELDhCQUF5QixHQUFnQixJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxDQUFDO1lBRWhGLCtCQUEwQixHQUFhLEVBQUUsQ0FBQztZQUdqRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksOEJBQWMsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELGVBQWU7WUFDZCxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcs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