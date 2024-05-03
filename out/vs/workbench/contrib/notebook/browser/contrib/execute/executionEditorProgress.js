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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/services/userActivity/common/userActivityService"], function (require, exports, decorators_1, lifecycle_1, notebookEditorExtensions_1, notebookCommon_1, notebookExecutionStateService_1, userActivityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExecutionEditorProgressController = void 0;
    let ExecutionEditorProgressController = class ExecutionEditorProgressController extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.executionEditorProgress'; }
        constructor(_notebookEditor, _notebookExecutionStateService, _userActivity) {
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._userActivity = _userActivity;
            this._activityMutex = this._register(new lifecycle_1.MutableDisposable());
            this._register(_notebookEditor.onDidScroll(() => this._update()));
            this._register(_notebookExecutionStateService.onDidChangeExecution(e => {
                if (e.notebook.toString() !== this._notebookEditor.textModel?.uri.toString()) {
                    return;
                }
                this._update();
            }));
            this._register(_notebookEditor.onDidChangeModel(() => this._update()));
        }
        _update() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const cellExecutions = this._notebookExecutionStateService.getCellExecutionsForNotebook(this._notebookEditor.textModel?.uri)
                .filter(exe => exe.state === notebookCommon_1.NotebookCellExecutionState.Executing);
            const notebookExecution = this._notebookExecutionStateService.getExecution(this._notebookEditor.textModel?.uri);
            const executionIsVisible = (exe) => {
                for (const range of this._notebookEditor.visibleRanges) {
                    for (const cell of this._notebookEditor.getCellsInRange(range)) {
                        if (cell.handle === exe.cellHandle) {
                            const top = this._notebookEditor.getAbsoluteTopOfElement(cell);
                            if (this._notebookEditor.scrollTop < top + 5) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            };
            const hasAnyExecution = cellExecutions.length || notebookExecution;
            if (hasAnyExecution && !this._activityMutex.value) {
                this._activityMutex.value = this._userActivity.markActive();
            }
            else if (!hasAnyExecution && this._activityMutex.value) {
                this._activityMutex.clear();
            }
            const shouldShowEditorProgressbarForCellExecutions = cellExecutions.length && !cellExecutions.some(executionIsVisible) && !cellExecutions.some(e => e.isPaused);
            const showEditorProgressBar = !!notebookExecution || shouldShowEditorProgressbarForCellExecutions;
            if (showEditorProgressBar) {
                this._notebookEditor.showProgress();
            }
            else {
                this._notebookEditor.hideProgress();
            }
        }
    };
    exports.ExecutionEditorProgressController = ExecutionEditorProgressController;
    __decorate([
        (0, decorators_1.throttle)(100)
    ], ExecutionEditorProgressController.prototype, "_update", null);
    exports.ExecutionEditorProgressController = ExecutionEditorProgressController = __decorate([
        __param(1, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(2, userActivityService_1.IUserActivityService)
    ], ExecutionEditorProgressController);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ExecutionEditorProgressController.id, ExecutionEditorProgressController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0aW9uRWRpdG9yUHJvZ3Jlc3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9leGVjdXRlL2V4ZWN1dGlvbkVkaXRvclByb2dyZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLGlDQUFpQyxHQUF2QyxNQUFNLGlDQUFrQyxTQUFRLHNCQUFVO2lCQUN6RCxPQUFFLEdBQVcsNENBQTRDLEFBQXZELENBQXdEO1FBSWpFLFlBQ2tCLGVBQWdDLEVBQ2pCLDhCQUErRSxFQUN6RixhQUFvRDtZQUUxRSxLQUFLLEVBQUUsQ0FBQztZQUpTLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNBLG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBZ0M7WUFDeEUsa0JBQWEsR0FBYixhQUFhLENBQXNCO1lBTDFELG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQVN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVsRSxJQUFJLENBQUMsU0FBUyxDQUFDLDhCQUE4QixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0RSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7b0JBQzlFLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsQ0FBQyxDQUFD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