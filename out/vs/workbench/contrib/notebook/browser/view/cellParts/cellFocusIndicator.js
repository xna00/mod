/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, DOM, fastDomNode_1, cellPart_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellFocusIndicator = void 0;
    class CellFocusIndicator extends cellPart_1.CellContentPart {
        constructor(notebookEditor, titleToolbar, top, left, right, bottom) {
            super();
            this.notebookEditor = notebookEditor;
            this.titleToolbar = titleToolbar;
            this.top = top;
            this.left = left;
            this.right = right;
            this.bottom = bottom;
            this.codeFocusIndicator = new fastDomNode_1.FastDomNode(DOM.append(this.left.domNode, DOM.$('.codeOutput-focus-indicator-container', undefined, DOM.$('.codeOutput-focus-indicator.code-focus-indicator'))));
            this.outputFocusIndicator = new fastDomNode_1.FastDomNode(DOM.append(this.left.domNode, DOM.$('.codeOutput-focus-indicator-container', undefined, DOM.$('.codeOutput-focus-indicator.output-focus-indicator'))));
            this._register(DOM.addDisposableListener(this.codeFocusIndicator.domNode, DOM.EventType.CLICK, () => {
                if (this.currentCell) {
                    this.currentCell.isInputCollapsed = !this.currentCell.isInputCollapsed;
                }
            }));
            this._register(DOM.addDisposableListener(this.outputFocusIndicator.domNode, DOM.EventType.CLICK, () => {
                if (this.currentCell) {
                    this.currentCell.isOutputCollapsed = !this.currentCell.isOutputCollapsed;
                }
            }));
            this._register(DOM.addDisposableListener(this.left.domNode, DOM.EventType.DBLCLICK, e => {
                if (!this.currentCell || !this.notebookEditor.hasModel()) {
                    return;
                }
                if (e.target !== this.left.domNode) {
                    // Don't allow dblclick on the codeFocusIndicator/outputFocusIndicator
                    return;
                }
                const clickedOnInput = e.offsetY < this.currentCell.layoutInfo.outputContainerOffset;
                if (clickedOnInput) {
                    this.currentCell.isInputCollapsed = !this.currentCell.isInputCollapsed;
                }
                else {
                    this.currentCell.isOutputCollapsed = !this.currentCell.isOutputCollapsed;
                }
            }));
            this._register(this.titleToolbar.onDidUpdateActions(() => {
                this.updateFocusIndicatorsForTitleMenu();
            }));
        }
        updateInternalLayoutNow(element) {
            if (element.cellKind === notebookCommon_1.CellKind.Markup) {
                const indicatorPostion = this.notebookEditor.notebookOptions.computeIndicatorPosition(element.layoutInfo.totalHeight, element.layoutInfo.foldHintHeight, this.notebookEditor.textModel?.viewType);
                this.bottom.domNode.style.transform = `translateY(${indicatorPostion.bottomIndicatorTop}px)`;
                this.left.setHeight(indicatorPostion.verticalIndicatorHeight);
                this.right.setHeight(indicatorPostion.verticalIndicatorHeight);
                this.codeFocusIndicator.setHeight(indicatorPostion.verticalIndicatorHeight - this.getIndicatorTopMargin() * 2 - element.layoutInfo.chatHeight);
            }
            else {
                const cell = element;
                const layoutInfo = this.notebookEditor.notebookOptions.getLayoutConfiguration();
                const bottomToolbarDimensions = this.notebookEditor.notebookOptions.computeBottomToolbarDimensions(this.notebookEditor.textModel?.viewType);
                const indicatorHeight = cell.layoutInfo.codeIndicatorHeight + cell.layoutInfo.outputIndicatorHeight + cell.layoutInfo.commentHeight;
                this.left.setHeight(indicatorHeight);
                this.right.setHeight(indicatorHeight);
                this.codeFocusIndicator.setHeight(cell.layoutInfo.codeIndicatorHeight);
                this.outputFocusIndicator.setHeight(Math.max(cell.layoutInfo.outputIndicatorHeight - cell.viewContext.notebookOptions.getLayoutConfiguration().focusIndicatorGap, 0));
                this.bottom.domNode.style.transform = `translateY(${cell.layoutInfo.totalHeight - bottomToolbarDimensions.bottomToolbarGap - layoutInfo.cellBottomMargin}px)`;
            }
            this.updateFocusIndicatorsForTitleMenu();
        }
        updateFocusIndicatorsForTitleMenu() {
            const y = (this.currentCell?.layoutInfo.chatHeight ?? 0) + this.getIndicatorTopMargin();
            this.left.domNode.style.transform = `translateY(${y}px)`;
            this.right.domNode.style.transform = `translateY(${y}px)`;
        }
        getIndicatorTopMargin() {
            const layoutInfo = this.notebookEditor.notebookOptions.getLayoutConfiguration();
            if (this.titleToolbar.hasActions) {
                return layoutInfo.editorToolbarHeight + layoutInfo.cellTopMargin;
            }
            else {
                return layoutInfo.cellTopMargin;
            }
        }
    }
    exports.CellFocusIndicator = CellFocusIndicator;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEZvY3VzSW5kaWNhdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxGb2N1c0luZGljYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxrQkFBbUIsU0FBUSwwQkFBZTtRQUl0RCxZQUNVLGNBQXVDLEVBQ3ZDLFlBQWtDLEVBQ2xDLEdBQTZCLEVBQzdCLElBQThCLEVBQzlCLEtBQStCLEVBQy9CLE1BQWdDO1lBRXpDLEtBQUssRUFBRSxDQUFDO1lBUEMsbUJBQWMsR0FBZCxjQUFjLENBQXlCO1lBQ3ZDLGlCQUFZLEdBQVosWUFBWSxDQUFzQjtZQUNsQyxRQUFHLEdBQUgsR0FBRyxDQUEwQjtZQUM3QixTQUFJLEdBQUosSUFBSSxDQUEwQjtZQUM5QixVQUFLLEdBQUwsS0FBSyxDQUEwQjtZQUMvQixXQUFNLEdBQU4sTUFBTSxDQUEwQjtZQUl6QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSx5QkFBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQ25ELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUNqQixHQUFHLENBQUMsQ0FBQyxDQUNKLHVDQUF1QyxFQUN2QyxTQUFTLEVBQ1QsR0FBRyxDQUFDLENBQUMsQ0FBQyxrREFBa0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLHlCQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FDckQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQ0osdUNBQXVDLEVBQ3ZDLFNBQVMsRUFDVCxHQUFHLENBQUMsQ0FBQyxDQUFDLG9EQUFvRCxDQUFDLENB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