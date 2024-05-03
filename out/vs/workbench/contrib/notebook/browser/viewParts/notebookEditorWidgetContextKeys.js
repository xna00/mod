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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, DOM, lifecycle_1, contextkey_1, notebookBrowser_1, notebookContextKeys_1, notebookExecutionStateService_1, notebookKernelService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorContextKeys = void 0;
    let NotebookEditorContextKeys = class NotebookEditorContextKeys {
        constructor(_editor, _notebookKernelService, contextKeyService, _extensionService, _notebookExecutionStateService) {
            this._editor = _editor;
            this._notebookKernelService = _notebookKernelService;
            this._extensionService = _extensionService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._viewModelDisposables = new lifecycle_1.DisposableStore();
            this._cellOutputsListeners = [];
            this._selectedKernelDisposables = new lifecycle_1.DisposableStore();
            this._notebookKernel = notebookContextKeys_1.NOTEBOOK_KERNEL.bindTo(contextKeyService);
            this._notebookKernelCount = notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.bindTo(contextKeyService);
            this._notebookKernelSelected = notebookContextKeys_1.NOTEBOOK_KERNEL_SELECTED.bindTo(contextKeyService);
            this._interruptibleKernel = notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.bindTo(contextKeyService);
            this._someCellRunning = notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.bindTo(contextKeyService);
            this._kernelRunning = notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING.bindTo(contextKeyService);
            this._useConsolidatedOutputButton = notebookContextKeys_1.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON.bindTo(contextKeyService);
            this._hasOutputs = notebookContextKeys_1.NOTEBOOK_HAS_OUTPUTS.bindTo(contextKeyService);
            this._viewType = notebookContextKeys_1.NOTEBOOK_VIEW_TYPE.bindTo(contextKeyService);
            this._missingKernelExtension = notebookContextKeys_1.NOTEBOOK_MISSING_KERNEL_EXTENSION.bindTo(contextKeyService);
            this._notebookKernelSourceCount = notebookContextKeys_1.NOTEBOOK_KERNEL_SOURCE_COUNT.bindTo(contextKeyService);
            this._cellToolbarLocation = notebookContextKeys_1.NOTEBOOK_CELL_TOOLBAR_LOCATION.bindTo(contextKeyService);
            this._lastCellFailed = notebookContextKeys_1.NOTEBOOK_LAST_CELL_FAILED.bindTo(contextKeyService);
            this._handleDidChangeModel();
            this._updateForNotebookOptions();
            this._disposables.add(_editor.onDidChangeModel(this._handleDidChangeModel, this));
            this._disposables.add(_notebookKernelService.onDidAddKernel(this._updateKernelContext, this));
            this._disposables.add(_notebookKernelService.onDidChangeSelectedNotebooks(this._updateKernelContext, this));
            this._disposables.add(_notebookKernelService.onDidChangeSourceActions(this._updateKernelContext, this));
            this._disposables.add(_editor.notebookOptions.onDidChangeOptions(this._updateForNotebookOptions, this));
            this._disposables.add(_extensionService.onDidChangeExtensions(this._updateForInstalledExtension, this));
            this._disposables.add(_notebookExecutionStateService.onDidChangeExecution(this._updateForExecution, this));
            this._disposables.add(_notebookExecutionStateService.onDidChangeLastRunFailState(this._updateForLastRunFailState, this));
        }
        dispose() {
            this._disposables.dispose();
            this._viewModelDisposables.dispose();
            this._notebookKernelCount.reset();
            this._notebookKernelSourceCount.reset();
            this._interruptibleKernel.reset();
            this._someCellRunning.reset();
            this._kernelRunning.reset();
            this._viewType.reset();
            (0, lifecycle_1.dispose)(this._cellOutputsListeners);
            this._cellOutputsListeners.length = 0;
        }
        _handleDidChangeModel() {
            this._updateKernelContext();
            this._updateForNotebookOptions();
            this._viewModelDisposables.clear();
            (0, lifecycle_1.dispose)(this._cellOutputsListeners);
            this._cellOutputsListeners.length = 0;
            if (!this._editor.hasModel()) {
                return;
            }
            const recomputeOutputsExistence = () => {
                let hasOutputs = false;
                if (this._editor.hasModel()) {
                    for (let i = 0; i < this._editor.getLength(); i++) {
                        if (this._editor.cellAt(i).outputsViewModels.length > 0) {
                            hasOutputs = true;
                            break;
                        }
                    }
                }
                this._hasOutputs.set(hasOutputs);
            };
            const layoutDisposable = this._viewModelDisposables.add(new lifecycle_1.DisposableStore());
            const addCellOutputsListener = (c) => {
                return c.model.onDidChangeOutputs(() => {
                    layoutDisposable.clear();
                    layoutDisposable.add(DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this._editor.getDomNode()), () => {
                        recomputeOutputsExistence();
                    }));
                });
            };
            for (let i = 0; i < this._editor.getLength(); i++) {
                const cell = this._editor.cellAt(i);
                this._cellOutputsListeners.push(addCellOutputsListener(cell));
            }
            recomputeOutputsExistence();
            this._updateForInstalledExtension();
            this._viewModelDisposables.add(this._editor.onDidChangeViewCells(e => {
                [...e.splices].reverse().forEach(splice => {
                    const [start, deleted, newCells] = splice;
                    const deletedCellOutputStates = this._cellOutputsListeners.splice(start, deleted, ...newCells.map(addCellOutputsListener));
                    (0, lifecycle_1.dispose)(deletedCellOutputStates);
                });
            }));
            this._viewType.set(this._editor.textModel.viewType);
        }
        _updateForExecution(e) {
            if (this._editor.textModel) {
                const notebookExe = this._notebookExecutionStateService.getExecution(this._editor.textModel.uri);
                const notebookCellExe = this._notebookExecutionStateService.getCellExecutionsForNotebook(this._editor.textModel.uri);
                this._kernelRunning.set(notebookCellExe.length > 0 || !!notebookExe);
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                    this._someCellRunning.set(notebookCellExe.length > 0);
                }
            }
            else {
                this._kernelRunning.set(false);
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                    this._someCellRunning.set(false);
                }
            }
        }
        _updateForLastRunFailState(e) {
            if (e.notebook === this._editor.textModel?.uri) {
                this._lastCellFailed.set(e.visible);
            }
        }
        async _updateForInstalledExtension() {
            if (!this._editor.hasModel()) {
                return;
            }
            const viewType = this._editor.textModel.viewType;
            const kernelExtensionId = notebookBrowser_1.KERNEL_EXTENSIONS.get(viewType);
            this._missingKernelExtension.set(!!kernelExtensionId && !(await this._extensionService.getExtension(kernelExtensionId)));
        }
        _updateKernelContext() {
            if (!this._editor.hasModel()) {
                this._notebookKernelCount.reset();
                this._notebookKernelSourceCount.reset();
                this._interruptibleKernel.reset();
                return;
            }
            const { selected, all } = this._notebookKernelService.getMatchingKernel(this._editor.textModel);
            const sourceActions = this._notebookKernelService.getSourceActions(this._editor.textModel, this._editor.scopedContextKeyService);
            this._notebookKernelCount.set(all.length);
            this._notebookKernelSourceCount.set(sourceActions.length);
            this._interruptibleKernel.set(selected?.implementsInterrupt ?? false);
            this._notebookKernelSelected.set(Boolean(selected));
            this._notebookKernel.set(selected?.id ?? '');
            this._selectedKernelDisposables.clear();
            if (selected) {
                this._selectedKernelDisposables.add(selected.onDidChange(() => {
                    this._interruptibleKernel.set(selected?.implementsInterrupt ?? false);
                }));
            }
        }
        _updateForNotebookOptions() {
            const layout = this._editor.notebookOptions.getDisplayOptions();
            this._useConsolidatedOutputButton.set(layout.consolidatedOutputButton);
            this._cellToolbarLocation.set(this._editor.notebookOptions.computeCellToolbarLocation(this._editor.textModel?.viewType));
        }
    };
    exports.NotebookEditorContextKeys = NotebookEditorContextKeys;
    exports.NotebookEditorContextKeys = NotebookEditorContextKeys = __decorate([
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, extensions_1.IExtensionService),
        __param(4, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookEditorContextKeys);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JXaWRnZXRDb250ZXh0S2V5cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3UGFydHMvbm90ZWJvb2tFZGl0b3JXaWRnZXRDb250ZXh0S2V5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBeUI7UUFxQnJDLFlBQ2tCLE9BQWdDLEVBQ3pCLHNCQUErRCxFQUNuRSxpQkFBcUMsRUFDdEMsaUJBQXFELEVBQ3hDLDhCQUErRTtZQUo5RixZQUFPLEdBQVAsT0FBTyxDQUF5QjtZQUNSLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7WUFFbkQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN2QixtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWdDO1lBVi9GLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDckMsMEJBQXFCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDOUMsMEJBQXFCLEdBQWtCLEVBQUUsQ0FBQztZQUMxQywrQkFBMEIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQVNuRSxJQUFJLENBQUMsZUFBZSxHQUFHLHFDQUFlLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLDJDQUFxQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyx1QkFBdUIsR0FBRyw4Q0FBd0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsb0JBQW9CLEdBQUcsbURBQTZCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDcEYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLCtDQUF5QixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyxjQUFjLEdBQUcsb0RBQThCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLDRCQUE0QixHQUFHLDZEQUF1QyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3RHLElBQUksQ0FBQyxXQUFXLEdBQUcsMENBQW9CLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDbEUsSUFBSSxDQUFDLFNBQVMsR0FBRyx3Q0FBa0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsdURBQWlDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDM0YsSUFBSSxDQUFDLDBCQUEwQixHQUFHLGtEQUE0QixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3pGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxvREFBOEIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNyRixJQUFJLENBQUMsZUFBZSxHQUFHLCtDQUF5QixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBRTNFLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBRWpDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDNUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDeEcsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4RyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4RyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUMzRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMxSCxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFTyxxQkFBcUI7WUFFNUIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFFakMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ25DLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUV0QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0seUJBQXlCLEdBQUcsR0FBRyxFQUFFO2dCQUN0QyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUNuRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzs0QkFDekQsVUFBVSxHQUFHLElBQUksQ0FBQzs0QkFDbEIsTUFBTTt3QkFDUCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNsQyxDQUFDLENBQUM7WUFFRixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUUvRSxNQUFNLHNCQUFzQixHQUFHLENBQUMsQ0FBaUIsRUFBRSxFQUFFO2dCQUNwRCxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFO29CQUN0QyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFFekIsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUU7d0JBQ3BHLHlCQUF5QixFQUFFLENBQUM7b0JBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUM7WUFFRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFFRCx5QkFBeUIsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO1lBRXBDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDcEUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3pDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQztvQkFDMUMsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztvQkFDM0gsSUFBQSxtQkFBTyxFQUFDLHVCQUF1QixDQUFDLENBQUM7Z0JBQ2xDLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFDTyxtQkFBbUIsQ0FBQyxDQUFnRTtZQUMzRixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2pHLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckgsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUsscURBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQzNDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLHFEQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUMzQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTywwQkFBMEIsQ0FBQyxDQUFpQztZQUNuRSxJQUFJLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyw0QkFBNEI7WUFDekMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7WUFDakQsTUFBTSxpQkFBaUIsR0FBRyxtQ0FBaUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FDL0IsQ0FBQyxDQUFDLGlCQUFpQixJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVPLG9CQUFvQjtZQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEcsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNqSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxtQkFBbUIsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFN0MsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3hDLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtvQkFDN0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLElBQUksS0FBSyxDQUFDLENBQUM7Z0JBQ3ZFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztRQUVPLHlCQUF5QjtZQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ2hFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzFILENBQUM7S0FDRCxDQUFBO0lBMUxZLDhEQUF5Qjt3Q0FBekIseUJBQXlCO1FBdUJuQyxXQUFBLDhDQUFzQixDQUFBO1FBQ3RCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLDhEQUE4QixDQUFBO09BMUJwQix5QkFBeUIsQ0EwTHJDIn0=