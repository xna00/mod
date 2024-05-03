/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, DOM, async_1, lifecycle_1, platform, notebookBrowser_1, cellPart_1, notebookCellTextModel_1, notebookCommon_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellDragAndDropController = exports.CellDragAndDropPart = void 0;
    exports.performCellDropEdits = performCellDropEdits;
    const $ = DOM.$;
    const DRAGGING_CLASS = 'cell-dragging';
    const GLOBAL_DRAG_CLASS = 'global-drag-active';
    class CellDragAndDropPart extends cellPart_1.CellContentPart {
        constructor(container) {
            super();
            this.container = container;
        }
        didRenderCell(element) {
            this.update(element);
        }
        updateState(element, e) {
            if (e.dragStateChanged) {
                this.update(element);
            }
        }
        update(element) {
            this.container.classList.toggle(DRAGGING_CLASS, element.dragging);
        }
    }
    exports.CellDragAndDropPart = CellDragAndDropPart;
    class CellDragAndDropController extends lifecycle_1.Disposable {
        constructor(notebookEditor, notebookListContainer) {
            super();
            this.notebookEditor = notebookEditor;
            this.notebookListContainer = notebookListContainer;
            this.draggedCells = [];
            this.isScrolling = false;
            this.listOnWillScrollListener = this._register(new lifecycle_1.MutableDisposable());
            this.listInsertionIndicator = DOM.append(notebookListContainer, $('.cell-list-insertion-indicator'));
            this._register(DOM.addDisposableListener(notebookListContainer.ownerDocument.body, DOM.EventType.DRAG_START, this.onGlobalDragStart.bind(this), true));
            this._register(DOM.addDisposableListener(notebookListContainer.ownerDocument.body, DOM.EventType.DRAG_END, this.onGlobalDragEnd.bind(this), true));
            const addCellDragListener = (eventType, handler, useCapture = false) => {
                this._register(DOM.addDisposableListener(notebookEditor.getDomNode(), eventType, e => {
                    const cellDragEvent = this.toCellDragEvent(e);
                    if (cellDragEvent) {
                        handler(cellDragEvent);
                    }
                }, useCapture));
            };
            addCellDragListener(DOM.EventType.DRAG_OVER, event => {
                if (!this.currentDraggedCell) {
                    return;
                }
                event.browserEvent.preventDefault();
                this.onCellDragover(event);
            }, true);
            addCellDragListener(DOM.EventType.DROP, event => {
                if (!this.currentDraggedCell) {
                    return;
                }
                event.browserEvent.preventDefault();
                this.onCellDrop(event);
            });
            addCellDragListener(DOM.EventType.DRAG_LEAVE, event => {
                event.browserEvent.preventDefault();
                this.onCellDragLeave(event);
            });
            this.scrollingDelayer = this._register(new async_1.Delayer(200));
        }
        setList(value) {
            this.list = value;
            this.listOnWillScrollListener.value = this.list.onWillScroll(e => {
                if (!e.scrollTopChanged) {
                    return;
                }
                this.setInsertIndicatorVisibility(false);
                this.isScrolling = true;
                this.scrollingDelayer.trigger(() => {
                    this.isScrolling = false;
                });
            });
        }
        setInsertIndicatorVisibility(visible) {
            this.listInsertionIndicator.style.opacity = visible ? '1' : '0';
        }
        toCellDragEvent(event) {
            const targetTop = this.notebookListContainer.getBoundingClientRect().top;
            const dragOffset = this.list.scrollTop + event.clientY - targetTop;
            const draggedOverCell = this.list.elementAt(dragOffset);
            if (!draggedOverCell) {
                return undefined;
            }
            const cellTop = this.list.getCellViewScrollTop(draggedOverCell);
            const cellHeight = this.list.elementHeight(draggedOverCell);
            const dragPosInElement = dragOffset - cellTop;
            const dragPosRatio = dragPosInElement / cellHeight;
            return {
                browserEvent: event,
                draggedOverCell,
                cellTop,
                cellHeight,
                dragPosRatio
            };
        }
        clearGlobalDragState() {
            this.notebookEditor.getDomNode().classList.remove(GLOBAL_DRAG_CLASS);
        }
        onGlobalDragStart() {
            this.notebookEditor.getDomNode().classList.add(GLOBAL_DRAG_CLASS);
        }
        onGlobalDragEnd() {
            this.notebookEditor.getDomNode().classList.remove(GLOBAL_DRAG_CLASS);
        }
        onCellDragover(event) {
            if (!event.browserEvent.dataTransfer) {
                return;
            }
            if (!this.currentDraggedCell) {
                event.browserEvent.dataTransfer.dropEffect = 'none';
                return;
            }
            if (this.isScrolling || this.currentDraggedCell === event.draggedOverCell) {
                this.setInsertIndicatorVisibility(false);
                return;
            }
            const dropDirection = this.getDropInsertDirection(event.dragPosRatio);
            const insertionIndicatorAbsolutePos = dropDirection === 'above' ? event.cellTop : event.cellTop + event.cellHeight;
            this.updateInsertIndicator(dropDirection, insertionIndicatorAbsolutePos);
        }
        updateInsertIndicator(dropDirection, insertionIndicatorAbsolutePos) {
            const { bottomToolbarGap } = this.notebookEditor.notebookOptions.computeBottomToolbarDimensions(this.notebookEditor.textModel?.viewType);
            const insertionIndicatorTop = insertionIndicatorAbsolutePos - this.list.scrollTop + bottomToolbarGap / 2;
            if (insertionIndicatorTop >= 0) {
                this.listInsertionIndicator.style.top = `${insertionIndicatorTop}px`;
                this.setInsertIndicatorVisibility(true);
            }
            else {
                this.setInsertIndicatorVisibility(false);
            }
        }
        getDropInsertDirection(dragPosRatio) {
            return dragPosRatio < 0.5 ? 'above' : 'below';
        }
        onCellDrop(event) {
            const draggedCell = this.currentDraggedCell;
            if (this.isScrolling || this.currentDraggedCell === event.draggedOverCell) {
                return;
            }
            this.dragCleanup();
            const dropDirection = this.getDropInsertDirection(event.dragPosRatio);
            this._dropImpl(draggedCell, dropDirection, event.browserEvent, event.draggedOverCell);
        }
        getCellRangeAroundDragTarget(draggedCellIndex) {
            const selections = this.notebookEditor.getSelections();
            const modelRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(this.notebookEditor, selections);
            const nearestRange = modelRanges.find(range => range.start <= draggedCellIndex && draggedCellIndex < range.end);
            if (nearestRange) {
                return nearestRange;
            }
            else {
                return { start: draggedCellIndex, end: draggedCellIndex + 1 };
            }
        }
        _dropImpl(draggedCell, dropDirection, ctx, draggedOverCell) {
            const cellTop = this.list.getCellViewScrollTop(draggedOverCell);
            const cellHeight = this.list.elementHeight(draggedOverCell);
            const insertionIndicatorAbsolutePos = dropDirection === 'above' ? cellTop : cellTop + cellHeight;
            const { bottomToolbarGap } = this.notebookEditor.notebookOptions.computeBottomToolbarDimensions(this.notebookEditor.textModel?.viewType);
            const insertionIndicatorTop = insertionIndicatorAbsolutePos - this.list.scrollTop + bottomToolbarGap / 2;
            const editorHeight = this.notebookEditor.getDomNode().getBoundingClientRect().height;
            if (insertionIndicatorTop < 0 || insertionIndicatorTop > editorHeight) {
                // Ignore drop, insertion point is off-screen
                return;
            }
            const isCopy = (ctx.ctrlKey && !platform.isMacintosh) || (ctx.altKey && platform.isMacintosh);
            if (!this.notebookEditor.hasModel()) {
                return;
            }
            const textModel = this.notebookEditor.textModel;
            if (isCopy) {
                const draggedCellIndex = this.notebookEditor.getCellIndex(draggedCell);
                const range = this.getCellRangeAroundDragTarget(draggedCellIndex);
                let originalToIdx = this.notebookEditor.getCellIndex(draggedOverCell);
                if (dropDirection === 'below') {
                    const relativeToIndex = this.notebookEditor.getCellIndex(draggedOverCell);
                    const newIdx = this.notebookEditor.getNextVisibleCellIndex(relativeToIndex);
                    originalToIdx = newIdx;
                }
                let finalSelection;
                let finalFocus;
                if (originalToIdx <= range.start) {
                    finalSelection = { start: originalToIdx, end: originalToIdx + range.end - range.start };
                    finalFocus = { start: originalToIdx + draggedCellIndex - range.start, end: originalToIdx + draggedCellIndex - range.start + 1 };
                }
                else {
                    const delta = (originalToIdx - range.start);
                    finalSelection = { start: range.start + delta, end: range.end + delta };
                    finalFocus = { start: draggedCellIndex + delta, end: draggedCellIndex + delta + 1 };
                }
                textModel.applyEdits([
                    {
                        editType: 1 /* CellEditType.Replace */,
                        index: originalToIdx,
                        count: 0,
                        cells: (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(this.notebookEditor.cellAt(index).model))
                    }
                ], true, { kind: notebookCommon_1.SelectionStateType.Index, focus: this.notebookEditor.getFocus(), selections: this.notebookEditor.getSelections() }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: finalFocus, selections: [finalSelection] }), undefined, true);
                this.notebookEditor.revealCellRangeInView(finalSelection);
            }
            else {
                performCellDropEdits(this.notebookEditor, draggedCell, dropDirection, draggedOverCell);
            }
        }
        onCellDragLeave(event) {
            if (!event.browserEvent.relatedTarget || !DOM.isAncestor(event.browserEvent.relatedTarget, this.notebookEditor.getDomNode())) {
                this.setInsertIndicatorVisibility(false);
            }
        }
        dragCleanup() {
            if (this.currentDraggedCell) {
                this.draggedCells.forEach(cell => cell.dragging = false);
                this.currentDraggedCell = undefined;
                this.draggedCells = [];
            }
            this.setInsertIndicatorVisibility(false);
        }
        registerDragHandle(templateData, cellRoot, dragHandles, dragImageProvider) {
            const container = templateData.container;
            for (const dragHandle of dragHandles) {
                dragHandle.setAttribute('draggable', 'true');
            }
            const onDragEnd = () => {
                if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                    return;
                }
                // Note, templateData may have a different element rendered into it by now
                container.classList.remove(DRAGGING_CLASS);
                this.dragCleanup();
            };
            for (const dragHandle of dragHandles) {
                templateData.templateDisposables.add(DOM.addDisposableListener(dragHandle, DOM.EventType.DRAG_END, onDragEnd));
            }
            const onDragStart = (event) => {
                if (!event.dataTransfer) {
                    return;
                }
                if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                    return;
                }
                this.currentDraggedCell = templateData.currentRenderedCell;
                this.draggedCells = this.notebookEditor.getSelections().map(range => this.notebookEditor.getCellsInRange(range)).flat();
                this.draggedCells.forEach(cell => cell.dragging = true);
                const dragImage = dragImageProvider();
                cellRoot.parentElement.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, 0, 0);
                setTimeout(() => cellRoot.parentElement.removeChild(dragImage), 0); // Comment this out to debug drag image layout
            };
            for (const dragHandle of dragHandles) {
                templateData.templateDisposables.add(DOM.addDisposableListener(dragHandle, DOM.EventType.DRAG_START, onDragStart));
            }
        }
        startExplicitDrag(cell, _dragOffsetY) {
            if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                return;
            }
            this.currentDraggedCell = cell;
            this.setInsertIndicatorVisibility(true);
        }
        explicitDrag(cell, dragOffsetY) {
            if (!this.notebookEditor.notebookOptions.getDisplayOptions().dragAndDropEnabled || !!this.notebookEditor.isReadOnly) {
                return;
            }
            const target = this.list.elementAt(dragOffsetY);
            if (target && target !== cell) {
                const cellTop = this.list.getCellViewScrollTop(target);
                const cellHeight = this.list.elementHeight(target);
                const dropDirection = this.getExplicitDragDropDirection(dragOffsetY, cellTop, cellHeight);
                const insertionIndicatorAbsolutePos = dropDirection === 'above' ? cellTop : cellTop + cellHeight;
                this.updateInsertIndicator(dropDirection, insertionIndicatorAbsolutePos);
            }
            // Try scrolling list if needed
            if (this.currentDraggedCell !== cell) {
                return;
            }
            const notebookViewRect = this.notebookEditor.getDomNode().getBoundingClientRect();
            const eventPositionInView = dragOffsetY - this.list.scrollTop;
            // Percentage from the top/bottom of the screen where we start scrolling while dragging
            const notebookViewScrollMargins = 0.2;
            const maxScrollDeltaPerFrame = 20;
            const eventPositionRatio = eventPositionInView / notebookViewRect.height;
            if (eventPositionRatio < notebookViewScrollMargins) {
                this.list.scrollTop -= maxScrollDeltaPerFrame * (1 - eventPositionRatio / notebookViewScrollMargins);
            }
            else if (eventPositionRatio > 1 - notebookViewScrollMargins) {
                this.list.scrollTop += maxScrollDeltaPerFrame * (1 - ((1 - eventPositionRatio) / notebookViewScrollMargins));
            }
        }
        endExplicitDrag(_cell) {
            this.setInsertIndicatorVisibility(false);
        }
        explicitDrop(cell, ctx) {
            this.currentDraggedCell = undefined;
            this.setInsertIndicatorVisibility(false);
            const target = this.list.elementAt(ctx.dragOffsetY);
            if (!target || target === cell) {
                return;
            }
            const cellTop = this.list.getCellViewScrollTop(target);
            const cellHeight = this.list.elementHeight(target);
            const dropDirection = this.getExplicitDragDropDirection(ctx.dragOffsetY, cellTop, cellHeight);
            this._dropImpl(cell, dropDirection, ctx, target);
        }
        getExplicitDragDropDirection(clientY, cellTop, cellHeight) {
            const dragPosInElement = clientY - cellTop;
            const dragPosRatio = dragPosInElement / cellHeight;
            return this.getDropInsertDirection(dragPosRatio);
        }
        dispose() {
            this.notebookEditor = null;
            super.dispose();
        }
    }
    exports.CellDragAndDropController = CellDragAndDropController;
    function performCellDropEdits(editor, draggedCell, dropDirection, draggedOverCell) {
        const draggedCellIndex = editor.getCellIndex(draggedCell);
        let originalToIdx = editor.getCellIndex(draggedOverCell);
        if (typeof draggedCellIndex !== 'number' || typeof originalToIdx !== 'number') {
            return;
        }
        // If dropped on a folded markdown range, insert after the folding range
        if (dropDirection === 'below') {
            const newIdx = editor.getNextVisibleCellIndex(originalToIdx) ?? originalToIdx;
            originalToIdx = newIdx;
        }
        let selections = editor.getSelections();
        if (!selections.length) {
            selections = [editor.getFocus()];
        }
        let originalFocusIdx = editor.getFocus().start;
        // If the dragged cell is not focused/selected, ignore the current focus/selection and use the dragged idx
        if (!selections.some(s => s.start <= draggedCellIndex && s.end > draggedCellIndex)) {
            selections = [{ start: draggedCellIndex, end: draggedCellIndex + 1 }];
            originalFocusIdx = draggedCellIndex;
        }
        const droppedInSelection = selections.find(range => range.start <= originalToIdx && range.end > originalToIdx);
        if (droppedInSelection) {
            originalToIdx = droppedInSelection.start;
        }
        let numCells = 0;
        let focusNewIdx = originalToIdx;
        let newInsertionIdx = originalToIdx;
        // Compute a set of edits which will be applied in reverse order by the notebook text model.
        // `index`: the starting index of the range, after previous edits have been applied
        // `newIdx`: the destination index, after this edit's range has been removed
        selections.sort((a, b) => b.start - a.start);
        const edits = selections.map(range => {
            const length = range.end - range.start;
            // If this range is before the insertion point, subtract the cells in this range from the "to" index
            let toIndexDelta = 0;
            if (range.end <= newInsertionIdx) {
                toIndexDelta = -length;
            }
            const newIdx = newInsertionIdx + toIndexDelta;
            // If this range contains the focused cell, set the new focus index to the new index of the cell
            if (originalFocusIdx >= range.start && originalFocusIdx <= range.end) {
                const offset = originalFocusIdx - range.start;
                focusNewIdx = newIdx + offset;
            }
            // If below the insertion point, the original index will have been shifted down
            const fromIndexDelta = range.start >= originalToIdx ? numCells : 0;
            const edit = {
                editType: 6 /* CellEditType.Move */,
                index: range.start + fromIndexDelta,
                length,
                newIdx
            };
            numCells += length;
            // If a range was moved down, the insertion index needs to be adjusted
            if (range.end < newInsertionIdx) {
                newInsertionIdx -= length;
            }
            return edit;
        });
        const lastEdit = edits[edits.length - 1];
        const finalSelection = { start: lastEdit.newIdx, end: lastEdit.newIdx + numCells };
        const finalFocus = { start: focusNewIdx, end: focusNewIdx + 1 };
        editor.textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: finalFocus, selections: [finalSelection] }), undefined, true);
        editor.revealCellRangeInView(finalSelection);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERuZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsRG5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWthaEcsb0RBd0ZDO0lBNWVELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDO0lBQ3ZDLE1BQU0saUJBQWlCLEdBQUcsb0JBQW9CLENBQUM7SUFZL0MsTUFBYSxtQkFBb0IsU0FBUSwwQkFBZTtRQUN2RCxZQUNrQixTQUFzQjtZQUV2QyxLQUFLLEVBQUUsQ0FBQztZQUZTLGNBQVMsR0FBVCxTQUFTLENBQWE7UUFHeEMsQ0FBQztRQUVRLGFBQWEsQ0FBQyxPQUF1QjtZQUM3QyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFFUSxXQUFXLENBQUMsT0FBdUIsRUFBRSxDQUFnQztZQUM3RSxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRU8sTUFBTSxDQUFDLE9BQXVCO1lBQ3JDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25FLENBQUM7S0FDRDtJQXBCRCxrREFvQkM7SUFFRCxNQUFhLHlCQUEwQixTQUFRLHNCQUFVO1FBZXhELFlBQ1MsY0FBdUMsRUFDOUIscUJBQWtDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBSEEsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQzlCLDBC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