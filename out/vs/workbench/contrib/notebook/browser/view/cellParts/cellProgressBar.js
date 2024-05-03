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
define(["require", "exports", "vs/base/browser/ui/progressbar/progressbar", "vs/platform/theme/browser/defaultStyles", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, progressbar_1, defaultStyles_1, cellPart_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellProgressBar = void 0;
    let CellProgressBar = class CellProgressBar extends cellPart_1.CellContentPart {
        constructor(editorContainer, collapsedInputContainer, _notebookExecutionStateService) {
            super();
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._progressBar = this._register(new progressbar_1.ProgressBar(editorContainer, defaultStyles_1.defaultProgressBarStyles));
            this._progressBar.hide();
            this._collapsedProgressBar = this._register(new progressbar_1.ProgressBar(collapsedInputContainer, defaultStyles_1.defaultProgressBarStyles));
            this._collapsedProgressBar.hide();
        }
        didRenderCell(element) {
            this._updateForExecutionState(element);
        }
        updateForExecutionState(element, e) {
            this._updateForExecutionState(element, e);
        }
        updateState(element, e) {
            if (e.metadataChanged || e.internalMetadataChanged) {
                this._updateForExecutionState(element);
            }
            if (e.inputCollapsedChanged) {
                const exeState = this._notebookExecutionStateService.getCellExecution(element.uri);
                if (element.isInputCollapsed) {
                    this._progressBar.hide();
                    if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                        this._updateForExecutionState(element);
                    }
                }
                else {
                    this._collapsedProgressBar.hide();
                    if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                        this._updateForExecutionState(element);
                    }
                }
            }
        }
        _updateForExecutionState(element, e) {
            const exeState = e?.changed ?? this._notebookExecutionStateService.getCellExecution(element.uri);
            const progressBar = element.isInputCollapsed ? this._collapsedProgressBar : this._progressBar;
            if (exeState?.state === notebookCommon_1.NotebookCellExecutionState.Executing && (!exeState.didPause || element.isInputCollapsed)) {
                showProgressBar(progressBar);
            }
            else {
                progressBar.hide();
            }
        }
    };
    exports.CellProgressBar = CellProgressBar;
    exports.CellProgressBar = CellProgressBar = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CellProgressBar);
    function showProgressBar(progressBar) {
        progressBar.infinite().show(500);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFByb2dyZXNzQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxQcm9ncmVzc0Jhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSwwQkFBZTtRQUluRCxZQUNDLGVBQTRCLEVBQzVCLHVCQUFvQyxFQUNhLDhCQUE4RDtZQUMvRyxLQUFLLEVBQUUsQ0FBQztZQUR5QyxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWdDO1lBRy9HLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFXLENBQUMsZUFBZSxFQUFFLHdDQUF3QixDQUFDLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBRXpCLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQVcsQ0FBQyx1QkFBdUIsRUFBRSx3Q0FBd0IsQ0FBQyxDQUFDLENBQUM7WUFDaEgsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25DLENBQUM7UUFFUSxhQUFhLENBQUMsT0FBdUI7WUFDN0MsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFUSx1QkFBdUIsQ0FBQyxPQUF1QixFQUFFLENBQWtDO1lBQzNGLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVRLFdBQVcsQ0FBQyxPQUF1QixFQUFFLENBQWdDO1lBQzdFLElBQUksQ0FBQyxDQUFDLGVBQWUsSUFBSSxDQUFDLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFFRCxJQUFJLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUM3QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsOEJBQThCLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRixJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN6QixJQUFJLFFBQVEsRUFBRSxLQUFLLEtBQUssMkNBQTBCLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQzlELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDeEMsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUNsQyxJQUFJLFFBQVEsRUFBRSxLQUFLLEtBQUssMkNBQTBCLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQzlELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDeEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxPQUF1QixFQUFFLENBQW1DO1lBQzVGLE1BQU0sUUFBUSxHQUFHLENBQUMsRUFBRSxPQUFPLElBQUksSUFBSSxDQUFDLDhCQUE4QixDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqRyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUM5RixJQUFJLFFBQVEsRUFBRSxLQUFLLEtBQUssMkNBQTBCLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xILGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BCLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXZEWSwwQ0FBZTs4QkFBZixlQUFlO1FBT3pCLFdBQUEsOERBQThCLENBQUE7T0FQcEIsZUFBZSxDQXVEM0I7SUFFRCxTQUFTLGVBQWUsQ0FBQyxXQUF3QjtRQUNoRCxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLENBQUMifQ==