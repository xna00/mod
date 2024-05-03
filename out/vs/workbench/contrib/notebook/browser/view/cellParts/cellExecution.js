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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, DOM, async_1, lifecycle_1, cellPart_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellExecutionPart = void 0;
    const UPDATE_EXECUTION_ORDER_GRACE_PERIOD = 200;
    let CellExecutionPart = class CellExecutionPart extends cellPart_1.CellContentPart {
        constructor(_notebookEditor, _executionOrderLabel, _notebookExecutionStateService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._executionOrderLabel = _executionOrderLabel;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this.kernelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._register(this._notebookEditor.onDidChangeActiveKernel(() => {
                if (this.currentCell) {
                    this.kernelDisposables.clear();
                    if (this._notebookEditor.activeKernel) {
                        this.kernelDisposables.add(this._notebookEditor.activeKernel.onDidChange(() => {
                            if (this.currentCell) {
                                this.updateExecutionOrder(this.currentCell.internalMetadata);
                            }
                        }));
                    }
                    this.updateExecutionOrder(this.currentCell.internalMetadata);
                }
            }));
        }
        didRenderCell(element) {
            this.updateExecutionOrder(element.internalMetadata, true);
        }
        updateExecutionOrder(internalMetadata, forceClear = false) {
            if (this._notebookEditor.activeKernel?.implementsExecutionOrder || (!this._notebookEditor.activeKernel && typeof internalMetadata.executionOrder === 'number')) {
                // If the executionOrder was just cleared, and the cell is executing, wait just a bit before clearing the view to avoid flashing
                if (typeof internalMetadata.executionOrder !== 'number' && !forceClear && !!this._notebookExecutionStateService.getCellExecution(this.currentCell.uri)) {
                    const renderingCell = this.currentCell;
                    (0, async_1.disposableTimeout)(() => {
                        if (this.currentCell === renderingCell) {
                            this.updateExecutionOrder(this.currentCell.internalMetadata, true);
                        }
                    }, UPDATE_EXECUTION_ORDER_GRACE_PERIOD, this.cellDisposables);
                    return;
                }
                const executionOrderLabel = typeof internalMetadata.executionOrder === 'number' ?
                    `[${internalMetadata.executionOrder}]` :
                    '[ ]';
                this._executionOrderLabel.innerText = executionOrderLabel;
            }
            else {
                this._executionOrderLabel.innerText = '';
            }
        }
        updateState(element, e) {
            if (e.internalMetadataChanged) {
                this.updateExecutionOrder(element.internalMetadata);
            }
        }
        updateInternalLayoutNow(element) {
            if (element.isInputCollapsed) {
                DOM.hide(this._executionOrderLabel);
            }
            else {
                DOM.show(this._executionOrderLabel);
                const top = element.layoutInfo.editorHeight - 22 + element.layoutInfo.statusBarHeight;
                this._executionOrderLabel.style.top = `${top}px`;
            }
        }
    };
    exports.CellExecutionPart = CellExecutionPart;
    exports.CellExecutionPart = CellExecutionPart = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CellExecutionPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEV4ZWN1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9jZWxsRXhlY3V0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVdoRyxNQUFNLG1DQUFtQyxHQUFHLEdBQUcsQ0FBQztJQUV6QyxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLDBCQUFlO1FBR3JELFlBQ2tCLGVBQXdDLEVBQ3hDLG9CQUFpQyxFQUNsQiw4QkFBK0U7WUFFL0csS0FBSyxFQUFFLENBQUM7WUFKUyxvQkFBZSxHQUFmLGVBQWUsQ0FBeUI7WUFDeEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFhO1lBQ0QsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFnQztZQUx4RyxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFTakUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtnQkFDaEUsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3RCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFFL0IsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUN2QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7NEJBQzdFLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dDQUN0QixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxD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