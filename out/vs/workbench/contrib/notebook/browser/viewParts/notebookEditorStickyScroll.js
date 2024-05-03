/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/browser/mouseEvent", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/async", "vs/base/common/themables", "vs/editor/contrib/folding/browser/foldingDecorations", "vs/workbench/contrib/notebook/browser/controller/foldingController"], function (require, exports, DOM, touch_1, mouseEvent_1, event_1, lifecycle_1, actions_1, contextView_1, notebookCommon_1, async_1, themables_1, foldingDecorations_1, foldingController_1) {
    "use strict";
    var NotebookStickyScroll_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookStickyScroll = exports.NotebookStickyLine = void 0;
    exports.computeContent = computeContent;
    class NotebookStickyLine extends lifecycle_1.Disposable {
        constructor(element, foldingIcon, header, entry, notebookEditor) {
            super();
            this.element = element;
            this.foldingIcon = foldingIcon;
            this.header = header;
            this.entry = entry;
            this.notebookEditor = notebookEditor;
            // click the header to focus the cell
            this._register(DOM.addDisposableListener(this.header, DOM.EventType.CLICK || touch_1.EventType.Tap, () => {
                this.focusCell();
            }));
            // click the folding icon to fold the range covered by the header
            this._register(DOM.addDisposableListener(this.foldingIcon.domNode, DOM.EventType.CLICK || touch_1.EventType.Tap, () => {
                if (this.entry.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                    const currentFoldingState = this.entry.cell.foldingState;
                    this.toggleFoldRange(currentFoldingState);
                }
            }));
        }
        toggleFoldRange(currentState) {
            const foldingController = this.notebookEditor.getContribution(foldingController_1.FoldingController.id);
            const index = this.entry.index;
            const headerLevel = this.entry.level;
            const newFoldingState = (currentState === 2 /* CellFoldingState.Collapsed */) ? 1 /* CellFoldingState.Expanded */ : 2 /* CellFoldingState.Collapsed */;
            foldingController.setFoldingStateDown(index, newFoldingState, headerLevel);
            this.focusCell();
        }
        focusCell() {
            this.notebookEditor.focusNotebookCell(this.entry.cell, 'container');
            const cellScrollTop = this.notebookEditor.getAbsoluteTopOfElement(this.entry.cell);
            const parentCount = NotebookStickyLine.getParentCount(this.entry);
            // 1.1 addresses visible cell padding, to make sure we don't focus md cell and also render its sticky line
            this.notebookEditor.setScrollTop(cellScrollTop - (parentCount + 1.1) * 22);
        }
        static getParentCount(entry) {
            let count = 0;
            while (entry.parent) {
                count++;
                entry = entry.parent;
            }
            return count;
        }
    }
    exports.NotebookStickyLine = NotebookStickyLine;
    class StickyFoldingIcon {
        constructor(isCollapsed, dimension) {
            this.isCollapsed = isCollapsed;
            this.dimension = dimension;
            this.domNode = document.createElement('div');
            this.domNode.style.width = `${dimension}px`;
            this.domNode.style.height = `${dimension}px`;
            this.domNode.className = themables_1.ThemeIcon.asClassName(isCollapsed ? foldingDecorations_1.foldingCollapsedIcon : foldingDecorations_1.foldingExpandedIcon);
        }
        setVisible(visible) {
            this.domNode.style.cursor = visible ? 'pointer' : 'default';
            this.domNode.style.opacity = visible ? '1' : '0';
        }
    }
    let NotebookStickyScroll = NotebookStickyScroll_1 = class NotebookStickyScroll extends lifecycle_1.Disposable {
        getDomNode() {
            return this.domNode;
        }
        getCurrentStickyHeight() {
            let height = 0;
            this.currentStickyLines.forEach((value) => {
                if (value.rendered) {
                    height += 22;
                }
            });
            return height;
        }
        setCurrentStickyLines(newStickyLines) {
            this.currentStickyLines = newStickyLines;
        }
        compareStickyLineMaps(mapA, mapB) {
            if (mapA.size !== mapB.size) {
                return false;
            }
            for (const [key, value] of mapA) {
                const otherValue = mapB.get(key);
                if (!otherValue || value.rendered !== otherValue.rendered) {
                    return false;
                }
            }
            return true;
        }
        constructor(domNode, notebookEditor, notebookOutline, notebookCellList, _contextMenuService) {
            super();
            this.domNode = domNode;
            this.notebookEditor = notebookEditor;
            this.notebookOutline = notebookOutline;
            this.notebookCellList = notebookCellList;
            this._contextMenuService = _contextMenuService;
            this._disposables = new lifecycle_1.DisposableStore();
            this.currentStickyLines = new Map();
            this._onDidChangeNotebookStickyScroll = this._register(new event_1.Emitter());
            this.onDidChangeNotebookStickyScroll = this._onDidChangeNotebookStickyScroll.event;
            if (this.notebookEditor.notebookOptions.getDisplayOptions().stickyScrollEnabled) {
                this.init();
            }
            this._register(this.notebookEditor.notebookOptions.onDidChangeOptions((e) => {
                if (e.stickyScrollEnabled || e.stickyScrollMode) {
                    this.updateConfig(e);
                }
            }));
            this._register(DOM.addDisposableListener(this.domNode, DOM.EventType.CONTEXT_MENU, async (event) => {
                this.onContextMenu(event);
            }));
        }
        onContextMenu(e) {
            const event = new mouseEvent_1.StandardMouseEvent(DOM.getWindow(this.domNode), e);
            const selectedElement = event.target.parentElement;
            const selectedOutlineEntry = Array.from(this.currentStickyLines.values()).find(entry => entry.line.element.contains(selectedElement))?.line.entry;
            if (!selectedOutlineEntry) {
                return;
            }
            const args = {
                outlineEntry: selectedOutlineEntry,
                notebookEditor: this.notebookEditor,
            };
            this._contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.NotebookStickyScrollContext,
                getAnchor: () => event,
                menuActionOptions: { shouldForwardArgs: true, arg: args },
            });
        }
        updateConfig(e) {
            if (e.stickyScrollEnabled) {
                if (this.notebookEditor.notebookOptions.getDisplayOptions().stickyScrollEnabled) {
                    this.init();
                }
                else {
                    this._disposables.clear();
                    this.notebookOutline.dispose();
                    this.disposeCurrentStickyLines();
                    DOM.clearNode(this.domNode);
                    this.updateDisplay();
                }
            }
            else if (e.stickyScrollMode && this.notebookEditor.notebookOptions.getDisplayOptions().stickyScrollEnabled) {
                this.updateContent(computeContent(this.notebookEditor, this.notebookCellList, this.notebookOutline.entries, this.getCurrentStickyHeight()));
            }
        }
        init() {
            this.notebookOutline.init();
            this.updateContent(computeContent(this.notebookEditor, this.notebookCellList, this.notebookOutline.entries, this.getCurrentStickyHeight()));
            this._disposables.add(this.notebookOutline.onDidChange(() => {
                const recompute = computeContent(this.notebookEditor, this.notebookCellList, this.notebookOutline.entries, this.getCurrentStickyHeight());
                if (!this.compareStickyLineMaps(recompute, this.currentStickyLines)) {
                    this.updateContent(recompute);
                }
            }));
            this._disposables.add(this.notebookEditor.onDidAttachViewModel(() => {
                this.notebookOutline.init();
                this.updateContent(computeContent(this.notebookEditor, this.notebookCellList, this.notebookOutline.entries, this.getCurrentStickyHeight()));
            }));
            this._disposables.add(this.notebookEditor.onDidScroll(() => {
                const d = new async_1.Delayer(100);
                d.trigger(() => {
                    d.dispose();
                    const recompute = computeContent(this.notebookEditor, this.notebookCellList, this.notebookOutline.entries, this.getCurrentStickyHeight());
                    if (!this.compareStickyLineMaps(recompute, this.currentStickyLines)) {
                        this.updateContent(recompute);
                    }
                });
            }));
        }
        // take in an cell index, and get the corresponding outline entry
        static getVisibleOutlineEntry(visibleIndex, notebookOutlineEntries) {
            let left = 0;
            let right = notebookOutlineEntries.length - 1;
            let bucket = -1;
            while (left <= right) {
                const mid = Math.floor((left + right) / 2);
                if (notebookOutlineEntries[mid].index === visibleIndex) {
                    bucket = mid;
                    break;
                }
                else if (notebookOutlineEntries[mid].index < visibleIndex) {
                    bucket = mid;
                    left = mid + 1;
                }
                else {
                    right = mid - 1;
                }
            }
            if (bucket !== -1) {
                const rootEntry = notebookOutlineEntries[bucket];
                const flatList = [];
                rootEntry.asFlatList(flatList);
                return flatList.find(entry => entry.index === visibleIndex);
            }
            return undefined;
        }
        updateContent(newMap) {
            DOM.clearNode(this.domNode);
            this.disposeCurrentStickyLines();
            this.renderStickyLines(newMap, this.domNode);
            const oldStickyHeight = this.getCurrentStickyHeight();
            this.setCurrentStickyLines(newMap);
            // (+) = sticky height increased
            // (-) = sticky height decreased
            const sizeDelta = this.getCurrentStickyHeight() - oldStickyHeight;
            if (sizeDelta !== 0) {
                this._onDidChangeNotebookStickyScroll.fire(sizeDelta);
            }
            this.updateDisplay();
        }
        updateDisplay() {
            const hasSticky = this.getCurrentStickyHeight() > 0;
            if (!hasSticky) {
                this.domNode.style.display = 'none';
            }
            else {
                this.domNode.style.display = 'block';
            }
        }
        static computeStickyHeight(entry) {
            let height = 0;
            if (entry.cell.cellKind === notebookCommon_1.CellKind.Markup && entry.level < 7) {
                height += 22;
            }
            while (entry.parent) {
                height += 22;
                entry = entry.parent;
            }
            return height;
        }
        static checkCollapsedStickyLines(entry, numLinesToRender, notebookEditor) {
            let currentEntry = entry;
            const newMap = new Map();
            const elementsToRender = [];
            while (currentEntry) {
                if (currentEntry.level >= 7) {
                    // level 7+ represents a non-header entry, which we don't want to render
                    currentEntry = currentEntry.parent;
                    continue;
                }
                const lineToRender = NotebookStickyScroll_1.createStickyElement(currentEntry, notebookEditor);
                newMap.set(currentEntry, { line: lineToRender, rendered: false });
                elementsToRender.unshift(lineToRender);
                currentEntry = currentEntry.parent;
            }
            // iterate over elements to render, and append to container
            // break when we reach numLinesToRender
            for (let i = 0; i < elementsToRender.length; i++) {
                if (i >= numLinesToRender) {
                    break;
                }
                newMap.set(elementsToRender[i].entry, { line: elementsToRender[i], rendered: true });
            }
            return newMap;
        }
        renderStickyLines(stickyMap, containerElement) {
            const reversedEntries = Array.from(stickyMap.entries()).reverse();
            for (const [, value] of reversedEntries) {
                if (!value.rendered) {
                    continue;
                }
                containerElement.append(value.line.element);
            }
        }
        static createStickyElement(entry, notebookEditor) {
            const stickyElement = document.createElement('div');
            stickyElement.classList.add('notebook-sticky-scroll-element');
            const indentMode = notebookEditor.notebookOptions.getLayoutConfiguration().stickyScrollMode;
            if (indentMode === 'indented') {
                stickyElement.style.paddingLeft = NotebookStickyLine.getParentCount(entry) * 10 + 'px';
            }
            let isCollapsed = false;
            if (entry.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                isCollapsed = entry.cell.foldingState === 2 /* CellFoldingState.Collapsed */;
            }
            const stickyFoldingIcon = new StickyFoldingIcon(isCollapsed, 16);
            stickyFoldingIcon.domNode.classList.add('notebook-sticky-scroll-folding-icon');
            stickyFoldingIcon.setVisible(true);
            const stickyHeader = document.createElement('div');
            stickyHeader.classList.add('notebook-sticky-scroll-header');
            stickyHeader.innerText = entry.label;
            stickyElement.append(stickyFoldingIcon.domNode, stickyHeader);
            return new NotebookStickyLine(stickyElement, stickyFoldingIcon, stickyHeader, entry, notebookEditor);
        }
        disposeCurrentStickyLines() {
            this.currentStickyLines.forEach((value) => {
                value.line.dispose();
            });
        }
        dispose() {
            this._disposables.dispose();
            this.disposeCurrentStickyLines();
            this.notebookOutline.dispose();
            super.dispose();
        }
    };
    exports.NotebookStickyScroll = NotebookStickyScroll;
    exports.NotebookStickyScroll = NotebookStickyScroll = NotebookStickyScroll_1 = __decorate([
        __param(4, contextView_1.IContextMenuService)
    ], NotebookStickyScroll);
    function computeContent(notebookEditor, notebookCellList, notebookOutlineEntries, renderedStickyHeight) {
        // get data about the cell list within viewport ----------------------------------------------------------------------------------------
        const editorScrollTop = notebookEditor.scrollTop - renderedStickyHeight;
        const visibleRange = notebookEditor.visibleRanges[0];
        if (!visibleRange) {
            return new Map();
        }
        // edge case for cell 0 in the notebook is a header ------------------------------------------------------------------------------------
        if (visibleRange.start === 0) {
            const firstCell = notebookEditor.cellAt(0);
            const firstCellEntry = NotebookStickyScroll.getVisibleOutlineEntry(0, notebookOutlineEntries);
            if (firstCell && firstCellEntry && firstCell.cellKind === notebookCommon_1.CellKind.Markup && firstCellEntry.level < 7) {
                if (notebookEditor.scrollTop > 22) {
                    const newMap = NotebookStickyScroll.checkCollapsedStickyLines(firstCellEntry, 100, notebookEditor);
                    return newMap;
                }
            }
        }
        // iterate over cells in viewport ------------------------------------------------------------------------------------------------------
        let cell;
        let cellEntry;
        const startIndex = visibleRange.start - 1; // -1 to account for cells hidden "under" sticky lines.
        for (let currentIndex = startIndex; currentIndex < visibleRange.end; currentIndex++) {
            // store data for current cell, and next cell
            cell = notebookEditor.cellAt(currentIndex);
            if (!cell) {
                return new Map();
            }
            cellEntry = NotebookStickyScroll.getVisibleOutlineEntry(currentIndex, notebookOutlineEntries);
            if (!cellEntry) {
                continue;
            }
            const nextCell = notebookEditor.cellAt(currentIndex + 1);
            if (!nextCell) {
                const sectionBottom = notebookEditor.getLayoutInfo().scrollHeight;
                const linesToRender = Math.floor((sectionBottom) / 22);
                const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
                return newMap;
            }
            const nextCellEntry = NotebookStickyScroll.getVisibleOutlineEntry(currentIndex + 1, notebookOutlineEntries);
            if (!nextCellEntry) {
                continue;
            }
            // check next cell, if markdown with non level 7 entry, that means this is the end of the section (new header) ---------------------
            if (nextCell.cellKind === notebookCommon_1.CellKind.Markup && nextCellEntry.level < 7) {
                const sectionBottom = notebookCellList.getCellViewScrollTop(nextCell);
                const currentSectionStickyHeight = NotebookStickyScroll.computeStickyHeight(cellEntry);
                const nextSectionStickyHeight = NotebookStickyScroll.computeStickyHeight(nextCellEntry);
                // case: we can render the all sticky lines for the current section ------------------------------------------------------------
                if (editorScrollTop + currentSectionStickyHeight < sectionBottom) {
                    const linesToRender = Math.floor((sectionBottom - editorScrollTop) / 22);
                    const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
                    return newMap;
                }
                // case: next section is the same size or bigger, render next entry -----------------------------------------------------------
                else if (nextSectionStickyHeight >= currentSectionStickyHeight) {
                    const newMap = NotebookStickyScroll.checkCollapsedStickyLines(nextCellEntry, 100, notebookEditor);
                    return newMap;
                }
                // case: next section is the smaller, shrink until next section height is greater than the available space ---------------------
                else if (nextSectionStickyHeight < currentSectionStickyHeight) {
                    const availableSpace = sectionBottom - editorScrollTop;
                    if (availableSpace >= nextSectionStickyHeight) {
                        const linesToRender = Math.floor((availableSpace) / 22);
                        const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
                        return newMap;
                    }
                    else {
                        const newMap = NotebookStickyScroll.checkCollapsedStickyLines(nextCellEntry, 100, notebookEditor);
                        return newMap;
                    }
                }
            }
        } // visible range loop close
        // case: all visible cells were non-header cells, so render any headers relevant to their section --------------------------------------
        const sectionBottom = notebookEditor.getLayoutInfo().scrollHeight;
        const linesToRender = Math.floor((sectionBottom - editorScrollTop) / 22);
        const newMap = NotebookStickyScroll.checkCollapsedStickyLines(cellEntry, linesToRender, notebookEditor);
        return newMap;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JTdGlja3lTY3JvbGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld1BhcnRzL25vdGVib29rRWRpdG9yU3RpY2t5U2Nyb2xsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpWGhHLHdDQXNGQztJQWpiRCxNQUFhLGtCQUFtQixTQUFRLHNCQUFVO1FBQ2pELFlBQ2lCLE9BQW9CLEVBQ3BCLFdBQThCLEVBQzlCLE1BQW1CLEVBQ25CLEtBQW1CLEVBQ25CLGNBQStCO1lBRS9DLEtBQUssRUFBRSxDQUFDO1lBTlEsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNwQixnQkFBVyxHQUFYLFdBQVcsQ0FBbUI7WUFDOUIsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUNuQixVQUFLLEdBQUwsS0FBSyxDQUFjO1lBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUcvQyxxQ0FBcUM7WUFDckMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxpQkFBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7Z0JBQ3JHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosaUVBQWlFO1lBQ2pFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLGlCQUFjLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQkFDbEgsSUFBSSxJQUFJLENB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