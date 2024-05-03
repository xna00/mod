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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/base/common/themables", "vs/nls", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/lifecycle"], function (require, exports, DOM, codicons_1, themables_1, nls_1, foldingController_1, notebookBrowser_1, cellPart_1, notebookIcons_1, notebookExecutionStateService_1, notebookCommon_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldedCellHint = void 0;
    let FoldedCellHint = class FoldedCellHint extends cellPart_1.CellContentPart {
        constructor(_notebookEditor, _container, _notebookExecutionStateService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._container = _container;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._runButtonListener = this._register(new lifecycle_1.MutableDisposable());
            this._cellExecutionListener = this._register(new lifecycle_1.MutableDisposable());
        }
        didRenderCell(element) {
            this.update(element);
        }
        update(element) {
            if (!this._notebookEditor.hasModel()) {
                this._cellExecutionListener.clear();
                this._runButtonListener.clear();
                return;
            }
            if (element.isInputCollapsed || element.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                this._cellExecutionListener.clear();
                this._runButtonListener.clear();
                DOM.hide(this._container);
            }
            else if (element.foldingState === 2 /* CellFoldingState.Collapsed */) {
                const idx = this._notebookEditor.getViewModel().getCellIndex(element);
                const length = this._notebookEditor.getViewModel().getFoldedLength(idx);
                DOM.reset(this._container, this.getRunFoldedSectionButton({ start: idx, end: idx + length }), this.getHiddenCellsLabel(length), this.getHiddenCellHintButton(element));
                DOM.show(this._container);
                const foldHintTop = element.layoutInfo.previewHeight;
                this._container.style.top = `${foldHintTop}px`;
            }
            else {
                this._cellExecutionListener.clear();
                this._runButtonListener.clear();
                DOM.hide(this._container);
            }
        }
        getHiddenCellsLabel(num) {
            const label = num === 1 ?
                (0, nls_1.localize)('hiddenCellsLabel', "1 cell hidden") :
                (0, nls_1.localize)('hiddenCellsLabelPlural', "{0} cells hidden", num);
            return DOM.$('span.notebook-folded-hint-label', undefined, label);
        }
        getHiddenCellHintButton(element) {
            const expandIcon = DOM.$('span.cell-expand-part-button');
            expandIcon.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.more));
            this._register(DOM.addDisposableListener(expandIcon, DOM.EventType.CLICK, () => {
                const controller = this._notebookEditor.getContribution(foldingController_1.FoldingController.id);
                const idx = this._notebookEditor.getCellIndex(element);
                if (typeof idx === 'number') {
                    controller.setFoldingStateDown(idx, 1 /* CellFoldingState.Expanded */, 1);
                }
            }));
            return expandIcon;
        }
        getRunFoldedSectionButton(range) {
            const runAllContainer = DOM.$('span.folded-cell-run-section-button');
            const cells = this._notebookEditor.getCellsInRange(range);
            const isRunning = cells.some(cell => {
                const cellExecution = this._notebookExecutionStateService.getCellExecution(cell.uri);
                return cellExecution && cellExecution.state === notebookCommon_1.NotebookCellExecutionState.Executing;
            });
            const runAllIcon = isRunning ?
                themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin') :
                codicons_1.Codicon.play;
            runAllContainer.classList.add(...themables_1.ThemeIcon.asClassNameArray(runAllIcon));
            this._runButtonListener.value = DOM.addDisposableListener(runAllContainer, DOM.EventType.CLICK, () => {
                this._notebookEditor.executeNotebookCells(cells);
            });
            this._cellExecutionListener.value = this._notebookExecutionStateService.onDidChangeExecution(() => {
                const isRunning = cells.some(cell => {
                    const cellExecution = this._notebookExecutionStateService.getCellExecution(cell.uri);
                    return cellExecution && cellExecution.state === notebookCommon_1.NotebookCellExecutionState.Executing;
                });
                const runAllIcon = isRunning ?
                    themables_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin') :
                    codicons_1.Codicon.play;
                runAllContainer.className = '';
                runAllContainer.classList.add('folded-cell-run-section-button', ...themables_1.ThemeIcon.asClassNameArray(runAllIcon));
            });
            return runAllContainer;
        }
        updateInternalLayoutNow(element) {
            this.update(element);
        }
    };
    exports.FoldedCellHint = FoldedCellHint;
    exports.FoldedCellHint = FoldedCellHint = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], FoldedCellHint);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGVkQ2VsbEhpbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvZm9sZGVkQ2VsbEhpbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsMEJBQWU7UUFLbEQsWUFDa0IsZUFBZ0MsRUFDaEMsVUFBdUIsRUFDUiw4QkFBK0U7WUFFL0csS0FBSyxFQUFFLENBQUM7WUFKUyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDaEMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNTLG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBZ0M7WUFOL0YsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUM3RCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1FBUWxGLENBQUM7UUFFUSxhQUFhLENBQUMsT0FBNEI7WUFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRU8sTUFBTSxDQUFDLE9BQTRCO1lBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNoQyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksT0FBTyxDQUFDLGdCQUFnQixJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSywrQkFB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