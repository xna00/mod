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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/notebookVisibleCellObserver", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService"], function (require, exports, async_1, cancellation_1, lifecycle_1, notebookVisibleCellObserver_1, notebookEditorExtensions_1, notebookCellStatusBarService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedStatusBarItemController = void 0;
    let ContributedStatusBarItemController = class ContributedStatusBarItemController extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.statusBar.contributed'; }
        constructor(_notebookEditor, _notebookCellStatusBarService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookCellStatusBarService = _notebookCellStatusBarService;
            this._visibleCells = new Map();
            this._observer = this._register(new notebookVisibleCellObserver_1.NotebookVisibleCellObserver(this._notebookEditor));
            this._register(this._observer.onDidChangeVisibleCells(this._updateVisibleCells, this));
            this._updateEverything();
            this._register(this._notebookCellStatusBarService.onDidChangeProviders(this._updateEverything, this));
            this._register(this._notebookCellStatusBarService.onDidChangeItems(this._updateEverything, this));
        }
        _updateEverything() {
            const newCells = this._observer.visibleCells.filter(cell => !this._visibleCells.has(cell.handle));
            const visibleCellHandles = new Set(this._observer.visibleCells.map(item => item.handle));
            const currentCellHandles = Array.from(this._visibleCells.keys());
            const removedCells = currentCellHandles.filter(handle => !visibleCellHandles.has(handle));
            const itemsToUpdate = currentCellHandles.filter(handle => visibleCellHandles.has(handle));
            this._updateVisibleCells({ added: newCells, removed: removedCells.map(handle => ({ handle })) });
            itemsToUpdate.forEach(handle => this._visibleCells.get(handle)?.update());
        }
        _updateVisibleCells(e) {
            const vm = this._notebookEditor.getViewModel();
            if (!vm) {
                return;
            }
            for (const newCell of e.added) {
                const helper = new CellStatusBarHelper(vm, newCell, this._notebookCellStatusBarService);
                this._visibleCells.set(newCell.handle, helper);
            }
            for (const oldCell of e.removed) {
                this._visibleCells.get(oldCell.handle)?.dispose();
                this._visibleCells.delete(oldCell.handle);
            }
        }
        dispose() {
            super.dispose();
            this._visibleCells.forEach(cell => cell.dispose());
            this._visibleCells.clear();
        }
    };
    exports.ContributedStatusBarItemController = ContributedStatusBarItemController;
    exports.ContributedStatusBarItemController = ContributedStatusBarItemController = __decorate([
        __param(1, notebookCellStatusBarService_1.INotebookCellStatusBarService)
    ], ContributedStatusBarItemController);
    class CellStatusBarHelper extends lifecycle_1.Disposable {
        constructor(_notebookViewModel, _cell, _notebookCellStatusBarService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._notebookCellStatusBarService = _notebookCellStatusBarService;
            this._currentItemIds = [];
            this._currentItemLists = [];
            this._isDisposed = false;
            this._updateThrottler = this._register(new async_1.Throttler());
            this._register((0, lifecycle_1.toDisposable)(() => this._activeToken?.dispose(true)));
            this._updateSoon();
            this._register(this._cell.model.onDidChangeContent(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeLanguage(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeMetadata(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeOutputs(() => this._updateSoon()));
        }
        update() {
            this._updateSoon();
        }
        _updateSoon() {
            // Wait a tick to make sure that the event is fired to the EH before triggering status bar providers
            setTimeout(() => {
                if (!this._isDisposed) {
                    this._updateThrottler.queue(() => this._update());
                }
            }, 0);
        }
        async _update() {
            const cellIndex = this._notebookViewModel.getCellIndex(this._cell);
            const docUri = this._notebookViewModel.notebookDocument.uri;
            const viewType = this._notebookViewModel.notebookDocument.viewType;
            this._activeToken?.dispose(true);
            const tokenSource = this._activeToken = new cancellation_1.CancellationTokenSource();
            const itemLists = await this._notebookCellStatusBarService.getStatusBarItemsForCell(docUri, cellIndex, viewType, tokenSource.token);
            if (tokenSource.token.isCancellationRequested) {
                itemLists.forEach(itemList => itemList.dispose && itemList.dispose());
                return;
            }
            const items = itemLists.map(itemList => itemList.items).flat();
            const newIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
            this._currentItemLists.forEach(itemList => itemList.dispose && itemList.dispose());
            this._currentItemLists = itemLists;
            this._currentItemIds = newIds;
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
            this._activeToken?.dispose(true);
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
            this._currentItemLists.forEach(itemList => itemList.dispose && itemList.dispose());
        }
    }
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ContributedStatusBarItemController.id, ContributedStatusBarItemController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0ZWRTdGF0dXNCYXJJdGVtQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2NlbGxTdGF0dXNCYXIvY29udHJpYnV0ZWRTdGF0dXNCYXJJdGVtQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSxrQ0FBa0MsR0FBeEMsTUFBTSxrQ0FBbUMsU0FBUSxzQkFBVTtpQkFDMUQsT0FBRSxHQUFXLDBDQUEwQyxBQUFyRCxDQUFzRDtRQU0vRCxZQUNrQixlQUFnQyxFQUNsQiw2QkFBNkU7WUFFNUcsS0FBSyxFQUFFLENBQUM7WUFIUyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDRCxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQStCO1lBTjVGLGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQStCLENBQUM7WUFTdkUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseURBQTJCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXZGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFD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